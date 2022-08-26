// Strautomator API: GitHub

import {database, github} from "strautomator-core"
import crypto = require("crypto")
import express = require("express")
import logger = require("anyhow")
import webserver = require("../../webserver")
const settings = require("setmeup").settings
const router = express.Router()

/**
 * Validate webhooks dispatched by GitHub.
 */
const validateWebhook = (req, res): boolean => {
    const details = []

    try {
        const hubHeader = req.headers["x-hub-signature"]

        if (!req.body || !hubHeader) {
            throw new Error("Missing request body or headers")
        }

        // Parse payload JSON to get the checksum.
        const payload = JSON.stringify(req.body).replace(/[^\\]\\u[\da-f]{4}/g, (s) => {
            return s.substring(0, 3) + s.substring(3).toUpperCase()
        })

        // Calculate checksums.
        const hmac = crypto.createHmac("sha1", settings.github.api.urlToken)
        const digest = Buffer.from("sha1=" + hmac.update(payload).digest("hex"), "utf8")
        const checksum = Buffer.from(hubHeader.toString(), "utf8")

        if (checksum.length != digest.length || !crypto.timingSafeEqual(digest, checksum)) {
            throw new Error(`Request checksum invalid, got ${checksum}, expected ${digest}`)
        }

        return true
    } catch (ex) {
        logger.error("Routes", req.method, req.originalUrl, details.join(", "), ex)
        webserver.renderJson(req, res, {error: ex.toString()})
        return false
    }
}

/**
 * Webhooks posted by GitHub Sponsors.
 */
router.post("/webhook", async (req: express.Request, res: express.Response) => {
    try {
        if (!validateWebhook(req, res)) return

        await github.processWebhook(req.body)

        webserver.renderJson(req, res, {ok: true})
    } catch (ex) {
        logger.error("Routes", req.method, req.originalUrl, ex)
        webserver.renderJson(req, res, {error: ex.toString()})
    }
})

/**
 * Application changelog.
 */
router.get("/changelog", async (req: express.Request, res: express.Response) => {
    try {
        const changelog = await database.appState.get("changelog")
        webserver.renderJson(req, res, changelog)
    } catch (ex) {
        logger.error("Routes", req.method, req.originalUrl, ex)
        webserver.renderJson(req, res, {error: ex.toString()})
    }
})

export = router
