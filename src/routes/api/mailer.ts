// Strautomator API: Mailer

import {events} from "strautomator-core"
import axios from "axios"
import express from "express"
import logger from "anyhow"
import webserver = require("../../webserver")
const settings = require("setmeup").settings
const router: express.Router = express.Router()

/**
 * Handle email bounces.
 */
router.post("/bounce/:bounceUrlToken", async (req: express.Request, res: express.Response) => {
    try {
        if (settings.mailer.bounceUrlToken && req.params.bounceUrlToken != settings.mailer.bounceUrlToken) {
            return webserver.renderError(req, res, "Invalid URL bounce token", 401)
        }

        let body = req.body
        if (typeof body === "string") {
            try {
                body = JSON.parse(body)
            } catch {
                return webserver.renderError(req, res, "Invalid body", 400)
            }
        }

        // Handle SNS SubscriptionConfirmation.
        if (body.Type == "SubscriptionConfirmation" && body.SubscribeURL) {
            logger.info("Routes.mailer", req.method, req.originalUrl, "Subscription confirmed")

            await axios.get(body.SubscribeURL)
            return webserver.renderJson(req, res, {confirmed: true})
        }

        // Handle SES Bounce notification.
        if (body.Type == "Notification" && body.Message) {
            const message = typeof body.Message === "string" ? JSON.parse(body.Message) : body.Message
            if (message.notificationType == "Bounce" && message.bounce?.bouncedRecipients) {
                for (const recipient of message.bounce.bouncedRecipients) {
                    events.emit("Users.emailBounced", recipient.emailAddress)
                }
            }
        }

        webserver.renderJson(req, res, {ok: true})
    } catch (ex) {
        webserver.renderError(req, res, ex)
    }
})

export default router
