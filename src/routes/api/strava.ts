// Strautomator API: Strava

import {database, events, fitparser, maps, strava, users, UserData, StravaAthleteRecords, StravaSport, StravaActivityFilter, StravaProcessedActivity} from "strautomator-core"
import auth from "../auth"
import dayjs from "../../dayjs"
import _ from "lodash"
import express = require("express")
import jaul from "jaul"
import logger from "anyhow"
import webserver = require("../../webserver")
const axios = require("axios").default
const settings = require("setmeup").settings
const router: express.Router = express.Router()
const packageVersion = require("../../../package.json").version

// ACTIVITIES AND RECORDS
// --------------------------------------------------------------------------

router.get("/status", async (req: express.Request, res: express.Response) => {
    try {
        const stravaState = await database.appState.get("strava")
        webserver.renderJson(req, res, {incident: stravaState?.incident || null})
    } catch (ex) {
        webserver.renderJson(req, res, {error: ex.message})
    }
})

/**
 * Get logged user's recent activities from Strava.
 * By default, return only 10 results.
 */
router.get("/:userId/activities/recent", async (req: express.Request, res: express.Response) => {
    try {
        const user: UserData = (await auth.requestValidator(req, res)) as UserData
        if (!user) return

        // Limit number of recent activities, with a hard coded maximum of 50.
        let limit: number = req.query.limit ? parseInt(req.query.limit as string) : 10
        if (limit > 50) limit = 50

        // Get activities for the past 21 days by default, with a hard limit of 48 days.
        let dateFrom = req.query.since ? dayjs.unix(parseInt(req.query.since as string)) : dayjs().subtract(48, "days")
        let minDate = dayjs().subtract(30, "days")
        if (dateFrom.isBefore(minDate)) dateFrom = minDate

        // Fetch recent activities.
        let activities = await strava.activities.getActivities(user, {after: dateFrom})

        // Recent activities should come first, so we reverse the array.
        activities.reverse()

        // Do not pass the limit.
        if (activities.length > limit) {
            activities = activities.slice(0, limit)
        }

        webserver.renderJson(req, res, activities)
    } catch (ex) {
        webserver.renderError(req, res, ex)
    }
})

/**
 * Get logged user's activities from Strava since the specified timestamp.
 * Maximum of 2 years.
 */
router.get("/:userId/activities/since/:timestamp", async (req: express.Request, res: express.Response) => {
    try {
        if (!req.params) throw new Error("Missing request params")

        const user: UserData = (await auth.requestValidator(req, res)) as UserData
        if (!user) return

        // Timestamp is mandatory.
        if (!req.params.timestamp) {
            throw new Error("Missing timestamp")
        }

        // Hard limit of 2 years on the minimum timestamp.
        let dateFrom = dayjs.unix(parseInt(req.params.timestamp as string))
        let minDate = dayjs().subtract(731, "days")
        if (dateFrom.isBefore(minDate)) dateFrom = minDate

        // Fetch activities since the specified timestamp.
        let activities = await strava.activities.getActivities(user, {after: dateFrom})

        // If a gear filter was passed, remove activities that are not for that particular gear.
        if (req.query.gear) {
            _.remove(activities, (a) => !a.gear || a.gear.id != req.query.gear)
        }

        webserver.renderJson(req, res, activities)
    } catch (ex) {
        webserver.renderError(req, res, ex)
    }
})

/**
 * Get the details for the specified activity.
 */
router.get("/:userId/activities/:id/details", async (req: express.Request, res: express.Response) => {
    try {
        const user: UserData = (await auth.requestValidator(req, res)) as UserData
        if (!user) return
        if (!req.params.id) throw new Error("Missing activity ID")

        const activity = await strava.activities.getActivity(user, req.params.id.toString())
        webserver.renderJson(req, res, activity)
    } catch (ex) {
        const errorMessage = ex.message || ex.toString().toLowerCase()
        const status = errorMessage.includes("not found") ? 404 : 500
        webserver.renderError(req, res, errorMessage, status)
    }
})

/**
 * Get logged user's activities that were processed by Strautomator.
 */
router.get("/:userId/processed-activities", async (req: express.Request, res: express.Response) => {
    try {
        const user: UserData = (await auth.requestValidator(req, res)) as UserData
        if (!user) return

        // Limit number of activities returned?
        const limit: number = req.query.limit ? parseInt(req.query.limit as string) : null
        const dateFrom: Date = req.query.from ? dayjs(req.query.from.toString()).startOf("day").toDate() : null
        const dateTo: Date = req.query.to ? dayjs(req.query.to.toString()).endOf("day").toDate() : null

        const activities = await strava.activityProcessing.getProcessedActivities(user, dateFrom, dateTo, limit)

        // If user has a Garmin or Wahoo account linked, append the related FIT file activities as well.
        if (user.garmin) {
            const getGarminActivity = async (activity: StravaProcessedActivity) => {
                const garminActivity = await fitparser.getMatchingActivity(user, activity, "garmin")
                if (garminActivity) {
                    activity.garminActivity = garminActivity
                }
            }
            await Promise.allSettled(activities.map(getGarminActivity))
        }
        if (user.wahoo) {
            const getWahooActivity = async (activity: StravaProcessedActivity) => {
                const garminActivity = await fitparser.getMatchingActivity(user, activity, "wahoo")
                if (garminActivity) {
                    activity.wahooActivity = garminActivity
                }
            }
            await Promise.allSettled(activities.map(getWahooActivity))
        }

        webserver.renderJson(req, res, activities)
    } catch (ex) {
        webserver.renderError(req, res, ex)
    }
})

/**
 * Get a single processed activity for the logger user.
 */
router.get("/:userId/processed-activities/:id", async (req: express.Request, res: express.Response) => {
    try {
        const user: UserData = (await auth.requestValidator(req, res)) as UserData
        if (!user) return

        const activity = await strava.activityProcessing.getProcessedActivity(user, req.params.id)
        webserver.renderJson(req, res, activity)
    } catch (ex) {
        webserver.renderError(req, res, ex, 404)
    }
})

/**
 * Logged user can trigger a batch processing of older activities.
 */
router.post("/:userId/process-activities", async (req: express.Request, res: express.Response) => {
    try {
        if (!req.body) throw new Error("Missing request body")

        const user: UserData = (await auth.requestValidator(req, res)) as UserData
        if (!user) return

        let dateFrom = req.body.dateFrom ? dayjs(req.body.dateFrom as string).utc() : null
        let dateTo = req.body.dateTo ? dayjs(req.body.dateTo as string).utc() : null
        let filterPrivacy = req.body.filterPrivacy ? req.body.filterPrivacy : "all"
        let filterSport = req.body.filterSport ? req.body.filterSport : "all"
        let filterType = req.body.filterType ? req.body.filterType : "all"

        // Check if passed dates are valid
        if (!dateFrom || !dateFrom.isValid) throw new Error(`Invalid "from" date`)
        if (dateTo && !dateTo.isValid) throw new Error(`Invalid "to" date`)

        // Limit batch operations per day.
        if (user.dateLastBatchProcessing && dayjs().subtract(settings.strava.processingQueue.batchPerHours, "hours").isBefore(user.dateLastBatchProcessing)) {
            throw new Error(`Only a single batch operation allowed every ${settings.strava.processingQueue.batchPerHours} hour(s)`)
        }

        // Additional batch processing filters.
        let filter: StravaActivityFilter = {}
        if (filterPrivacy == "private") filter.private = true
        else if (filterPrivacy == "public") filter.private = false
        if (filterType == "commute") filter.commute = true
        else if (filterType == "notCommute") filter.commute = false
        if (filterSport != "all") filter.sportType = filterSport

        const activityCount = await strava.activityProcessing.batchProcessActivities(user, dateFrom.startOf("day"), dateTo.endOf("day"), filter)

        // Start processing the first batch of activities straight away.
        await strava.activityProcessing.processQueuedActivities()

        webserver.renderJson(req, res, {activityCount: activityCount, processed: activityCount <= settings.strava.processingQueue.batchSize})
    } catch (ex) {
        const errorMessage = ex.message || ex.toString()
        webserver.renderError(req, res, ex, errorMessage.includes("single batch operation") ? 429 : 500)
    }
})

/**
 * Logged user can trigger a forced processing of a particular activity.
 */
router.get("/:userId/process-activity/:activityId", async (req: express.Request, res: express.Response) => {
    try {
        if (!req.params) throw new Error("Missing request params")

        const user: UserData = (await auth.requestValidator(req, res)) as UserData
        if (!user) return

        // Process the passed activity.
        const processedActivity = await strava.activityProcessing.processActivity(user, {id: parseInt(req.params.activityId)})
        webserver.renderJson(req, res, processedActivity || {processed: false})
    } catch (ex) {
        const errorMessage = ex.toString()
        webserver.renderError(req, res, ex, errorMessage.includes("not found") ? 404 : 500)
    }
})

/**
 * Get athlete's personal records.
 */
router.get("/:userId/athlete-records", async (req: express.Request, res: express.Response) => {
    try {
        const user: UserData = (await auth.requestValidator(req, res)) as UserData
        if (!user) return

        const records = await strava.athletes.getAthleteRecords(user)
        webserver.renderJson(req, res, records)
    } catch (ex) {
        webserver.renderError(req, res, ex)
    }
})

/**
 * Prepare and refresh athlete's personal records based on all Strava activities.
 */
router.get("/:userId/athlete-records/refresh", async (req: express.Request, res: express.Response) => {
    try {
        const user: UserData = (await auth.requestValidator(req, res)) as UserData
        if (!user) return

        const existing = await strava.athletes.getAthleteRecords(user)
        const now = dayjs().utc().subtract(1, "second")
        const minDate = now.subtract(24, "hours")

        // Stop here if records were recently refreshed.
        if (existing && minDate.isBefore(existing.dateRefreshed)) {
            logger.warn("Routes.strava", req.method, req.originalUrl, "Recently refreshed, will not proceed")
            webserver.renderJson(req, res, {recentlyRefreshed: true})
            return
        }

        // First we prepare the baseline.
        await strava.athletes.prepareAthleteRecords(user)

        const dateFrom = dayjs("2000-01-01").utc()
        const dateTo = now

        // Now get all user activities and check their records.
        const activities = await strava.activities.getActivities(user, {after: dateFrom, before: dateTo})
        const records = await strava.athletes.checkActivityRecords(user, activities)

        webserver.renderJson(req, res, records)
    } catch (ex) {
        webserver.renderError(req, res, ex)
    }
})

/**
 * Update an athlete record manually.
 */
router.post("/:userId/athlete-records/:sport", async (req: express.Request, res: express.Response) => {
    try {
        const user: UserData = (await auth.requestValidator(req, res)) as UserData
        if (!user) return
        if (!req.body) throw new Error("Missing request body")

        // Record parameters.
        const sportsList = Object.keys(StravaSport)
        const sport = req.params.sport
        const field = req.body.field
        const value = req.body.value
        const previous = req.body.previous

        // Validate request body.
        if (!field) throw new Error("Missing record field")
        if (!value || isNaN(value)) throw new Error("Missing or invalid record value")
        if (!sportsList.includes(sport)) throw new Error("Invalid sport")

        // Update record and save to the database.
        const records: StravaAthleteRecords = {
            [sport]: {
                [field]: {
                    value: parseFloat(value),
                    activityId: null,
                    date: new Date()
                }
            }
        }

        // Also update the previous value?
        if (previous && !isNaN(previous)) {
            records[sport][field].previous = previous
        }

        await strava.athletes.setAthleteRecords(user, records)
        webserver.renderJson(req, res, records)
    } catch (ex) {
        webserver.renderError(req, res, ex)
    }
})

// FTP ESTIMATOR
// --------------------------------------------------------------------------

/**
 * Get estimated FTP based on activities during the past weeks.
 */
router.get("/:userId/ftp/estimate", async (req: express.Request, res: express.Response) => {
    try {
        if (!req.params) throw new Error("Missing request params")

        const user: UserData = (await auth.requestValidator(req, res)) as UserData
        if (!user) return

        // Estimate the athlete's FTP.
        const data = await strava.performance.estimateFtp(user)
        webserver.renderJson(req, res, data || false)
    } catch (ex) {
        webserver.renderError(req, res, ex)
    }
})

/**
 * Update the user's FTP on Strava.
 */
router.post("/:userId/ftp/estimate", async (req: express.Request, res: express.Response) => {
    try {
        if (!req.params) throw new Error("Missing request params")

        const user: UserData = (await auth.requestValidator(req, res)) as UserData
        if (!user) return

        const estimation = await strava.performance.estimateFtp(user)
        if (req.body?.ftp && req.body.ftp > 0) {
            estimation.ftpWatts = parseInt(req.body.ftp)
        }

        // Update the user's FTP.
        const updated = await strava.performance.saveFtp(user, estimation)
        const result = updated ? {ftp: estimation.ftpWatts} : false
        webserver.renderJson(req, res, result)
    } catch (ex) {
        webserver.renderError(req, res, ex)
    }
})

// CLUBS, EVENTS AND ROUTES
// --------------------------------------------------------------------------

/**
 * Gets list of routes for the user.
 */
router.get("/:userId/routes", async (req: express.Request, res: express.Response) => {
    try {
        if (!req.params) throw new Error("Missing request params")

        const user: UserData = (await auth.requestValidator(req, res)) as UserData
        if (!user) return

        const routes = await strava.routes.getUserRoutes(user)
        webserver.renderJson(req, res, routes)
    } catch (ex) {
        webserver.renderError(req, res, ex)
    }
})

/**
 * Get upcoming club events for the user.
 * Defaults to 7 days for PRO and 2 days for Free accounts.
 */
router.get("/:userId/clubs/upcoming-events", async (req: express.Request, res: express.Response) => {
    try {
        if (!req.params) throw new Error("Missing request params")

        const user: UserData = (await auth.requestValidator(req, res)) as UserData
        if (!user) return

        const days = req.query.days ? parseInt(req.query.days as string) : user.isPro ? settings.plans.pro.futureCalendarDays : settings.plans.free.futureCalendarDays
        if (!user.isPro && days > settings.plans.free.futureCalendarDays) {
            throw new Error(`Free accounts are limited to ${settings.plans.free.futureCalendarDays} days in the future`)
        }

        const countries = [user.profile.country]

        // Coordinates were passed? Geocode the country.
        if (req.query.coordinates) {
            const queryCoords = req.query.coordinates.toString()
            const coordinates = queryCoords.split(",").map((c) => parseFloat(c)) as [number, number]
            const address = await maps.getReverseGeocode(coordinates, "locationiq")
            if (address && address.country != user.profile.country) {
                countries.push(address.country)
            }
        }

        const events = await strava.clubs.getUpcomingClubEvents(user, days, countries)
        webserver.renderJson(req, res, events)
    } catch (ex) {
        webserver.renderError(req, res, ex)
    }
})

/**
 * Returns a ZIP file with the specified routes.
 */
router.get("/:userId/:urlToken/routes.zip", async (req: express.Request, res: express.Response) => {
    try {
        if (!req.params) throw new Error("Missing request params")

        const user = await users.getById(req.params.userId)

        // Validate user and URL token.
        if (!user) throw new Error(`User ${req.params.userId} not found`)
        if (user.urlToken != req.params.urlToken) throw new Error(`Download not found`)

        const routes = req.query.routes as string
        if (!routes) {
            throw new Error("Missing route IDs")
        }

        const zip = await strava.routes.zipGPX(user, routes.split(","))
        zip.pipe(res).on("error", (err) => logger.error("Routes.strava", req.method, req.originalUrl, err))
    } catch (ex) {
        webserver.renderError(req, res, ex)
    }
})

// WEBHOOKS
// --------------------------------------------------------------------------

/**
 * Activity subscription events sent by Strava. Please note that this route will
 * mostly return OK 200, unless the verification token is invalid.
 */
router.get(`/webhook/${settings.strava.api.urlToken}`, async (req: express.Request, res: express.Response) => {
    try {
        if (!req.params) throw new Error("Missing request params")

        const challenge = req.query["hub.challenge"] as string
        const verifyToken = req.query["hub.verify_token"] as string
        const clientIP = jaul.network.getClientIP(req)

        // Validate token from Strava.
        if (verifyToken != settings.strava.api.verifyToken) {
            return webserver.renderError(req, res, "Invalid verify_token", 401)
        }

        // Validate challenge from Strava.
        if (!challenge || challenge == "") {
            return webserver.renderError(req, res, "Missing hub challenge", 401)
        }

        // Echo hub challenge back to Strava.
        webserver.renderJson(req, res, {"hub.challenge": challenge})
        logger.info("Routes.strava", `Subscription challenge by Strava: ${challenge}`, `IP ${clientIP}`)
    } catch (ex) {
        webserver.renderError(req, res, ex, 401)
    }
})

/**
 * Subscription events sent by Strava. Please note that this route will
 * mostly return OK 200, unless the URL token or POST data is invalid.
 */
router.post(`/webhook/${settings.strava.api.urlToken}`, async (req: express.Request, res: express.Response) => {
    try {
        if (!req.params || !req.body) throw new Error("Missing request params")

        const obj = req.body

        // Check if any data is missing.
        if (!obj.aspect_type || !obj.event_time || !obj.object_id || !obj.object_type) {
            throw new Error("Request body is missing required data")
        }

        const clientIP = jaul.network.getClientIP(req)
        const objId = obj.object_id.toString()
        const userId = obj.owner_id.toString()
        const objType = obj.object_type
        const objAspect = obj.aspect_type
        const objUpdates = obj.updates
        const arrUpdates = objAspect == "update" && objUpdates ? Object.entries(objUpdates) : []
        const logUpdates = arrUpdates.length > 0 ? ` (${arrUpdates.map((u) => `${u[0]}: ${u[1]}`).join(", ")})` : ""
        const logDetails = `User ${userId}: ${objType} ${objAspect} - ${objId}${logUpdates}, IP ${clientIP}`

        // Stop here if user is ignored.
        if (users.ignoredUserIds.includes(userId)) {
            logger.debug("Routes.strava", req.method, req.originalUrl, "User is ignored, won't process", logDetails)
            return webserver.renderJson(req, res, {ok: false})
        }

        // User has deauthorized Strautomator?
        if (objType == "athlete" && obj.updates?.authorized == "false") {
            logger.warn("Routes.strava", req.method, req.originalUrl, `User ${userId} possibly deauthorized`)
            strava.athletes.deauthCheck(obj.owner_id.toString())
            return webserver.renderJson(req, res, {authorized: false})
        }

        // From here on we only care about activities, so skip the rest.
        if (objType != "activity") {
            return webserver.renderJson(req, res, {ok: false})
        }

        logger.info("Routes.strava", logDetails)

        // Make a callback to the API to do the actual activity processing,
        // so we can return the response right now to Strava (within the 2 seconds max).
        // This is to avoid Cloud Run freezing the execution after response has been sent.
        const options = {
            method: "GET",
            baseURL: settings.api.url || `${settings.app.url}api/`,
            url: `/strava/webhook/${settings.strava.api.urlToken}/${userId}/${objId}?action=${objAspect}`,
            headers: {"User-Agent": `${settings.app.title} / ${packageVersion}`}
        }

        axios(options).catch(() => {
            logger.warn("Routes.strava", req.method, req.originalUrl, "Activity callback endpoint failed, will try again")
            axios(options).catch((err) => {
                logger.error("Routes.strava", req.method, req.originalUrl, "Activity callback endpoint failed again", err.toString())
            })
        })
        webserver.renderJson(req, res, {ok: true})
    } catch (ex) {
        logger.error("Routes.strava", req.method, req.originalUrl, ex)
        webserver.renderError(req, res, ex)
    }
})

/**
 * Called by the route above, this will effectively process the activity sent by Strava.
 */
router.get(`/webhook/${settings.strava.api.urlToken}/:userId/:activityId`, async (req: express.Request, res: express.Response) => {
    try {
        if (!req.params) throw new Error("Missing request params")
        if (!req.headers["user-agent"].includes(settings.app.title)) throw new Error("Unauthorized client")

        const userId = req.params.userId
        const user = await users.getById(userId)

        // User not found, suspended or missing tokens? Stop here.
        if (!user) {
            await users.ignore(userId)
            return webserver.renderError(req, res, "User not found", 404)
        } else if (!user.stravaTokens || (!user.stravaTokens.accessToken && !user.stravaTokens.refreshToken)) {
            return webserver.renderError(req, res, "User has no access tokens", 400)
        } else if (user.suspended) {
            return webserver.renderJson(req, res, {message: "User is suspended"})
        }

        const now = dayjs.utc().toDate()
        const action = req.query.action as string
        const activityId = parseInt(req.params.activityId)

        // New activity uploaded?
        if (action == "create") {
            if (user.preferences.delayedProcessing) {
                await strava.activityProcessing.queueActivity(user, activityId)
                user.dateLastProcessedActivity = now
            } else {
                const processed = await strava.activityProcessing.processActivity(user, {id: activityId})
                if (processed && !processed.error) {
                    user.dateLastProcessedActivity = now
                }
            }
            events.emit("Strava.createActivity", user, activityId)
        }
        // Activity updated?
        else if (action == "update") {
            events.emit("Strava.updateActivity", user, activityId)
        }
        // Activity deleted?
        else if (action == "delete") {
            events.emit("Strava.deleteActivity", user, activityId)
        }

        // Update user.
        user.dateLastActivity = now
        const updatedUser = {id: user.id, displayName: user.displayName, dateLastActivity: user.dateLastActivity, dateLastProcessedActivity: user.dateLastProcessedActivity}
        await users.update(updatedUser)

        webserver.renderJson(req, res, {ok: true})
    } catch (ex) {
        webserver.renderError(req, res, ex)
    }
})

/**
 * Process queued activities (delayed processing).
 */
router.get(`/webhook/${settings.strava.api.urlToken}/process-activity-queue`, async (req: express.Request, res: express.Response) => {
    try {
        if (!req.params) throw new Error("Missing request params")

        await strava.activityProcessing.processQueuedActivities()
        webserver.renderJson(req, res, {ok: true})
    } catch (ex) {
        webserver.renderError(req, res, ex)
    }
})

export = router
