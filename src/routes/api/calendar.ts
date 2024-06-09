// Strautomator API: Calendar

import {CalendarOptions, UserData, UserCalendarTemplate, calendar, users} from "strautomator-core"
import auth from "../auth"
import dayjs from "../../dayjs"
import express = require("express")
import logger from "anyhow"
import webserver = require("../../webserver")
const router: express.Router = express.Router()
const settings = require("setmeup").settings

/**
 * Return the Strava calendar for the specified user.
 */
router.get("/:userId/:urlToken/:calType.ics", async (req: express.Request, res: express.Response) => {
    try {
        if (!req.params) throw new Error("Missing request params")

        const user = await users.getById(req.params.userId)
        const calType = req.params.calType

        // Validate user and URL token.
        if (!["all", "activities", "clubs"].includes(calType)) throw new Error("Calendar not found")
        if (!user) throw new Error(`User ${req.params.userId} not found`)
        if (user.urlToken != req.params.urlToken) throw new Error(`Calendar not found`)

        // Get base calendar options from query parameters.
        const options: CalendarOptions = {
            activities: calType == "all" || calType == "activities",
            clubs: calType == "all" || calType == "clubs"
        }

        // Set extra calendar options.
        if (req.query.commutes === "0") options.excludeCommutes = true
        if (req.query.joined === "1") options.excludeNotJoined = true
        if (req.query.countries === "1") options.includeAllCountries = true
        if (req.query.link === "1") options.linkInDescription = true
        if (req.query.compact === "1") options.compact = true
        if (req.query.sports?.toString().length > 1) options.sportTypes = req.query.sports.toString().split(",")
        if (req.query.clubs?.toString().length > 1) options.clubIds = req.query.clubs.toString().split(",")
        if (req.query.daysfrom) options.daysFrom = parseInt(req.query.daysfrom as string)
        if (req.query.daysto) options.daysTo = parseInt(req.query.daysto as string)
        if (req.query.fresher) options.fresher = true

        // Set the correct cache TTL based on user plan and preferences.
        let cacheAge = user.isPro ? settings.plans.pro.calendarCacheDuration : settings.plans.free.calendarCacheDuration
        if (user.isPro && options.fresher) {
            cacheAge = cacheAge / 2
        }
        const expires = dayjs.utc().add(cacheAge, "seconds")

        // Update cache headers and send response.
        res.setHeader("Content-Type", "text/calendar")
        res.setHeader("Cache-Control", `public, max-age=${cacheAge}`)
        res.setHeader("Expires", `${expires.format("ddd, DD MMM YYYY HH:mm:ss")} GMT`)

        // Generate the calendar.
        const redirectUrl = await calendar.get(user, options)
        res.redirect(302, redirectUrl)
    } catch (ex) {
        const message = ex.message || ex.toString()
        if (message.includes(" not found")) {
            logger.warn("Routes.calendar", req.method, req.originalUrl, "Not found")
            res.status(404)
        } else {
            logger.error("Routes", req.method, req.originalUrl, ex)
            res.status(500)
        }

        return res.send(ex.toString())
    }
})

/**
 * Update the user calendar template.
 */
router.post("/:userId/template", async (req: express.Request, res: express.Response) => {
    try {
        if (!req.params) throw new Error("Missing request params")

        const user: UserData = (await auth.requestValidator(req, res)) as UserData
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
            preferences: {calendarTemplate: calendarTemplate}
        }
        await users.update(data)
        webserver.renderJson(req, res, {ok: true})
    } catch (ex) {
        webserver.renderError(req, res, ex, 400)
    }
})

/**
 * Delete the cached calendars for the specified user.
 */
router.delete("/:userId", async (req: express.Request, res: express.Response) => {
    try {
        if (!req.params) throw new Error("Missing request params")

        const user: UserData = (await auth.requestValidator(req, res)) as UserData
        if (!user) return

        // Cache clean is only available for PRO users.
        if (!user.isPro) {
            throw new Error("Only PRO users are allowed to delete the calendar cache")
        }

        const count = await calendar.deleteForUser(user)
        webserver.renderJson(req, res, {count: count})
    } catch (ex) {
        webserver.renderError(req, res, ex, 400)
    }
})

export = router
