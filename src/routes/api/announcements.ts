// Strautomator API: Announcements

import {announcements, UserData} from "strautomator-core"
import auth from "../auth"
import express = require("express")
import logger = require("anyhow")
import webserver = require("../../webserver")
const router = express.Router()

/**
 * Return active announcements. Please note that the read count will always come zeroed.
 */
router.get("/active", async (req, res) => {
    try {
        const user: UserData = (await auth.requestValidator(req, res)) as UserData
        if (!user) return

        const result = await announcements.getActive()
        result.forEach((a) => delete a.readCount)

        webserver.renderJson(req, res, result)
    } catch (ex) {
        logger.error("Routes", req.method, req.originalUrl, ex)
        return webserver.renderError(req, res, ex, 500)
    }
})

/**
 * When user closes an announcement, increase its read count.
 * This route will never trigger an exception.
 */
router.post("/read", async (req, res) => {
    try {
        const user: UserData = (await auth.requestValidator(req, res)) as UserData
        if (!user) return

        // Validate announcement ID.
        const id = req.body.id
        if (!id) throw new Error("Missing announcement ID")

        // Increase read count.
        await announcements.setReadCount(id, user)
        webserver.renderJson(req, res, {read: true})
    } catch (ex) {
        logger.error("Routes", req.method, req.originalUrl, ex)
        webserver.renderJson(req, res, {read: false})
    }
})

export = router
