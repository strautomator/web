// Strautomator API: AI

import {ai, weather, UserData} from "strautomator-core"
import auth from "../auth"
import _ from "lodash"
import express = require("express")
import logger from "anyhow"
import webserver = require("../../webserver")
const router: express.Router = express.Router()

// AI
// --------------------------------------------------------------------------

/**
 * Get the AI generated name or description for the specified activity.
 */
router.post("/:userId/activity-generate", async (req: express.Request, res: express.Response) => {
    try {
        const user: UserData = (await auth.requestValidator(req, res)) as UserData
        if (!user) return
        if (!req.body || !req.body.activity || Object.keys(req.body.activity).length == 0) throw new Error("Missing activity details")

        // Activity dates must be transformed.
        const activity = req.body.activity
        if (activity.dateStart) activity.dateStart = new Date(activity.dateStart)
        if (activity.dateEnd) activity.dateEnd = new Date(activity.dateEnd)

        // Force English language to get the prompt fully in English.
        const language = user.preferences.language
        user.preferences.language = "en"

        // Get weather.
        let activityWeather
        try {
            activityWeather = await weather.getActivityWeather(user, activity, true)
        } catch (weatherEx) {
            logger.warn("Routes.strava", req.method, req.originalUrl, "Failed to get weather summary, will proceed without")
        }

        const provider = req.body.provider
        const humour = req.body.humour
        const name = await ai.generateActivityName(user, {activity, humour, provider, activityWeather})
        const description = await ai.generateActivityDescription(user, {activity, humour, provider, activityWeather})
        user.preferences.language = language

        webserver.renderJson(req, res, {name, description})
    } catch (ex) {
        webserver.renderError(req, res, ex, 400)
    }
})

/**
 * Trigger the export of a new dataset of activities for the specified user and sport.
 */
router.post("/:userId/dataset/:sport", async (req: express.Request, res: express.Response) => {
    try {
        const user: UserData = (await auth.requestValidator(req, res)) as UserData
        if (!user) return
        if (!["ride", "run"].includes(req.params?.sport)) throw new Error("Invalid sport type")

        ai.generateDatasetCsv(user, req.body.sport)

        webserver.renderJson(req, res, {ok: true})
    } catch (ex) {
        webserver.renderError(req, res, ex, 400)
    }
})

export = router
