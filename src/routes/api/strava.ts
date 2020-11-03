// Strautomator API: Strava routes

import {strava, users, UserData} from "strautomator-core"
import auth from "../auth"
import _ = require("lodash")
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

        // Limit number of recent activites, with a hard coded maximum of 50.
        let limit: number = req.query.limit ? parseInt(req.query.limit as string) : 10
        if (limit > 50) limit = 50

        // Get activities for the past 21 days by default, with a hard limit of 30 days.
        let timestamp = req.query.since ? moment.unix(parseInt(req.query.since as string)) : moment().subtract(21, "days")
        let minTimestamp = moment().subtract(30, "days")
        if (timestamp.isBefore(minTimestamp)) timestamp = minTimestamp

        // Fetch recent activities.
        let activities = await strava.activities.getActivities(user, {after: timestamp.unix()})

        // Recent activities should come first, so we reverse the array.
        activities.reverse()

        // Do not pass the limit.
        if (activities.length > limit) {
            activities = activities.slice(0, limit)
        }

        logger.info("Routes", req.method, req.originalUrl)
        webserver.renderJson(req, res, activities)
    } catch (ex) {
        logger.error("Routes", req.method, req.originalUrl, ex)
        webserver.renderError(req, res, ex, 500)
    }
})

/**
 * Get logged user's activities from Strava since the specified timestamp.
 * Maximum of 2 years.
 */
router.get("/activities/since/:timestamp", async (req, res) => {
    try {
        if (!req.params) throw new Error("Missing request params")

        const user: UserData = (await auth.requestValidator(req, res)) as UserData
        if (!user) return

        // Timestamp is mandatory.
        if (!req.params.timestamp) {
            throw new Error("Missing timestamp")
        }

        // Hard limit of 2 years on the minimum timestamp.
        let timestamp = moment.unix(parseInt(req.params.timestamp as string))
        let minTimestamp = moment().subtract(731, "days")
        if (timestamp.isBefore(minTimestamp)) timestamp = minTimestamp

        // Fetch activities since the specified timestamp.
        let activities = await strava.activities.getActivities(user, {after: timestamp.unix()})

        // If a gear filter was passed, remove activities that are not for that particular gear.
        if (req.query.gear) {
            _.remove(activities, (a) => !a.gear || a.gear.id != req.query.gear)
        }

        logger.info("Routes", req.method, req.originalUrl, `Got ${activities.length} activites`)
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

        // Limit number of activites returned?
        let limit: number = req.query.limit ? parseInt(req.query.limit as string) : null
        const activities = await strava.activities.getProcessedActivites(user, limit)

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
        if (!req.params) throw new Error("Missing request params")

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
        if (!req.params) throw new Error("Missing request params")

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
        if (!req.params) throw new Error("Missing request params")
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
        axios(options).catch((err) => logger.debug("Routes", req.method, req.originalUrl, "Callback failed", err.toString()))

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
        if (!req.params) throw new Error("Missing request params")
        if (!webhookValidator(req, res)) return

        const now = moment.utc().toDate()
        const userId = req.params.userId
        const user = await users.getById(userId)

        // User not found? Stop here.
        if (!user) {
            return webserver.renderError(req, res, "User not found", 404)
        }

        // User has no valid tokens? Stop here.
        if (!user.stravaTokens || (!user.stravaTokens.accessToken && !user.stravaTokens.refreshToken)) {
            logger.warn("Routes", req.method, req.originalUrl, `User ${user.id} has no access tokens`)
            return webserver.renderError(req, res, "User has no access tokens", 400)
        }

        user.dateLastActivity = now

        // Process and set last processed activity date if the activity was update by any automation recipe.
        const processed = await strava.activities.processActivity(user, parseInt(req.params.activityId))
        if (processed) user.dateLastProcessedActivity = now

        // Update user.
        const updatedUser = {id: user.id, dateLastActivity: user.dateLastActivity, dateLastProcessedActivity: user.dateLastProcessedActivity}
        await users.update(updatedUser)

        webserver.renderJson(req, res, {ok: true})
    } catch (ex) {
        logger.error("Routes", req.method, req.originalUrl, ex)
        webserver.renderJson(req, res, {error: ex.toString()})
    }
})

export = router
