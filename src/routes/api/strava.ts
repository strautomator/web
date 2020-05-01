// Strautomator API: Strava routes

import {strava, users} from "strautomator-core"
import express = require("express")
import logger = require("anyhow")
import webserver = require("../../webserver")
const axios = require("axios").default
const settings = require("setmeup").settings
const router = express.Router()
const packageVersion = require("../../../package.json").version

/**
 * Helper to validate incoming webhook events sent by Strava.
 */
const webhookValidator = (req, res): boolean => {
    try {
        const obj = req.body

        // First we check the URL token.
        if (req.params.urlToken != settings.strava.api.urlToken) {
            logger.error("Routes", req.method, req.originalUrl, "Invalid URL token")
            webserver.renderError(req, res, "Invalid URL token", 401)
            return false
        }

        // Then we check if any data is missing.
        if (!obj.aspect_type || !obj.event_time || !obj.object_id || !obj.object_type) {
            logger.error("Routes", req.method, req.originalUrl, "Missing event data", obj)
            webserver.renderError(req, res, "Missing event data", 400)
            return false
        }

        // Force user (owner) ID as string.
        obj.owner_id = obj.owner_id.toString()

        // Make sure the event owner's ID is the same as the user ID.
        if (req.params.userId != obj.owner_id) {
            logger.error("Routes", req.method, req.originalUrl, `Invalid user: ${req.params.userId} / ${obj.owner_id}`, obj)
            webserver.renderError(req, res, "Invalid user", 400)
            return false
        }

        // Finally, we only want to process new activities, so skip the rest.
        if (obj.aspect_type != "create" || obj.object_type != "activity") {
            logger.debug("Routes", req.method, req.originalUrl, `User ${obj.owner_id}`, obj.aspect_type, obj.object_type, obj.object_id, "Skipped")
            webserver.renderJson(req, res, {processed: false})
            return false
        }
    } catch (ex) {
        logger.error("Routes", req.method, req.originalUrl, ex)
        webserver.renderJson(req, res, {error: ex.toString()})
        return false
    }

    return true
}

/**
 * Activity subscription events sent by Strava. Please note that this route will
 * mostly return OK 200, unless the verification token is invalid.
 */
router.get("/:urlToken/:userId", async (req, res) => {
    try {
        const challenge = req.query["hub.challenge"] as string
        const verifyToken = req.query["hub.verify_token"] as string

        // Validate webhook URL token.
        if (req.params.urlToken != settings.strava.api.urlToken) {
            logger.error("Routes", req.method, req.originalUrl, "Invalid URL token")
            return webserver.renderError(req, res, "Invalid URL", 401)
        }

        // Validate token from Strava.
        if (verifyToken != settings.strava.api.verifyToken) {
            logger.error("Routes", req.method, req.originalUrl, "Invalid verify_token")
            return webserver.renderError(req, res, "Invalid token", 401)
        }

        // Validate challenge from Strava.
        if (!challenge || challenge == "") {
            logger.error("Routes", req.method, req.originalUrl, "Missing hub challenge")
            return webserver.renderError(req, res, "Missing hub challenge", 401)
        }

        // Echo hub challenge back to Strava.
        webserver.renderJson(req, res, {"hub.challenge": challenge})
        logger.info("Routes", `Subscription challenge by Strava: ${challenge}`)
    } catch (ex) {
        logger.error("Routes", req.method, req.originalUrl, ex)
    }
})

/**
 * Activity subscription events sent by Strava. Please note that this route will
 * mostly return OK 200, unless the URL token or POST data is invalid.
 */
router.post("/:urlToken/:userId", async (req, res) => {
    try {
        if (!webhookValidator(req, res)) return
        const obj = req.body

        logger.info("Routes", req.method, req.originalUrl, `User ${obj.owner_id}`, obj.aspect_type, obj.object_type, obj.object_id)

        // Make a call back to the API to do the actual activity processing, so we can return
        // the response right now to Strava (within the 2 seconds max).
        const options = {
            method: "POST",
            baseURL: settings.api.url || `${settings.app.url}api/`,
            url: `/strava/${req.params.urlToken}/${req.params.userId}/${obj.object_id}`,
            headers: {"User-Agent": `${settings.app.title} / ${packageVersion}`},
            data: obj
        }
        axios(options).catch((err) => {
            logger.error("Routes", req.method, req.originalUrl, "Callback failed", err.toString())
        })

        webserver.renderJson(req, res, {processed: true})
    } catch (ex) {
        logger.error("Routes", req.method, req.originalUrl, ex)
        webserver.renderJson(req, res, {error: ex.toString()})
    }
})

/**
 * Called by the route above, this will effectively process the activity sent by Strava.
 */
router.post("/:urlToken/:userId/:activityId", async (req, res) => {
    try {
        if (!webhookValidator(req, res)) return
        const obj = req.body

        const user = await users.getById(obj.owner_id)

        // If user not found, still return a 200 response as we do not want Strava to
        // stop sending valid webhooks.
        if (!user) {
            logger.error("Routes", req.method, req.originalUrl, `User ${obj.owner_id} not found`)
            return webserver.renderError(req, res, "User not found", 404)
        }

        await strava.activities.processActivity(user, obj.object_id)

        // Set last activity date on user, and save.
        user.dateLastActivity = new Date()
        await users.update(user)

        webserver.renderJson(req, res, {processed: true})
    } catch (ex) {
        logger.error("Routes", req.method, req.originalUrl, ex)
        webserver.renderJson(req, res, {error: ex.toString()})
    }
})

export = router
