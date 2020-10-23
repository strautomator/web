// Strautomator API: Calendar

import {CalendarOptions, calendar, users} from "strautomator-core"
import express = require("express")
import logger = require("anyhow")
import webserver = require("../../webserver")
const router = express.Router()
const settings = require("setmeup").settings

/**
 * Return the Strava activities calendar for the specified user.
 */
router.get("/:userId/:urlToken/activities.ical", async (req, res) => {
    try {
        const user = await users.getById(req.params.userId)

        // Validate user URL token.
        if (!user.urlToken) throw new Error(`User ${user.id} has no URL token assigned`)
        if (user.urlToken != req.params.urlToken) throw new Error(`Calendar not found`)

        // Get calendar options from query parameters.
        const options: CalendarOptions = {
            excludeCommutes: req.query.commutes === "0",
            sportTypes: req.query.sports ? req.query.sports.toString().split(",") : null
        }

        // Generate and render Strava activities as an iCal calendar.
        const cal = await calendar.generate(user, options)

        logger.info("Routes", req.method, req.originalUrl)
        res.setHeader("Content-Type", "text/calendar")
        res.setHeader("Cache-Control", `max-age=${settings.calendar.ttl}`)
        return res.send(cal)
    } catch (ex) {
        logger.error("Routes", req.method, req.originalUrl, ex)
        webserver.renderError(req, res, ex, 500)
    }
})

export = router
