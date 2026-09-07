// Strautomator MCP helpers

import crypto from "crypto"
import _ from "lodash"
import type {UserData} from "strautomator-core"

/**
 * MCP runtime config derived from SetMeUp settings.
 */
export const getMcpConfig = () => {
    const settings = require("setmeup").settings
    const mcp = settings.mcp || {}
    const appUrl = (settings.app.url || "").replace(/\/+$/, "")

    return {
        appUrl,
        issuer: appUrl,
        resource: `${appUrl}/mcp`,
        mcpPath: mcp.path || "/mcp",
        scope: mcp.scope || "mcp",
        accessTokenHours: mcp.accessTokenHours || 1,
        refreshTokenDays: mcp.refreshTokenDays || 30,
        authCodeMinutes: mcp.authCodeMinutes || 10,
        authRequestMinutes: mcp.authRequestMinutes || 15,
        clientDays: mcp.clientDays || 365,
        cookieName: settings.cookie.sessionName,
        cookieSecret: settings.cookie.secret,
        protocolVersions: ["2025-11-25", "2025-06-18", "2025-03-26", "2024-11-05"]
    }
}

/**
 * Encode a buffer as base64url (no padding).
 */
export const toBase64Url = (value: Buffer | string): string => {
    const buf = Buffer.isBuffer(value) ? value : Buffer.from(value)
    return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "")
}

/**
 * Decode a base64url string.
 */
export const fromBase64Url = (value: string): Buffer => {
    const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((value.length + 3) % 4)
    return Buffer.from(padded, "base64")
}

/**
 * Cryptographically random URL-safe token.
 */
export const randomToken = (bytes: number = 32): string => {
    return toBase64Url(crypto.randomBytes(bytes))
}

/**
 * SHA-256 hex digest of a string.
 */
export const hashToken = (value: string): string => {
    return crypto.createHash("sha256").update(value).digest("hex")
}

/**
 * S256 PKCE challenge for the given verifier.
 */
export const createPkceChallenge = (verifier: string): string => {
    return toBase64Url(crypto.createHash("sha256").update(verifier).digest())
}

/**
 * Constant-time PKCE S256 verification.
 */
export const verifyPkce = (verifier: string, challenge: string): boolean => {
    if (!verifier || !challenge) {
        return false
    }
    if (verifier.length < 43 || verifier.length > 128) {
        return false
    }

    const expected = createPkceChallenge(verifier)
    const a = Buffer.from(expected)
    const b = Buffer.from(challenge)
    if (a.length != b.length) {
        return false
    }

    return crypto.timingSafeEqual(a, b)
}

/**
 * Whether a redirect URI is acceptable for dynamic client registration.
 */
export const isValidRedirectUri = (value: string): boolean => {
    if (!value || typeof value != "string" || value.length > 2048) {
        return false
    }
    if (/[\s\\]/.test(value) || value.includes(":///")) {
        return false
    }

    let parsed: URL
    try {
        parsed = new URL(value)
    } catch {
        return false
    }

    if (parsed.username || parsed.password || parsed.hash) {
        return false
    }

    const protocol = parsed.protocol.toLowerCase()
    const host = parsed.hostname.toLowerCase()

    if (protocol == "https:") {
        return host.length > 0 && host != "localhost"
    }

    if (protocol == "http:") {
        return host == "localhost" || host == "127.0.0.1" || host == "[::1]" || host == "::1"
    }

    if (/^[a-z][a-z0-9+.-]*:$/.test(protocol) && protocol != "javascript:" && protocol != "data:" && protocol != "file:") {
        return host.length > 0 || parsed.pathname.length > 0
    }

    return false
}

/**
 * Escape text for safe use in HTML.
 */
export const escapeHtml = (value: string): string => {
    return (value || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;")
}

/**
 * First string value from an Express query or body field.
 */
export const firstString = (value: any): string => {
    if (Array.isArray(value)) {
        value = value[0]
    }
    if (value === undefined || value === null) {
        return ""
    }
    return String(value)
}

/**
 * Strip secrets and credentials from a user object before returning it to an MCP client.
 */
export const sanitizeUser = (user: UserData): any => {
    const result = _.cloneDeep(user) as any

    delete result.stravaTokens
    delete result.urlToken
    delete result.garminAuthState
    delete result.wahooAuthState
    delete result.spotifyAuthState
    delete result.paddleId
    delete result.paddleTransactionId

    if (result.confirmEmail) {
        result.confirmEmail = result.confirmEmail.substring(result.confirmEmail.indexOf(":") + 1)
    }
    if (result.garmin) {
        delete result.garmin.tokens
    }
    if (result.wahoo) {
        delete result.wahoo.tokens
    }
    if (result.spotify) {
        delete result.spotify.tokens
    }

    return result
}

/**
 * Remove heavy / unused fields from activities returned to MCP clients.
 */
export const sanitizeActivity = (activity: any): any => {
    if (!activity || typeof activity != "object") {
        return activity
    }

    return _.omit(activity, ["polyline", "polylineSummary", "streams", "splits", "splitsMetric", "splitsStandard"])
}

/**
 * JSON-serialize a value, converting dates to ISO strings.
 */
export const toJsonText = (data: any): string => {
    return JSON.stringify(
        data,
        (_key, value) => {
            if (value instanceof Date) {
                return value.toISOString()
            }
            return value
        },
        2
    )
}

/**
 * MCP tool success payload.
 */
export const toolResult = (data: any) => {
    return {content: [{type: "text" as const, text: typeof data == "string" ? data : toJsonText(data)}]}
}

/**
 * MCP tool error payload.
 */
export const toolError = (message: string) => {
    return {content: [{type: "text" as const, text: message}], isError: true}
}

/**
 * Apply CORS headers required by browser-based MCP clients.
 */
export const setCorsHeaders = (res: any): void => {
    res.setHeader("Access-Control-Allow-Origin", "*")
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
    res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type, MCP-Protocol-Version, MCP-Session-Id")
    res.setHeader("Access-Control-Expose-Headers", "WWW-Authenticate, MCP-Protocol-Version, MCP-Session-Id")
}

/**
 * RFC 9728 WWW-Authenticate challenge for the MCP resource.
 */
export const setWwwAuthenticate = (res: any, extra?: string): void => {
    const config = getMcpConfig()
    const parts = [`Bearer realm="Strautomator"`, `resource_metadata="${config.issuer}/.well-known/oauth-protected-resource"`, `scope="${config.scope}"`]
    if (extra) {
        parts.push(extra)
    }
    res.setHeader("WWW-Authenticate", parts.join(", "))
}
