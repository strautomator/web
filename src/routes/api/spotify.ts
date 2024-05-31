// Strautomator API: Spotify

import {spotify, strava, users, UserData} from "strautomator-core"
import auth from "../auth"
import express from "express"
import webserver = require("../../webserver")
const router: express.Router = express.Router()

/**
 * Initiate an authentication procedure with Spotify.
 */
router.get("/auth/url", async (req: express.Request, res: express.Response) => {
    try {
        const user: UserData = (await auth.requestValidator(req, res)) as UserData
        if (!user) return

        const authUrl = await spotify.generateAuthUrl(user)
        webserver.renderJson(req, res, {url: authUrl})
    } catch (ex) {
        webserver.renderError(req, res, ex)
    }
})

/**
 * Validate authentication and try getting an access token from Spotify.
 */
router.get("/auth/callback", async (req: express.Request, res: express.Response) => {
    try {
        await spotify.processAuthCode(req)
        res.redirect("/account?spotify=linked")
    } catch (ex) {
        webserver.renderError(req, res, ex)
    }
})

/**
 * Delete Spotify profile for the user account.
 */
router.get("/auth/unlink", async (req: express.Request, res: express.Response) => {
    try {
        const user: UserData = (await auth.requestValidator(req, res)) as UserData
        if (!user) return

        delete user.spotify
        delete user.spotifyAuthState
        await users.update(user, true)

        webserver.renderJson(req, res, {unlinked: true})
    } catch (ex) {
        webserver.renderError(req, res, ex)
    }
})

/**
 * Get list of Spotify tracks that played during the specified activity.
 */
router.get("/:userId/activity-tracks/:activityId", async (req: express.Request, res: express.Response) => {
    try {
        const user: UserData = (await auth.requestValidator(req, res)) as UserData
        if (!user) return

        const activity = await strava.activities.getActivity(user, req.params.activityId)
        const tracks = await spotify.getActivityTracks(user, activity)

        webserver.renderJson(req, res, tracks)
    } catch (ex) {
        webserver.renderError(req, res, ex)
    }
})

export = router
