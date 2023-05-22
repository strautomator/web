// Strautomator API: Announcements

import {announcements, UserData} from "strautomator-core"
import auth from "../auth"
import express = require("express")
import webserver = require("../../webserver")
const router: express.Router = express.Router()

/**
 * Return active announcements. Please note that the read count will always come zeroed.
 */
router.get("/:userId/active", async (req: express.Request, res: express.Response) => {
    try {
        const user: UserData = (await auth.requestValidator(req, res)) as UserData
        if (!user) return

        const all = await announcements.getActive()
        all.forEach((a) => delete a.readCount)

        // Filter specific announcements for PRO / Free users.
        const result = all.filter((a) => {
            if (a.isFree && user.isPro) return false
            if (a.isPro && !user.isPro) return false
            return true
        })

        webserver.renderJson(req, res, result)
    } catch (ex) {
        return webserver.renderError(req, res, ex)
    }
})

/**
 * When user closes an announcement, increase its read count.
 * This route will never trigger an exception.
 */
router.post("/:userId/read", async (req: express.Request, res: express.Response) => {
    try {
        const user: UserData = (await auth.requestValidator(req, res)) as UserData
        if (!user) return

        // Validate announcement ID.
        const id = req.body.id
        if (!id) throw new Error("Missing announcement ID")

        // Increase read count.
        await announcements.setReadCount(user, id)
        webserver.renderJson(req, res, {read: true})
    } catch (ex) {
        webserver.renderJson(req, res, {read: false})
    }
})

export = router
