// Strautomator MCP persistence (Firestore)

import {database} from "strautomator-core"
import {McpAuthCode, McpAuthRequest, McpOAuthClient, McpToken} from "./types"
import {getMcpConfig, hashToken, randomToken} from "./utils"
import dayjs from "../dayjs"
import logger from "anyhow"

/** Firestore collection for dynamically registered OAuth clients. */
const COL_CLIENTS = "mcp-clients"
/** Firestore collection for pending authorization requests (consent flow). */
const COL_REQUESTS = "mcp-auth-requests"
/** Firestore collection for single-use authorization codes. */
const COL_CODES = "mcp-auth-codes"
/** Firestore collection for issued access and refresh tokens (stored hashed). */
const COL_TOKENS = "mcp-tokens"

/**
 * Whether a persisted document has passed its dateExpiry.
 */
const isExpired = (doc: {dateExpiry?: Date}): boolean => {
    if (!doc?.dateExpiry) {
        return true
    }
    return dayjs(doc.dateExpiry).isBefore(dayjs())
}

/**
 * MCP OAuth store backed by Firestore.
 */
export class McpStore {
    private constructor() {}
    private static _instance: McpStore
    static get Instance() {
        return this._instance || (this._instance = new this())
    }

    // CLIENTS
    // --------------------------------------------------------------------------

    /**
     * Persist a dynamically registered OAuth client.
     */
    saveClient = async (client: McpOAuthClient): Promise<void> => {
        await database.set(COL_CLIENTS, client, client.id)
        logger.info("McpStore.saveClient", client.id, client.clientName || "unnamed", client.tokenEndpointAuthMethod)
    }

    /**
     * Load a registered client by ID. Expired registrations are deleted and return null.
     */
    getClient = async (clientId: string): Promise<McpOAuthClient> => {
        if (!clientId) {
            return null
        }

        const client: McpOAuthClient = await database.get(COL_CLIENTS, clientId)
        if (!client) {
            return null
        }
        if (isExpired(client)) {
            await database.delete(COL_CLIENTS, clientId)
            return null
        }

        return client
    }

    // AUTH REQUESTS
    // --------------------------------------------------------------------------

    /**
     * Save a pending authorization request while the user signs in or reviews consent.
     */
    saveAuthRequest = async (request: McpAuthRequest): Promise<void> => {
        await database.set(COL_REQUESTS, request, request.id)
    }

    /**
     * Load a pending authorization request. Expired requests are deleted and return null.
     */
    getAuthRequest = async (id: string): Promise<McpAuthRequest> => {
        if (!id) {
            return null
        }

        const request: McpAuthRequest = await database.get(COL_REQUESTS, id)
        if (!request) {
            return null
        }
        if (isExpired(request)) {
            await database.delete(COL_REQUESTS, id)
            return null
        }

        return request
    }

    /**
     * Remove a pending authorization request after consent or denial.
     */
    deleteAuthRequest = async (id: string): Promise<void> => {
        try {
            await database.delete(COL_REQUESTS, id)
        } catch (ex) {
            logger.warn("McpStore.deleteAuthRequest", id, ex)
        }
    }

    // AUTH CODES
    // --------------------------------------------------------------------------

    /**
     * Issue a single-use authorization code. Only the SHA-256 hash is stored.
     */
    issueAuthCode = async (data: Omit<McpAuthCode, "id">): Promise<string> => {
        const code = randomToken(32)
        const doc: McpAuthCode = {id: hashToken(code), ...data}
        await database.set(COL_CODES, doc, doc.id)
        return code
    }

    /**
     * Load an authorization code without consuming it. Expired codes are deleted and return null.
     */
    getAuthCode = async (code: string): Promise<McpAuthCode> => {
        if (!code) {
            return null
        }

        const id = hashToken(code)
        const doc: McpAuthCode = await database.get(COL_CODES, id)
        if (!doc) {
            return null
        }
        if (isExpired(doc)) {
            await database.delete(COL_CODES, id)
            return null
        }

        return doc
    }

    /**
     * Consume an authorization code after the token request has been fully validated.
     * Uses a Firestore transaction so only one concurrent exchange can succeed.
     */
    consumeAuthCode = async (code: string): Promise<McpAuthCode> => {
        if (!code) {
            return null
        }

        const id = hashToken(code)

        return database.runTransaction(async (tx) => {
            const doc: McpAuthCode = await tx.get(COL_CODES, id)
            if (!doc) {
                return null
            }

            tx.delete(COL_CODES, id)
            if (isExpired(doc)) {
                return null
            }

            return doc
        })
    }

    // TOKENS
    // --------------------------------------------------------------------------

    /**
     * Issue a new access/refresh token pair. Previous tokens for the same grant are not affected
     * until the refresh token is consumed or revoked.
     */
    issueTokens = async (data: {clientId: string; userId: string; resource: string; scope: string}): Promise<{accessToken: string; refreshToken: string; expiresIn: number}> => {
        const config = getMcpConfig()
        const accessToken = `mcp_at_${randomToken(32)}`
        const refreshToken = `mcp_rt_${randomToken(32)}`
        const accessId = hashToken(accessToken)
        const refreshId = hashToken(refreshToken)
        const now = dayjs()

        const access: McpToken = {
            id: accessId,
            type: "access",
            clientId: data.clientId,
            userId: data.userId,
            resource: data.resource,
            scope: data.scope,
            refreshId,
            dateExpiry: now.add(config.accessTokenHours, "hours").toDate()
        }
        const refresh: McpToken = {
            id: refreshId,
            type: "refresh",
            clientId: data.clientId,
            userId: data.userId,
            resource: data.resource,
            scope: data.scope,
            accessId,
            dateExpiry: now.add(config.refreshTokenDays, "days").toDate()
        }

        await database.set(COL_TOKENS, access, access.id)
        await database.set(COL_TOKENS, refresh, refresh.id)

        return {accessToken, refreshToken, expiresIn: config.accessTokenHours * 3600}
    }

    /**
     * Validate a bearer access token for MCP requests. Expired tokens are deleted on read.
     */
    getAccessToken = async (accessToken: string): Promise<McpToken> => {
        if (!accessToken) {
            return null
        }

        const id = hashToken(accessToken)
        const doc: McpToken = await database.get(COL_TOKENS, id)
        if (!doc || doc.type != "access") {
            return null
        }
        if (isExpired(doc)) {
            await database.delete(COL_TOKENS, id)
            return null
        }

        return doc
    }

    /**
     * Load a refresh token without consuming it. Expired tokens are deleted and return null.
     */
    getRefreshToken = async (refreshToken: string): Promise<McpToken> => {
        if (!refreshToken) {
            return null
        }

        const id = hashToken(refreshToken)
        const doc: McpToken = await database.get(COL_TOKENS, id)
        if (!doc || doc.type != "refresh") {
            return null
        }
        if (isExpired(doc)) {
            await database.delete(COL_TOKENS, id)
            return null
        }

        return doc
    }

    /**
     * Consume a refresh token (rotation). Deletes the refresh token and its paired access token
     * inside a Firestore transaction so only one concurrent refresh can succeed.
     */
    consumeRefreshToken = async (refreshToken: string): Promise<McpToken> => {
        if (!refreshToken) {
            return null
        }

        const id = hashToken(refreshToken)

        try {
            return await database.runTransaction(async (tx) => {
                const doc: McpToken = await tx.get(COL_TOKENS, id)
                if (!doc || doc.type != "refresh") {
                    return null
                }

                tx.delete(COL_TOKENS, id)
                if (doc.accessId) {
                    tx.delete(COL_TOKENS, doc.accessId)
                }
                if (isExpired(doc)) {
                    return null
                }

                return doc
            })
        } catch (ex) {
            logger.error("McpStore.consumeRefreshToken", id, ex)
            return null
        }
    }

    /**
     * Revoke an access or refresh token and its paired token, if present.
     */
    revokeToken = async (token: string): Promise<void> => {
        if (!token) {
            return
        }

        const id = hashToken(token)
        const doc: McpToken = await database.get(COL_TOKENS, id)
        if (!doc) {
            return
        }

        await database.delete(COL_TOKENS, id)
        const pairedId = doc.type == "access" ? doc.refreshId : doc.accessId
        if (pairedId) {
            try {
                await database.delete(COL_TOKENS, pairedId)
            } catch (ex) {
                logger.warn("McpStore.revokeToken", "Failed to delete paired token", ex)
            }
        }
    }
}

export default McpStore.Instance
