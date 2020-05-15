// Strautomator API: GitHub routes

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
            return s.substr(0, 3) + s.substr(3).toUpperCase()
        })

        // Calculate checksums.
        const hmac = crypto.createHmac("sha1", settings.github.api.urlToken)
        const digest = Buffer.from("sha1=" + hmac.update(payload).digest("hex"), "utf8")
        const checksum = Buffer.from(hubHeader.toString(), "utf8")

        // Log request body.
        const body = req.body
        if (body.action) details.push(`Action: ${body.action}`)
        if (body.sender) details.push(`Sender: ${body.sender.login}`)
        if (body.hook) details.push(`Hook: ${body.hook.type}`)
        if (body.sponsorship && body.sponsorship.sponsor) details.push(`Sponsor: ${body.sponsorship.sponsor.login}`)
        if (body.sponsorship && body.sponsorship.tier) details.push(`Tier: ${body.sponsorship.tier.name}`)

        if (checksum.length != digest.length || !crypto.timingSafeEqual(digest, checksum)) {
            throw new Error(`Request checksum invalid, got ${checksum}, expected ${digest}`)
        }

        logger.info("Routes", req.method, req.originalUrl, details.join(", "))
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
router.post("/webhook", async (req, res) => {
    try {
        if (!validateWebhook(req, res)) return
        webserver.renderJson(req, res, {ok: true})
    } catch (ex) {
        logger.error("Routes", req.method, req.originalUrl, ex)
        webserver.renderJson(req, res, {error: ex.toString()})
    }
})

export = router
