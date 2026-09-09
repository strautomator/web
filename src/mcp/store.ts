// Strautomator MCP persistence (Firestore)

import {database} from "strautomator-core"
import {McpAuthCode, McpAuthRequest, McpOAuthClient, McpToken} from "./types"
import {getMcpConfig, hashToken, randomToken} from "./utils"
import dayjs from "../dayjs"
import logger from "anyhow"

const COL_CLIENTS = "mcp-clients"
const COL_REQUESTS = "mcp-auth-requests"
const COL_CODES = "mcp-auth-codes"
const COL_TOKENS = "mcp-tokens"

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

    saveClient = async (client: McpOAuthClient): Promise<void> => {
        await database.set(COL_CLIENTS, client, client.id)
        logger.info("McpStore.saveClient", client.id, client.clientName || "unnamed", client.tokenEndpointAuthMethod)
    }

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

    saveAuthRequest = async (request: McpAuthRequest): Promise<void> => {
        await database.set(COL_REQUESTS, request, request.id)
    }

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

    deleteAuthRequest = async (id: string): Promise<void> => {
        try {
            await database.delete(COL_REQUESTS, id)
        } catch (ex) {
            logger.warn("McpStore.deleteAuthRequest", id, ex)
        }
    }

    // AUTH CODES
    // --------------------------------------------------------------------------

    issueAuthCode = async (data: Omit<McpAuthCode, "id">): Promise<string> => {
        const code = randomToken(32)
        const doc: McpAuthCode = {id: hashToken(code), ...data}
        await database.set(COL_CODES, doc, doc.id)
        return code
    }

    consumeAuthCode = async (code: string): Promise<McpAuthCode> => {
        if (!code) {
            return null
        }

        const id = hashToken(code)
        const doc: McpAuthCode = await database.get(COL_CODES, id)
        await database.delete(COL_CODES, id)

        if (!doc || isExpired(doc)) {
            return null
        }

        return doc
    }

    // TOKENS
    // --------------------------------------------------------------------------

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

    consumeRefreshToken = async (refreshToken: string): Promise<McpToken> => {
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

        await database.delete(COL_TOKENS, id)
        if (doc.accessId) {
            try {
                await database.delete(COL_TOKENS, doc.accessId)
            } catch (ex) {
                logger.warn("McpStore.consumeRefreshToken", "Failed to delete previous access token", ex)
            }
        }

        return doc
    }

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
