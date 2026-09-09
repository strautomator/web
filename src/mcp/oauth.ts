// Strautomator MCP OAuth 2.1 authorization server

import {users, UserData} from "strautomator-core"
import {consentPage, errorPage, proRequiredPage} from "./html"
import store from "./store"
import {McpAuthRequest, McpOAuthClient} from "./types"
import {firstString, getMcpConfig, hashToken, isValidRedirectUri, randomToken, setCorsHeaders, verifyPkce} from "./utils"
import crypto from "crypto"
import express = require("express")
import logger from "anyhow"
import dayjs from "../dayjs"
const sessions = require("client-sessions")

/** Grant types advertised and accepted by this authorization server. */
const supportedGrantTypes = ["authorization_code", "refresh_token"]
/** Response types supported on the authorize endpoint. */
const supportedResponseTypes = ["code"]
/** Token endpoint client authentication methods (public clients use "none"). */
const supportedAuthMethods = ["none", "client_secret_post", "client_secret_basic"]

/** Lazy-initialized session middleware (same cookie as the Strava login flow). */
let sessionMiddleware: express.RequestHandler

// SESSION
// --------------------------------------------------------------------------

/**
 * Return the client-sessions middleware used to read the Strava login cookie on the consent page.
 */
const getSessionMiddleware = (): express.RequestHandler => {
    if (!sessionMiddleware) {
        const config = getMcpConfig()
        sessionMiddleware = sessions({
            cookieName: config.cookieName,
            secret: config.cookieSecret,
            duration: 7 * 24 * 60 * 60 * 1000
        })
    }
    return sessionMiddleware
}

/**
 * Wrap a route handler so the Strava session cookie is available on the request.
 */
const withSession = (handler: express.RequestHandler): express.RequestHandler => {
    return (req, res, next) => {
        getSessionMiddleware()(req, res, () => handler(req, res, next))
    }
}

// INTERNAL HELPERS
// --------------------------------------------------------------------------

/**
 * Redirect back to the MCP client with OAuth query parameters (code or error).
 */
const oauthRedirect = (res: express.Response, redirectUri: string, params: Record<string, string>): void => {
    const url = new URL(redirectUri)
    for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null && value !== "") {
            url.searchParams.set(key, value)
        }
    }
    res.redirect(302, url.toString())
}

/**
 * Send a JSON OAuth error response.
 */
const oauthErrorJson = (res: express.Response, status: number, error: string, description: string): void => {
    res.status(status).json({error, error_description: description})
}

/**
 * Parse client_id and client_secret from an HTTP Basic Authorization header.
 */
const parseBasicClient = (req: express.Request): {clientId?: string; clientSecret?: string} => {
    const header = req.headers.authorization || ""
    if (!header.toLowerCase().startsWith("basic ")) {
        return {}
    }

    try {
        const decoded = Buffer.from(header.substring(6).trim(), "base64").toString("utf8")
        const idx = decoded.indexOf(":")
        if (idx < 0) {
            return {clientId: decoded}
        }
        return {clientId: decoded.substring(0, idx), clientSecret: decoded.substring(idx + 1)}
    } catch {
        return {}
    }
}

/**
 * Authenticate the OAuth client on the token and revoke endpoints.
 * Public clients (token_endpoint_auth_method "none") skip secret validation.
 */
const authenticateClient = async (req: express.Request): Promise<{client: McpOAuthClient; error?: string}> => {
    const basic = parseBasicClient(req)
    const clientId = firstString(req.body?.client_id) || basic.clientId
    const clientSecret = firstString(req.body?.client_secret) || basic.clientSecret
    const client = await store.getClient(clientId)

    if (!client) {
        return {client: null, error: "invalid_client"}
    }

    if (client.tokenEndpointAuthMethod == "none") {
        return {client}
    }

    if (!client.clientSecretHash || !clientSecret) {
        return {client: null, error: "invalid_client"}
    }
    const expected = Buffer.from(client.clientSecretHash)
    const actual = Buffer.from(hashToken(clientSecret))
    if (expected.length != actual.length || !crypto.timingSafeEqual(expected, actual)) {
        return {client: null, error: "invalid_client"}
    }

    return {client}
}

/**
 * Resolve the logged-in Strautomator user from the Strava session cookie.
 * Returns null when the user has not signed in yet.
 */
const getLoggedUser = async (req: express.Request): Promise<UserData> => {
    const config = getMcpConfig()
    const session = (req as any)[config.cookieName]
    const userId = session?.userId || config.assumeUser
    if (!userId) {
        return null
    }

    try {
        return await users.getById(userId)
    } catch (ex) {
        logger.warn("McpOAuth.getLoggedUser", userId, ex)
        return null
    }
}

/**
 * Compare two resource indicator URIs, ignoring trailing slashes.
 */
const resourceMatches = (requested: string, expected: string): boolean => {
    if (!requested) {
        return true
    }
    const a = requested.replace(/\/+$/, "")
    const b = expected.replace(/\/+$/, "")
    return a == b
}

// METADATA
// --------------------------------------------------------------------------

/**
 * Protected resource metadata (RFC 9728).
 */
export const protectedResourceMetadata = (_req: express.Request, res: express.Response): void => {
    const config = getMcpConfig()
    setCorsHeaders(res)
    res.json({
        resource: config.resource,
        authorization_servers: [config.issuer],
        bearer_methods_supported: ["header"],
        scopes_supported: [config.scope],
        resource_name: "Strautomator MCP"
    })
}

/**
 * Authorization server metadata (RFC 8414).
 */
export const authorizationServerMetadata = (_req: express.Request, res: express.Response): void => {
    const config = getMcpConfig()
    setCorsHeaders(res)
    res.json({
        issuer: config.issuer,
        authorization_endpoint: `${config.issuer}/mcp/oauth/authorize`,
        token_endpoint: `${config.issuer}/mcp/oauth/token`,
        registration_endpoint: `${config.issuer}/mcp/oauth/register`,
        revocation_endpoint: `${config.issuer}/mcp/oauth/revoke`,
        scopes_supported: [config.scope],
        response_types_supported: supportedResponseTypes,
        grant_types_supported: supportedGrantTypes,
        token_endpoint_auth_methods_supported: supportedAuthMethods,
        revocation_endpoint_auth_methods_supported: supportedAuthMethods,
        code_challenge_methods_supported: ["S256"],
        resource_indicators_supported: true
    })
}

// DYNAMIC CLIENT REGISTRATION
// --------------------------------------------------------------------------

/**
 * Dynamic client registration (RFC 7591).
 */
export const registerClient = async (req: express.Request, res: express.Response): Promise<void> => {
    try {
        setCorsHeaders(res)

        const body = req.body || {}
        const redirectUris: string[] = Array.isArray(body.redirect_uris) ? body.redirect_uris : []
        if (redirectUris.length < 1) {
            return oauthErrorJson(res, 400, "invalid_redirect_uri", "redirect_uris is required")
        }
        if (redirectUris.some((uri) => !isValidRedirectUri(uri))) {
            return oauthErrorJson(res, 400, "invalid_redirect_uri", "One or more redirect_uris are not allowed")
        }

        const grantTypes: string[] = Array.isArray(body.grant_types) && body.grant_types.length > 0 ? body.grant_types : ["authorization_code", "refresh_token"]
        if (grantTypes.some((g) => !supportedGrantTypes.includes(g))) {
            return oauthErrorJson(res, 400, "invalid_client_metadata", "Unsupported grant_types")
        }

        const responseTypes: string[] = Array.isArray(body.response_types) && body.response_types.length > 0 ? body.response_types : ["code"]
        if (responseTypes.some((r) => !supportedResponseTypes.includes(r))) {
            return oauthErrorJson(res, 400, "invalid_client_metadata", "Unsupported response_types")
        }

        let tokenEndpointAuthMethod = firstString(body.token_endpoint_auth_method) || "none"
        if (!supportedAuthMethods.includes(tokenEndpointAuthMethod)) {
            return oauthErrorJson(res, 400, "invalid_client_metadata", "Unsupported token_endpoint_auth_method")
        }

        const config = getMcpConfig()
        const now = dayjs()
        const clientId = `st_${crypto.randomBytes(16).toString("hex")}`
        const confidential = tokenEndpointAuthMethod != "none"
        const clientSecret = confidential ? randomToken(32) : null

        const client: McpOAuthClient = {
            id: clientId,
            clientName: firstString(body.client_name).substring(0, 120) || undefined,
            clientSecretHash: clientSecret ? hashToken(clientSecret) : undefined,
            tokenEndpointAuthMethod: tokenEndpointAuthMethod as McpOAuthClient["tokenEndpointAuthMethod"],
            redirectUris,
            grantTypes,
            responseTypes,
            dateIssued: now.toDate(),
            dateExpiry: now.add(config.clientDays, "days").toDate()
        }

        await store.saveClient(client)

        const result: any = {
            client_id: client.id,
            client_id_issued_at: now.unix(),
            // Public clients have no secret (0). Confidential clients expire with the registration.
            client_secret_expires_at: confidential ? dayjs(client.dateExpiry).unix() : 0,
            redirect_uris: client.redirectUris,
            grant_types: client.grantTypes,
            response_types: client.responseTypes,
            token_endpoint_auth_method: client.tokenEndpointAuthMethod,
            client_name: client.clientName
        }
        if (clientSecret) {
            result.client_secret = clientSecret
        }

        logger.info("McpOAuth.registerClient", client.id, client.clientName || "unnamed", `${redirectUris.length} redirect URIs`)
        res.status(201).json(result)
    } catch (ex) {
        logger.error("McpOAuth.registerClient", ex)
        oauthErrorJson(res, 500, "server_error", "Failed to register client")
    }
}

/**
 * Validate the authorize query string and persist a pending authorization request.
 * The request survives the Strava login redirect and is referenced by request_id.
 */
const createAuthRequest = async (req: express.Request): Promise<{request?: McpAuthRequest; error?: string; description?: string; redirectUri?: string; state?: string}> => {
    const config = getMcpConfig()
    const clientId = firstString(req.query.client_id)
    const redirectUri = firstString(req.query.redirect_uri)
    const responseType = firstString(req.query.response_type) || "code"
    const state = firstString(req.query.state)
    const codeChallenge = firstString(req.query.code_challenge)
    const codeChallengeMethod = firstString(req.query.code_challenge_method)
    const resource = firstString(req.query.resource) || config.resource
    const client = await store.getClient(clientId)
    if (!client) {
        return {error: "invalid_client", description: "Unknown client_id"}
    }
    if (!client.redirectUris.includes(redirectUri)) {
        return {error: "invalid_request", description: "redirect_uri is not registered for this client"}
    }
    if (responseType != "code") {
        return {error: "unsupported_response_type", description: "Only response_type=code is supported", redirectUri, state}
    }
    if (!codeChallenge || codeChallengeMethod.toUpperCase() != "S256") {
        return {error: "invalid_request", description: "PKCE S256 is required", redirectUri, state}
    }
    if (!resourceMatches(resource, config.resource)) {
        return {error: "invalid_target", description: "resource does not match this MCP server", redirectUri, state}
    }

    const request: McpAuthRequest = {
        id: randomToken(18),
        clientId: client.id,
        redirectUri,
        state,
        codeChallenge,
        codeChallengeMethod: "S256",
        resource: config.resource,
        scope: config.scope,
        consentToken: randomToken(18),
        dateExpiry: dayjs().add(config.authRequestMinutes, "minutes").toDate()
    }
    await store.saveAuthRequest(request)
    return {request}
}

// AUTHORIZATION
// --------------------------------------------------------------------------

/**
 * Authorization endpoint (authorization code + PKCE).
 * GET shows the consent page; POST records the user's decision.
 */
export const authorize = withSession(async (req: express.Request, res: express.Response): Promise<void> => {
    const config = getMcpConfig()

    try {
        let request: McpAuthRequest
        const requestId = firstString(req.body?.request_id) || firstString(req.query.request_id)

        if (requestId) {
            // Resume a pending request (after Strava login or after the canonical redirect).
            request = await store.getAuthRequest(requestId)
            if (!request) {
                res.status(400).send(errorPage("Authorization expired", "This authorization request is no longer valid. Start the connection again from your MCP client."))
                return
            }
        } else if (req.method == "GET") {
            // First visit from the MCP client: validate params, persist, then redirect to a stable URL.
            const created = await createAuthRequest(req)
            if (created.error) {
                if (created.redirectUri) {
                    oauthRedirect(res, created.redirectUri, {error: created.error, error_description: created.description, state: created.state, iss: config.issuer})
                    return
                }
                res.status(400).send(errorPage("Invalid request", created.description || created.error))
                return
            }
            // Canonical URL so refreshing the consent page does not invalidate the consent_token.
            res.redirect(302, `/mcp/oauth/authorize?request_id=${encodeURIComponent(created.request.id)}`)
            return
        } else {
            res.status(400).send(errorPage("Invalid request", "Missing authorization request."))
            return
        }

        const user = await getLoggedUser(req)
        if (!user) {
            const returnPath = `/mcp/oauth/authorize?request_id=${encodeURIComponent(request.id)}`
            res.redirect(302, `/auth/login?redirect-url=${encodeURIComponent(returnPath)}`)
            return
        }
        if (!user.isPro) {
            res.status(403).send(proRequiredPage())
            return
        }

        if (req.method == "POST") {
            const consentToken = firstString(req.body?.consent_token)
            const decision = firstString(req.body?.decision)
            if (!consentToken || consentToken != request.consentToken) {
                res.status(400).send(errorPage("Invalid request", "The consent form could not be validated. Please try again."))
                return
            }

            await store.deleteAuthRequest(request.id)

            if (decision != "approve") {
                oauthRedirect(res, request.redirectUri, {error: "access_denied", error_description: "The user denied the request", state: request.state, iss: config.issuer})
                return
            }

            const code = await store.issueAuthCode({
                clientId: request.clientId,
                userId: user.id,
                redirectUri: request.redirectUri,
                codeChallenge: request.codeChallenge,
                resource: request.resource,
                scope: request.scope,
                dateExpiry: dayjs().add(config.authCodeMinutes, "minutes").toDate()
            })

            logger.info("McpOAuth.authorize", `User ${user.id}`, `Client ${request.clientId}`, "Authorized")
            oauthRedirect(res, request.redirectUri, {code, state: request.state, iss: config.issuer})
            return
        }

        const client = await store.getClient(request.clientId)
        res.send(consentPage({clientName: client?.clientName || "MCP client", userName: user.displayName || user.id, requestId: request.id, consentToken: request.consentToken}))
    } catch (ex) {
        logger.error("McpOAuth.authorize", ex)
        res.status(500).send(errorPage("Server error", "Could not complete the authorization request."))
    }
})

// TOKEN ENDPOINT
// --------------------------------------------------------------------------

/**
 * Token endpoint (authorization_code and refresh_token grants).
 */
export const token = async (req: express.Request, res: express.Response): Promise<void> => {
    setCorsHeaders(res)
    res.setHeader("Cache-Control", "no-store")
    res.setHeader("Pragma", "no-cache")

    try {
        const auth = await authenticateClient(req)
        if (!auth.client) {
            res.setHeader("WWW-Authenticate", 'Basic realm="mcp"')
            return oauthErrorJson(res, 401, "invalid_client", "Client authentication failed")
        }

        const grantType = firstString(req.body?.grant_type)
        if (grantType == "authorization_code") {
            const code = firstString(req.body?.code)
            const redirectUri = firstString(req.body?.redirect_uri)
            const codeVerifier = firstString(req.body?.code_verifier)
            const resource = firstString(req.body?.resource)

            // RFC 8707: reject before touching the authorization code so the client can retry.
            if (!resource) {
                return oauthErrorJson(res, 400, "invalid_target", "resource parameter is required and must match the MCP server")
            }

            const authCode = await store.getAuthCode(code)
            if (!authCode || authCode.clientId != auth.client.id) {
                return oauthErrorJson(res, 400, "invalid_grant", "Invalid authorization code")
            }
            if (authCode.redirectUri != redirectUri) {
                return oauthErrorJson(res, 400, "invalid_grant", "redirect_uri mismatch")
            }
            if (!verifyPkce(codeVerifier, authCode.codeChallenge)) {
                return oauthErrorJson(res, 400, "invalid_grant", "PKCE verification failed")
            }
            if (!resourceMatches(resource, authCode.resource)) {
                return oauthErrorJson(res, 400, "invalid_target", "resource parameter is required and must match the MCP server")
            }

            const consumed = await store.consumeAuthCode(code)
            if (!consumed) {
                return oauthErrorJson(res, 400, "invalid_grant", "Invalid authorization code")
            }

            const tokens = await store.issueTokens({clientId: auth.client.id, userId: consumed.userId, resource: consumed.resource, scope: consumed.scope})
            logger.info("McpOAuth.token", `User ${consumed.userId}`, `Client ${auth.client.id}`, "authorization_code")
            res.json({access_token: tokens.accessToken, token_type: "Bearer", expires_in: tokens.expiresIn, refresh_token: tokens.refreshToken, scope: consumed.scope})
            return
        }

        if (grantType == "refresh_token") {
            const refreshToken = firstString(req.body?.refresh_token)
            const resource = firstString(req.body?.resource)

            if (!resource) {
                return oauthErrorJson(res, 400, "invalid_target", "resource parameter is required and must match the MCP server")
            }

            const existing = await store.getRefreshToken(refreshToken)
            if (!existing || existing.clientId != auth.client.id) {
                return oauthErrorJson(res, 400, "invalid_grant", "Invalid refresh token")
            }
            if (!resourceMatches(resource, existing.resource)) {
                return oauthErrorJson(res, 400, "invalid_target", "resource parameter is required and must match the MCP server")
            }

            const consumed = await store.consumeRefreshToken(refreshToken)
            if (!consumed) {
                return oauthErrorJson(res, 400, "invalid_grant", "Invalid refresh token")
            }

            const tokens = await store.issueTokens({clientId: consumed.clientId, userId: consumed.userId, resource: consumed.resource, scope: consumed.scope})
            logger.info("McpOAuth.token", `User ${consumed.userId}`, `Client ${auth.client.id}`, "refresh_token")
            res.json({access_token: tokens.accessToken, token_type: "Bearer", expires_in: tokens.expiresIn, refresh_token: tokens.refreshToken, scope: consumed.scope})
            return
        }

        oauthErrorJson(res, 400, "unsupported_grant_type", "Only authorization_code and refresh_token are supported")
    } catch (ex) {
        logger.error("McpOAuth.token", ex)
        oauthErrorJson(res, 500, "server_error", "Token request failed")
    }
}

/**
 * Token revocation (RFC 7009). Always returns 200 per the spec, even on errors.
 */
export const revoke = async (req: express.Request, res: express.Response): Promise<void> => {
    setCorsHeaders(res)

    try {
        const auth = await authenticateClient(req)
        if (!auth.client) {
            return oauthErrorJson(res, 401, "invalid_client", "Client authentication failed")
        }

        const tokenValue = firstString(req.body?.token)
        await store.revokeToken(tokenValue)
        res.status(200).send()
    } catch (ex) {
        logger.error("McpOAuth.revoke", ex)
        res.status(200).send()
    }
}
