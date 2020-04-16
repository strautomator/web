// Strautomator API: Strava routes

import {users} from "strautomator-core"
import scheduler from "../../scheduler"
import express = require("express")
import logger = require("anyhow")
import webserver = require("../../webserver")
const settings = require("setmeup").settings
const router = express.Router()

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
 * mostly return OK 200, unless the verification token is invalid.
 */
router.post("/:urlToken/:userId", async (req, res) => {
    try {
        const verifyToken = req.query["hub.verify_token"] as string

        // Validate webhook URL token.
        if (req.params.urlToken != settings.strava.api.urlToken) {
            logger.error("Routes", req.method, req.originalUrl, "Invalid URL token")
            return webserver.renderError(req, res, "Invalid URL", 401)
        }

        // Validate token from Strava.
        if (verifyToken != settings.strava.api.verifyToken) {
            logger.error("Routes", req.method, req.originalUrl, `Invalid verify_token`)
            return webserver.renderError(req, res, "Invalid token", 401)
        }

        const obj = req.body

        // Validate incoming data.
        if (obj.aspect_type || obj.event_time || obj.object_id || obj.object_type) {
            logger.error("Routes", req.method, req.originalUrl, "Missing event data", obj)
            return webserver.renderJson(req, res, {ok: false})
        }

        // From this point onwards we consider all good from the Strava side.
        webserver.renderJson(req, res, {ok: true})
        logger.info("Routes", `User ${obj.owner_id}`, obj.aspect_type, obj.object_type, obj.object_id)

        // Process new activities and relevant recipes.
        if (obj.aspect_type == "create" && obj.object_type == "activity") {
            const user = await users.getById(obj.owner_id.toString())

            // If user not found, still return a 200 response as we do not want Strava to
            // stop sending valid webhooks.
            if (!user) {
                return logger.error("Routes", req.method, req.originalUrl, `User ${obj.owner_id} not found`)
            }

            await scheduler.processActivity(user, obj.object_id)

            // Set last activity date and save.
            user.dateLastActivity = new Date()
            await users.update(user)
        }
    } catch (ex) {
        logger.error("Routes", req.method, req.originalUrl, ex)
    }
})

export = router
