// Strautomator API: GitHub

import {database, github} from "strautomator-core"
import crypto from "crypto"
import express = require("express")
import webserver = require("../../webserver")
const settings = require("setmeup").settings
const router: express.Router = express.Router()

/**
 * Validate webhooks dispatched by GitHub.
 */
const validateWebhook = (req, res): boolean => {
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
        webserver.renderError(req, res, ex, 400)
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
        webserver.renderError(req, res, ex)
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
        webserver.renderError(req, res, ex)
    }
})

/**
 * Last commits to the GitHub repos.
 */
router.get("/last-commits", async (req: express.Request, res: express.Response) => {
    try {
        const commits = await github.getLastCommits()
        webserver.renderJson(req, res, commits)
    } catch (ex) {
        webserver.renderError(req, res, ex)
    }
})

export = router
