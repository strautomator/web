// Strautomator MCP Streamable HTTP / JSON-RPC

import {users, UserData} from "strautomator-core"
import store from "./store"
import {callTool, listTools} from "./tools"
import {JsonRpcRequest, JsonRpcResponse} from "./types"
import {getMcpConfig, setCorsHeaders, setWwwAuthenticate} from "./utils"
import express = require("express")
import logger from "anyhow"
const packageVersion = require("../../package.json").version

// INTERNAL HELPERS
// --------------------------------------------------------------------------

/**
 * Build a JSON-RPC 2.0 error response.
 */
const jsonRpcError = (id: JsonRpcRequest["id"], code: number, message: string): JsonRpcResponse => {
    return {jsonrpc: "2.0", id: id ?? null, error: {code, message}}
}

/**
 * Authenticate the MCP request using the OAuth bearer token issued by this server.
 * Strava tokens are never accepted here.
 */
const authenticateRequest = async (req: express.Request, res: express.Response): Promise<UserData> => {
    const header = req.headers.authorization || ""
    const match = header.match(/^Bearer\s+(.+)$/i)
    if (!match) {
        setWwwAuthenticate(res)
        res.status(401).json({error: "invalid_token", error_description: "Missing bearer token"})
        return null
    }

    const token = await store.getAccessToken(match[1].trim())
    const config = getMcpConfig()
    if (!token || token.resource.replace(/\/+$/, "") != config.resource.replace(/\/+$/, "")) {
        setWwwAuthenticate(res, 'error="invalid_token"')
        res.status(401).json({error: "invalid_token", error_description: "Invalid or expired access token"})
        return null
    }

    const user = await users.getById(token.userId)
    if (!user) {
        setWwwAuthenticate(res, 'error="invalid_token"')
        res.status(401).json({error: "invalid_token", error_description: "User not found"})
        return null
    }
    if (!user.isPro) {
        res.status(403).json({error: "insufficient_scope", error_description: "The Strautomator MCP server is available to PRO members only"})
        return null
    }

    return user
}

/**
 * Dispatch a single JSON-RPC message for the authenticated user.
 */
const handleRpc = async (user: UserData, message: JsonRpcRequest): Promise<JsonRpcResponse> => {
    const id = message?.id ?? null
    if (!message || message.jsonrpc != "2.0" || !message.method) {
        return jsonRpcError(id, -32600, "Invalid Request")
    }

    const config = getMcpConfig()

    if (message.method == "initialize") {
        const requested = message.params?.protocolVersion
        const protocolVersion = config.protocolVersions.includes(requested) ? requested : config.protocolVersions[0]
        return {
            jsonrpc: "2.0",
            id,
            result: {
                protocolVersion,
                capabilities: {tools: {listChanged: false}},
                serverInfo: {name: "strautomator", title: "Strautomator", version: packageVersion},
                instructions: "Strautomator MCP for PRO members. Tools operate on the authenticated athlete and match the website API. Use get_automation_schema before creating or updating automations. Never ask the user for Strava tokens; authentication is already established."
            }
        }
    }

    if (message.method == "ping") {
        return {jsonrpc: "2.0", id, result: {}}
    }

    if (message.method == "tools/list") {
        return {jsonrpc: "2.0", id, result: {tools: listTools()}}
    }

    if (message.method == "tools/call") {
        const name = message.params?.name
        const args = message.params?.arguments || {}
        if (!name) {
            return jsonRpcError(id, -32602, "Missing tool name")
        }
        const result = await callTool(user, name, args)
        return {jsonrpc: "2.0", id, result}
    }

    // Client notifications do not expect a response.
    if (message.method == "notifications/initialized" || message.method.startsWith("notifications/")) {
        return null
    }

    // Advertise empty resource and prompt lists (tools-only server).
    if (message.method == "resources/list") {
        return {jsonrpc: "2.0", id, result: {resources: []}}
    }
    if (message.method == "prompts/list") {
        return {jsonrpc: "2.0", id, result: {prompts: []}}
    }

    return jsonRpcError(id, -32601, `Method not found: ${message.method}`)
}

// STREAMABLE HTTP
// --------------------------------------------------------------------------

/**
 * Handle MCP Streamable HTTP requests (POST /mcp).
 */
export const handleMcp = async (req: express.Request, res: express.Response): Promise<void> => {
    setCorsHeaders(res)

    if (req.method == "OPTIONS") {
        res.status(204).send()
        return
    }

    // Stateless server: only POST carries JSON-RPC payloads.
    if (req.method == "GET" || req.method == "DELETE") {
        res.status(405).setHeader("Allow", "POST, OPTIONS").json({error: "method_not_allowed", error_description: "This MCP server is stateless and only accepts POST"})
        return
    }

    const user = await authenticateRequest(req, res)
    if (!user) {
        return
    }

    try {
        const body = req.body
        const batch = Array.isArray(body)
        const messages: JsonRpcRequest[] = batch ? body : [body]
        const responses: JsonRpcResponse[] = []

        for (const message of messages) {
            const isNotification = message && message.id === undefined && typeof message.method == "string" && (message.method.startsWith("notifications/") || message.method == "initialized")
            const response = await handleRpc(user, message)
            if (response && !isNotification) {
                responses.push(response)
            }
        }

        // Notification-only batches return 202 with no body.
        if (responses.length == 0) {
            res.status(202).send()
            return
        }

        res.setHeader("Content-Type", "application/json")
        res.json(batch ? responses : responses[0])
    } catch (ex) {
        logger.error("McpProtocol.handleMcp", user.id, ex)
        res.status(500).json({jsonrpc: "2.0", id: null, error: {code: -32603, message: "Internal error"}})
    }
}
