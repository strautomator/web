// Strautomator API: Garmin

import {garmin, UserData} from "strautomator-core"
import auth from "../auth"
import express from "express"
import webserver = require("../../webserver")
import _ from "lodash"
const settings = require("setmeup").settings
const router: express.Router = express.Router()

/**
 * Initiate an authentication procedure with Garmin.
 */
router.get("/auth/url", async (req: express.Request, res: express.Response) => {
    try {
        const user: UserData = (await auth.requestValidator(req, res)) as UserData
        if (!user) return

        const authUrl = await garmin.generateAuthUrl(user)
        webserver.renderJson(req, res, {url: authUrl})
    } catch (ex) {
        webserver.renderError(req, res, ex)
    }
})

/**
 * Validate authentication and try getting an access token from Garmin.
 */
router.get("/auth/callback", async (req: express.Request, res: express.Response) => {
    try {
        await garmin.processAuthCallback(req)
        res.redirect("/account?garmin=linked")
    } catch (ex) {
        webserver.renderError(req, res, ex)
    }
})

/**
 * Delete Garmin profile for the user account.
 */
router.get("/auth/unlink", async (req: express.Request, res: express.Response) => {
    try {
        const user: UserData = (await auth.requestValidator(req, res)) as UserData
        if (!user) return

        await garmin.profiles.deleteProfile(user)
        webserver.renderJson(req, res, {unlinked: true})
    } catch (ex) {
        webserver.renderError(req, res, ex)
    }
})

/**
 * Listen for Garmin webhooks.
 */
router.post(`/webhook/${settings.garmin.api.urlToken}`, async (req: express.Request, res: express.Response) => {
    try {
        await garmin.webhooks.processWebhook(req)
        webserver.renderJson(req, res, {ok: true})
    } catch (ex) {
        webserver.renderError(req, res, ex)
    }
})

export = router
