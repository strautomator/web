// Strautomator API: Notifications

import {notifications, UserData} from "strautomator-core"
import _ = require("lodash")
import auth from "../auth"
import express = require("express")
import logger = require("anyhow")
import webserver = require("../../webserver")
const router = express.Router()

/**
 * Return unread notifications for the logged user.
 */
router.get("/unread", async (req: express.Request, res: express.Response) => {
    try {
        const user: UserData = (await auth.requestValidator(req, res)) as UserData
        if (!user) return

        const result = await notifications.getForUser(user, false)
        webserver.renderJson(req, res, result)
    } catch (ex) {
        logger.error("Routes", req.method, req.originalUrl, ex)
        return webserver.renderError(req, res, ex, 500)
    }
})

/**
 * Return all (including expired) notifications for the logged user.
 */
router.get("/all", async (req: express.Request, res: express.Response) => {
    try {
        const user: UserData = (await auth.requestValidator(req, res)) as UserData
        if (!user) return

        const result = await notifications.getForUser(user, true)
        webserver.renderJson(req, res, result)
    } catch (ex) {
        logger.error("Routes", req.method, req.originalUrl, ex)
        return webserver.renderError(req, res, ex, 500)
    }
})

/**
 * When user opens a notifications, mark it as read.
 */
router.post("/read", async (req: express.Request, res: express.Response) => {
    const result = []

    try {
        const user: UserData = (await auth.requestValidator(req, res)) as UserData
        if (!user) return

        // Validate notification IDs.
        const notificationIds = req.body
        if (!_.isArray(notificationIds)) throw new Error("Invalid notifications body")

        // Iterate notifications to make them as read.
        for (let id of notificationIds) {
            const read = await notifications.markAsRead(user, id)
            if (read) result.push(id)
        }

        logger.info("Routes", req.method, req.originalUrl, `User ${user.id}, notifications read: ${result.join(", ")}`)
    } catch (ex) {
        logger.error("Routes", req.method, req.originalUrl, ex)
    }

    webserver.renderJson(req, res, {read: result})
})

export = router
