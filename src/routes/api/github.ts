// Strautomator API: GitHub

import {database, github} from "strautomator-core"
import crypto from "crypto"
import _ from "lodash"
import express from "express"
import webserver = require("../../webserver")
const settings = require("setmeup").settings
const router: express.Router = express.Router()

/**
 * Validate webhooks dispatched by GitHub.
 */
const validateWebhook = (req, res): boolean => {
    try {
        const secret = settings.github.api.urlToken
        const sig256 = req.headers["x-hub-signature-256"] as string
        const sigLegacy = req.headers["x-hub-signature"] as string

        if (!secret) {
            throw new Error("Missing webhook secret")
        }
        if (!req.body || (!sig256 && !sigLegacy)) {
            throw new Error("Missing request body or headers")
        }

        // Signature must be validated against the exact bytes sent by GitHub.
        const payload: Buffer = (req as any).rawBody
        if (!Buffer.isBuffer(payload)) {
            throw new Error("Missing raw request body")
        }

        // Prefer SHA-256, keep the legacy SHA-1 as fallback.
        const header = sig256 || sigLegacy
        const algorithm = sig256 ? "sha256" : "sha1"
        const prefix = `${algorithm}=`
        if (!header.startsWith(prefix)) {
            throw new Error("Invalid signature format")
        }

        // Calculate checksums.
        const hmac = crypto.createHmac(algorithm, secret)
        const digest = Buffer.from(prefix + hmac.update(payload).digest("hex"), "utf8")
        const checksum = Buffer.from(header.toString(), "utf8")

        if (checksum.length != digest.length || !crypto.timingSafeEqual(digest, checksum)) {
            throw new Error("Request checksum invalid")
        }

        return true
    } catch (ex) {
        webserver.renderError(req, res, ex, 401)
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
 * Application changelog (most recent entries only).
 */
router.get("/changelog", async (req: express.Request, res: express.Response) => {
    try {
        const changelog = await database.appState.get("changelog")
        const releases = _.orderBy(Object.values(changelog), "datePublished", "desc")
        const limit = parseInt((req.query.limit as string) || "0")
        webserver.renderJson(req, res, limit > 0 ? releases.slice(0, limit) : releases)
    } catch (ex) {
        webserver.renderError(req, res, ex)
    }
})

export = router
