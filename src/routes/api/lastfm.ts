// Strautomator API: Last.fm

import {lastfm, users, UserData} from "strautomator-core"
import {FieldValue} from "@google-cloud/firestore"
import auth from "../auth"
import express from "express"
import webserver = require("../../webserver")
const router: express.Router = express.Router()

/**
 * Link the Last.fm profile by username for the user account.
 */
router.post("/auth/link", async (req: express.Request, res: express.Response) => {
    try {
        const user: UserData = (await auth.requestValidator(req, res)) as UserData
        if (!user) return

        const rawUsername: string = req.body?.username
        if (!rawUsername || typeof rawUsername != "string") {
            throw new Error("Missing Last.fm username")
        }

        const username = rawUsername.toString().trim().toLowerCase().substring(0, 64)
        if (username.length < 2) {
            throw new Error("Invalid Last.fm username")
        }

        const profile = await lastfm.getProfile(user, username)
        await lastfm.saveProfile(user, profile)

        webserver.renderJson(req, res, profile)
    } catch (ex) {
        if (ex.response?.status == 404) {
            webserver.renderError(req, res, "User not found", 404)
        } else {
            webserver.renderError(req, res, ex, 400)
        }
    }
})

/**
 * Delete the Last.fm profile for the user account.
 */
router.get("/auth/unlink", async (req: express.Request, res: express.Response) => {
    try {
        const user: UserData = (await auth.requestValidator(req, res)) as UserData
        if (!user) return

        delete user.lastfm
        await users.update({id: user.id, displayName: user.displayName, lastfm: FieldValue.delete() as any})

        webserver.renderJson(req, res, {unlinked: true})
    } catch (ex) {
        webserver.renderError(req, res, ex)
    }
})

export = router
