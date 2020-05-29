// Strautomator API: bunq routes

import {bunq, UserData} from "strautomator-core"
import auth from "../auth"
import express = require("express")
import logger = require("anyhow")
import webserver = require("../../webserver")
const settings = require("setmeup").settings
const router = express.Router()

/**
 * Auth entrypoint.
 */
router.get("/:userId/auth", async (req, res) => {
    try {
        if (settings.bunq.disabled) {
            return webserver.renderError(req, res, "Integration with bunq is disabled", 404)
        }

        const client = await bunq.register({id: req.params.userId} as any)
        res.redirect(client.authUrl)
    } catch (ex) {
        logger.error("Routes", req.method, req.originalUrl, ex)
    }
})

/**
 * Auth callback.
 */
router.get("/auth/callback", async (req, res) => {
    try {
        if (settings.bunq.disabled) {
            return webserver.renderError(req, res, "Integration with bunq is disabled", 404)
        }

        const user: UserData = (await auth.requestValidator(req, res)) as UserData
        if (!user) return

        const code = req.query.code

        if (!code) {
            return res.redirect("/error?status=400&title=Invalid auth&message=Missing authorization code from bunq")
        }

        const client = bunq.clients[user.id]
        const ok = await client.getOAuthToken(code.toString())

        if (ok) {
            await client.getUserDetails()
            res.redirect("/bunq/preferences")
        } else {
            res.redirect("/error?status=400&title=Invalid auth&message=OAuth2 flow failed")
        }
    } catch (ex) {
        logger.error("Routes", req.method, req.originalUrl, ex)
        webserver.renderJson(req, res, {error: ex.toString()})
    }
})

export = router
