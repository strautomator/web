// Strautomator MCP HTTP routes

import * as oauth from "./oauth"
import {handleMcp} from "./protocol"
import {setCorsHeaders} from "./utils"
import express = require("express")
import logger from "anyhow"

/**
 * Apply CORS headers and short-circuit OPTIONS preflight requests.
 */
const corsPreflight = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    setCorsHeaders(res)
    if (req.method == "OPTIONS") {
        res.status(204).send()
        return
    }
    next()
}

/**
 * Register MCP and OAuth endpoints on the Express app. Must run before the Nuxt renderer.
 */
const setup = (app: express.Express): void => {
    // RFC 9728 / RFC 8414 metadata at the site root (expected by MCP clients).
    const wellKnown = express.Router()
    wellKnown.use(corsPreflight)
    wellKnown.get("/oauth-protected-resource", oauth.protectedResourceMetadata)
    wellKnown.get("/oauth-protected-resource/mcp", oauth.protectedResourceMetadata)
    wellKnown.get("/oauth-authorization-server", oauth.authorizationServerMetadata)
    wellKnown.get("/oauth-authorization-server/mcp", oauth.authorizationServerMetadata)
    app.use("/.well-known", wellKnown)

    // OAuth 2.1 authorization server (DCR, authorize, token, revoke).
    const oauthRouter = express.Router()
    oauthRouter.use(corsPreflight)
    oauthRouter.get("/authorize", oauth.authorize)
    oauthRouter.post("/authorize", oauth.authorize)
    oauthRouter.post("/register", oauth.registerClient)
    oauthRouter.post("/token", oauth.token)
    oauthRouter.post("/revoke", oauth.revoke)
    app.use("/mcp/oauth", oauthRouter)

    // Alternate metadata paths under /mcp (some clients probe here).
    const mcpMeta = express.Router()
    mcpMeta.use(corsPreflight)
    mcpMeta.get("/oauth-protected-resource", oauth.protectedResourceMetadata)
    mcpMeta.get("/oauth-authorization-server", oauth.authorizationServerMetadata)
    app.use("/mcp/.well-known", mcpMeta)

    // MCP Streamable HTTP JSON-RPC endpoint.
    app.options("/mcp", corsPreflight)
    app.get("/mcp", corsPreflight, handleMcp)
    app.post("/mcp", corsPreflight, handleMcp)
    app.delete("/mcp", corsPreflight, handleMcp)

    logger.info("Mcp.setup", "MCP server routes registered at /mcp")
}

export = {setup}
