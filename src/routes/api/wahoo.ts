// Strautomator API: Wahoo

import {fitparser, strava, wahoo, UserData} from "strautomator-core"
import auth from "../auth"
import express from "express"
import webserver = require("../../webserver")
const settings = require("setmeup").settings
const router: express.Router = express.Router()

/**
 * Initiate an authentication procedure with Wahoo.
 */
router.get("/auth/url", async (req: express.Request, res: express.Response) => {
    try {
        const user: UserData = (await auth.requestValidator(req, res)) as UserData
        if (!user) return

        const authUrl = await wahoo.getAuthUrl(user)
        webserver.renderJson(req, res, {url: authUrl})
    } catch (ex) {
        webserver.renderError(req, res, ex)
    }
})

/**
 * Validate authentication and try getting an access token from Wahoo.
 */
router.get("/auth/callback", async (req: express.Request, res: express.Response) => {
    try {
        await wahoo.processAuthCode(req)
        res.redirect("/account?wahoo=linked")
    } catch (ex) {
        webserver.renderError(req, res, ex)
    }
})

/**
 * Delete Wahoo profile for the user account.
 */
router.get("/auth/unlink", async (req: express.Request, res: express.Response) => {
    try {
        const user: UserData = (await auth.requestValidator(req, res)) as UserData
        if (!user) return

        await wahoo.profiles.deleteProfile(user)
        webserver.renderJson(req, res, {unlinked: true})
    } catch (ex) {
        webserver.renderError(req, res, ex)
    }
})

/**
 * Listen for Garmin webhooks.
 */
router.post(`/webhook/${settings.wahoo.api.urlToken}`, async (req: express.Request, res: express.Response) => {
    try {
        await wahoo.webhooks.processWebhook(req)
        webserver.renderJson(req, res, {ok: true})
    } catch (ex) {
        webserver.renderError(req, res, ex)
    }
})

/**
 * Get the specified Wahoo activity (if there's any).
 */
router.post("/:userId/match-activity/:stravaId", async (req: express.Request, res: express.Response) => {
    try {
        const user: UserData = (await auth.requestValidator(req, res)) as UserData
        if (!user) return

        // If the Strava activity data was not passed, get it from their API first.
        const activity = req.body?.id && req.body?.type ? req.body : await strava.activities.getActivity(user, req.params.stravaId.toString())
        if (!activity) {
            throw new Error("Activity not found")
        }

        // Fetch processed Garmin activity (if there's one).
        const wahooActivity = await fitparser.getMatchingActivity(user, "wahoo", activity)
        if (!wahooActivity) {
            webserver.renderJson(req, res, {notFound: true})
        } else {
            webserver.renderJson(req, res, wahooActivity)
        }
    } catch (ex) {
        webserver.renderError(req, res, ex)
    }
})

export = router
