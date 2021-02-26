// Strautomator API: Calendar

import {CalendarOptions, UserData, UserCalendarTemplate, calendar, users} from "strautomator-core"
import auth from "../auth"
import express = require("express")
import logger = require("anyhow")
import webserver = require("../../webserver")
const router = express.Router()
const settings = require("setmeup").settings

/**
 * Update the user calendar template.
 */
router.post("/:userId/template", async (req, res) => {
    try {
        if (!req.params) throw new Error("Missing request params")

        const userId = req.params.userId
        const user: UserData = (await auth.requestValidator(req, res, {userId: userId})) as UserData
        if (!user) return

        // Template is only available for PRO users.
        if (!user.isPro) {
            throw new Error("Custom calendar templates are not available on free accounts")
        }

        // Get template from body.
        const calendarTemplate: UserCalendarTemplate = {
            eventSummary: req.body.eventSummary,
            eventDetails: req.body.eventDetails
        }

        // If template is empty, force set to null.
        if (!calendarTemplate.eventSummary || calendarTemplate.eventSummary == "") {
            calendarTemplate.eventSummary = null
        }
        if (!calendarTemplate.eventDetails || calendarTemplate.eventDetails == "") {
            calendarTemplate.eventDetails = null
        }

        // Set user calendar template and save to the database.
        const data: Partial<UserData> = {
            id: user.id,
            displayName: user.displayName,
            calendarTemplate: calendarTemplate
        }
        await users.update(data)

        logger.info("Routes", req.method, req.originalUrl, "Updated template")
        webserver.renderJson(req, res, {ok: true})
    } catch (ex) {
        logger.error("Routes", req.method, req.originalUrl, ex)
        webserver.renderError(req, res, ex, 400)
    }
})

/**
 * Return the Strava activities calendar for the specified user.
 */
router.get("/:userId/:urlToken/activities.ics", async (req, res) => {
    try {
        const user = await users.getById(req.params.userId)

        // Validate user and URL token.
        if (!user) throw new Error(`User ${user.id} not found`)
        if (!user.urlToken) throw new Error(`User ${user.id} has no URL token assigned`)
        if (user.urlToken != req.params.urlToken) throw new Error(`Calendar not found`)

        // Get calendar options from query parameters.
        const options: CalendarOptions = {
            excludeCommutes: req.query.commutes === "0",
            sportTypes: req.query.sports ? req.query.sports.toString().split(",") : null
        }

        // Generate and render Strava activities as an iCalendar.
        const cal = await calendar.generate(user, options)

        logger.info("Routes", req.method, req.originalUrl)
        res.setHeader("Content-Type", "text/calendar")
        res.setHeader("Cache-Control", `max-age=${settings.calendar.ttl}`)
        return res.send(cal)
    } catch (ex) {
        logger.error("Routes", req.method, req.originalUrl, ex)
        return webserver.renderError(req, res, ex, 500)
    }
})

export = router
