// Strautomator API: Notifications

import {notifications, UserData} from "strautomator-core"
import auth from "../auth"
import express = require("express")
import logger = require("anyhow")
import webserver = require("../../webserver")
const router = express.Router()

/**
 * Return unread notifications for the logged user.
 */
router.get("/unread", async (req, res) => {
    try {
        const user: UserData = (await auth.requestValidator(req, res)) as UserData
        if (!user) return

        const result = await notifications.getForUser(user, false)

        logger.info("Routes", req.method, req.originalUrl, `Got ${result.length} unread notifications`)
        webserver.renderJson(req, res, result)
    } catch (ex) {
        logger.error("Routes", req.method, req.originalUrl, ex)
        return webserver.renderError(req, res, ex, 500)
    }
})

/**
 * Return all (including expired) notifications for the logged user.
 */
router.get("/all", async (req, res) => {
    try {
        const user: UserData = (await auth.requestValidator(req, res)) as UserData
        if (!user) return

        const result = await notifications.getForUser(user, true)

        logger.info("Routes", req.method, req.originalUrl, `Got ${result.length} notifications`)
        webserver.renderJson(req, res, result)
    } catch (ex) {
        logger.error("Routes", req.method, req.originalUrl, ex)
        return webserver.renderError(req, res, ex, 500)
    }
})

/**
 * When user opens a notifications, mark it as read.
 */
router.post("/read/:notificationId", async (req, res) => {
    try {
        const user: UserData = (await auth.requestValidator(req, res)) as UserData
        if (!user) return

        const result = await notifications.markAsRead(user, req.params.notificationId)

        logger.info("Routes", req.method, req.originalUrl, `Read: ${result}`)
        webserver.renderJson(req, res, {read: result})
    } catch (ex) {
        const status = ex.message && ex.message.indexOf("not found") > 0 ? 404 : 400
        logger.error("Routes", req.method, req.originalUrl, ex)
        return webserver.renderError(req, res, ex, status)
    }
})

export = router
