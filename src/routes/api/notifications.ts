// Strautomator API: Notifications

import {notifications, UserData} from "strautomator-core"
import _ from "lodash"
import auth from "../auth"
import express = require("express")
import logger from "anyhow"
import webserver = require("../../webserver")
const router: express.Router = express.Router()

/**
 * Return unread notifications for the logged user.
 */
router.get("/:userId/unread", async (req: express.Request, res: express.Response) => {
    try {
        const user: UserData = (await auth.requestValidator(req, res)) as UserData
        if (!user) return

        const result = await notifications.getByUser(user, false)
        webserver.renderJson(req, res, result)
    } catch (ex) {
        return webserver.renderError(req, res, ex)
    }
})

/**
 * Return all (including expired) notifications for the logged user.
 */
router.get("/:userId/all", async (req: express.Request, res: express.Response) => {
    try {
        const user: UserData = (await auth.requestValidator(req, res)) as UserData
        if (!user) return

        const result = await notifications.getByUser(user, true)
        webserver.renderJson(req, res, result)
    } catch (ex) {
        return webserver.renderError(req, res, ex)
    }
})

/**
 * When user opens a notifications, mark it as read.
 */
router.post("/:userId/read", async (req: express.Request, res: express.Response) => {
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
    } catch (ex) {
        logger.error("Routes.notifications", req.method, req.originalUrl, ex)
    }

    webserver.renderJson(req, res, {read: result})
})

export = router
