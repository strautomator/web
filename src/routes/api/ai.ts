// Strautomator API: AI

import {ai, openai, weather, UserData} from "strautomator-core"
import auth from "../auth"
import dayjs from "../../dayjs"
import _ from "lodash"
import express = require("express")
import logger from "anyhow"
import webserver = require("../../webserver")
const router: express.Router = express.Router()

// Quick and dirty solution to rate-limit Free accounts to avoid abuse.
const rateLimitFree: {[userId: string]: Date} = {}

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

        const provider = req.body.provider
        const humourPrompt = req.body.humourPrompt

        // Rate limit Free accounts to a max of 1 request per provider per hour.
        const rateLimitId = `${user.id}-${provider}`
        if (user.isPro && rateLimitFree[rateLimitId]) {
            const lastRequest = dayjs(rateLimitFree[rateLimitId])
            const nextRequest = lastRequest.add(10, "minutes")
            if (nextRequest.isAfter(dayjs())) {
                throw new Error("Only 1 test per provider allowed every 10 minutes.")
            }
        }

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

        const name = await ai.generateActivityName(user, {activity, humourPrompt, provider, activityWeather})
        const description = await ai.generateActivityDescription(user, {activity, humourPrompt, provider, activityWeather})
        user.preferences.language = language

        if (user.isPro) {
            rateLimitFree[rateLimitId] = new Date()
        }

        webserver.renderJson(req, res, {name, description})
    } catch (ex) {
        webserver.renderError(req, res, ex, 400)
    }
})

/**
 * Validate the passed prompt to make sure it passes moderation.
 */
router.post("/:userId/validate-prompt", async (req: express.Request, res: express.Response) => {
    try {
        const user: UserData = (await auth.requestValidator(req, res)) as UserData
        if (!user) return
        if (!req.body.prompt) throw new Error("Missing prompt")

        let prompt = req.body.prompt
        const lastChar = prompt.substring(prompt.length - 1)
        if (![".", "!", "?"].includes(lastChar)) {
            prompt += "."
        }

        const failedCategories = await openai.validatePrompt(user, prompt)
        if (failedCategories?.length > 0) {
            webserver.renderJson(req, res, {failed: failedCategories.join(", ")})
        } else {
            webserver.renderJson(req, res, {prompt: prompt.trim()})
        }
    } catch (ex) {
        webserver.renderError(req, res, ex, 400)
    }
})

export = router
