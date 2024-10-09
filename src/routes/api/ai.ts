// Strautomator API: AI

import {ai, strava, users, weather, UserData} from "strautomator-core"
import {AxiosRequestConfig} from "axios"
import auth from "../auth"
import _ from "lodash"
import express = require("express")
import logger from "anyhow"
import webserver = require("../../webserver")
const router: express.Router = express.Router()
const settings = require("setmeup").settings
const axios = require("axios").default

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
 * Check if the user has reached the quota for generating images.
 */
router.get("/:userId/image-quota", async (req: express.Request, res: express.Response) => {
    try {
        const user: UserData = (await auth.requestValidator(req, res)) as UserData
        if (!user) return

        const max = user.isPro ? settings.plans.pro.generatedImages.perWeek : settings.plans.free.generatedImages.perWeek
        const count = (await ai.getCachedResponses(user, "image", true)) as number
        webserver.renderJson(req, res, {quota: max - count})
    } catch (ex) {
        webserver.renderError(req, res, ex, 404)
    }
})

/**
 * Get an AI generated image for the specified activity.
 */
router.get("/:userId/:urlToken/activity/:activityId.png", async (req: express.Request, res: express.Response) => {
    try {
        const user = await users.getById(req.params.userId)
        if (user.urlToken != req.params.urlToken) throw new Error(`Image not found`)

        // Generate the image.
        const provider = (req.query.provider as any) || null
        const style = (req.query.style as any) || null
        const activity = await strava.activities.getActivity(user, req.params.activityId)
        const activityWeather = await weather.getActivityWeather(user, activity, true)
        const aiResponse = await ai.generateActivityImage(user, {activity, activityWeather, provider: provider, style: style})

        if (aiResponse?.response) {
            if (_.isString(aiResponse.response)) {
                const options: AxiosRequestConfig = {
                    method: "GET",
                    responseType: "stream",
                    url: aiResponse.response
                }

                axios(options).then((response) => response.data.pipe(res))
            } else {
                res.contentType("image/png")
                res.send(aiResponse.response)
            }
        } else if (aiResponse?.rateLimited) {
            res.status(429).send("Daily limit reached")
        } else {
            res.status(404).send("Failed to generate image")
        }
    } catch (ex) {
        webserver.renderError(req, res, ex, 404)
    }
})

export = router
