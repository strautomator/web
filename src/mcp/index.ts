// Strautomator MCP HTTP routes

import * as oauth from "./oauth"
import {handleMcp} from "./protocol"
import {setCorsHeaders} from "./utils"
import express = require("express")
import logger from "anyhow"

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
    const wellKnown = express.Router()
    wellKnown.use(corsPreflight)
    wellKnown.get("/oauth-protected-resource", oauth.protectedResourceMetadata)
    wellKnown.get("/oauth-protected-resource/mcp", oauth.protectedResourceMetadata)
    wellKnown.get("/oauth-authorization-server", oauth.authorizationServerMetadata)
    wellKnown.get("/oauth-authorization-server/mcp", oauth.authorizationServerMetadata)
    app.use("/.well-known", wellKnown)

    const oauthRouter = express.Router()
    oauthRouter.use(corsPreflight)
    oauthRouter.get("/authorize", oauth.authorize)
    oauthRouter.post("/authorize", oauth.authorize)
    oauthRouter.post("/register", oauth.registerClient)
    oauthRouter.post("/token", oauth.token)
    oauthRouter.post("/revoke", oauth.revoke)
    app.use("/mcp/oauth", oauthRouter)

    const mcpMeta = express.Router()
    mcpMeta.use(corsPreflight)
    mcpMeta.get("/oauth-protected-resource", oauth.protectedResourceMetadata)
    mcpMeta.get("/oauth-authorization-server", oauth.authorizationServerMetadata)
    app.use("/mcp/.well-known", mcpMeta)

    app.options("/mcp", corsPreflight)
    app.get("/mcp", corsPreflight, handleMcp)
    app.post("/mcp", corsPreflight, handleMcp)
    app.delete("/mcp", corsPreflight, handleMcp)

    logger.info("Mcp.setup", "MCP server routes registered at /mcp")
}

export = {setup}
