// Strautomator API: Strava routes

import {strava, users, UserData} from "strautomator-core"
import auth from "../auth"
import express = require("express")
import logger = require("anyhow")
import moment = require("moment")
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
        const method = req.method.toUpperCase()

        // First we check the URL token.
        if (req.params.urlToken != settings.strava.api.urlToken) {
            logger.error("Routes", req.method, req.originalUrl, "Invalid URL token")
            webserver.renderError(req, res, "Invalid URL token", 401)
            return false
        }

        // Then we check if any data is missing.
        if (method == "POST") {
            if (!obj.aspect_type || !obj.event_time || !obj.object_id || !obj.object_type) {
                logger.error("Routes", req.method, req.originalUrl, "Missing event data", obj)
                webserver.renderError(req, res, "Missing event data", 400)
                return false
            }

            // Only want to process new activities, so skip the rest.
            if (obj.aspect_type != "create" || obj.object_type != "activity") {
                logger.debug("Routes", req.method, req.originalUrl, `User ${obj.owner_id}`, obj.aspect_type, obj.object_type, obj.object_id, "Skipped")
                webserver.renderJson(req, res, {ok: false})
                return false
            }
        }
    } catch (ex) {
        logger.error("Routes", req.method, req.originalUrl, ex)
        webserver.renderJson(req, res, {error: ex.toString()})
        return false
    }

    return true
}

// USER ACTIVITIES
// --------------------------------------------------------------------------

/**
 * Get logged user's recent activities from Strava.
 * By default, return only 10 results.
 */
router.get("/activities/recent", async (req, res) => {
    try {
        const user: UserData = (await auth.requestValidator(req, res)) as UserData
        if (!user) return

        const limit: number = req.query.limit ? parseInt(req.query.limit as string) : 10
        const timestamp = moment().subtract(21, "days")
        let activities = await strava.activities.getActivities(user, {after: timestamp.unix()})

        if (activities.length > limit) {
            activities = activities.slice(0, limit)
        }

        // Recent activities should come first, so we reverse the array.
        activities.reverse()

        logger.info("Routes", req.method, req.originalUrl)
        webserver.renderJson(req, res, activities)
    } catch (ex) {
        logger.error("Routes", req.method, req.originalUrl, ex)
        webserver.renderError(req, res, ex, 500)
    }
})

/**
 * Get logged user's latest activities that were processed by Strautomator.
 */
router.get("/activities/processed", async (req, res) => {
    try {
        const user: UserData = (await auth.requestValidator(req, res)) as UserData
        if (!user) return

        const activities = await strava.activities.getProcessedActivites(user, 10)

        logger.info("Routes", req.method, req.originalUrl)
        webserver.renderJson(req, res, activities)
    } catch (ex) {
        logger.error("Routes", req.method, req.originalUrl, ex)
        webserver.renderError(req, res, ex, 500)
    }
})

/**
 * Logged user can trigger a forced processing of a particular activity.
 */
router.get("/process-activity/:activityId", async (req, res) => {
    try {
        const user: UserData = (await auth.requestValidator(req, res)) as UserData
        if (!user) return

        // Process the passed activity.
        const processedActivity = await strava.activities.processActivity(user, parseInt(req.params.activityId))
        webserver.renderJson(req, res, processedActivity)
    } catch (ex) {
        logger.error("Routes", req.method, req.originalUrl, ex)
        const errorMessage = ex.toString()
        const status = errorMessage.indexOf("not found") > 0 ? 404 : 500
        webserver.renderError(req, res, {error: errorMessage}, status)
    }
})

// WEBHOOKS
// --------------------------------------------------------------------------

/**
 * Activity subscription events sent by Strava. Please note that this route will
 * mostly return OK 200, unless the verification token is invalid.
 */
router.get("/:urlToken", async (req, res) => {
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
router.post("/:urlToken", async (req, res) => {
    try {
        if (!webhookValidator(req, res)) return
        const obj = req.body

        logger.info("Routes", req.method, req.originalUrl, `User ${obj.owner_id}`, obj.aspect_type, obj.object_type, obj.object_id)

        // Make a call back to the API to do the actual activity processing, so we can return
        // the response right now to Strava (within the 2 seconds max).
        const options = {
            method: "GET",
            baseURL: settings.api.url || `${settings.app.url}api/`,
            url: `/strava/${req.params.urlToken}/${obj.owner_id}/${obj.object_id}`,
            headers: {"User-Agent": `${settings.app.title} / ${packageVersion}`}
        }
        axios(options).catch((err) => {
            logger.error("Routes", req.method, req.originalUrl, "Callback failed", err.toString())
        })

        webserver.renderJson(req, res, {ok: true})
    } catch (ex) {
        logger.error("Routes", req.method, req.originalUrl, ex)
        webserver.renderJson(req, res, {error: ex.toString()})
    }
})

/**
 * Called by the route above, this will effectively process the activity sent by Strava.
 */
router.get("/:urlToken/:userId/:activityId", async (req, res) => {
    try {
        if (!webhookValidator(req, res)) return
        const user = await users.getById(req.params.userId)

        // User not found? Stop here.
        if (!user) {
            logger.error("Routes", req.method, req.originalUrl, `User ${req.params.userId} not found`)
            return webserver.renderError(req, res, "User not found", 404)
        }

        await strava.activities.processActivity(user, parseInt(req.params.activityId))

        // Set last activity date on user, and save.
        user.dateLastActivity = moment.utc().toDate()
        await users.update(user)

        webserver.renderJson(req, res, {ok: true})
    } catch (ex) {
        logger.error("Routes", req.method, req.originalUrl, ex)
        webserver.renderJson(req, res, {error: ex.toString()})
    }
})

export = router
