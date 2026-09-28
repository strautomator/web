// Strautomator API: Mailer

import {events} from "strautomator-core"
import {isSnsUrl, verifySnsMessage} from "../../utils/sns"
import axios from "axios"
import crypto from "crypto"
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
        if (!settings.mailer.bounceUrlToken) {
            return webserver.renderError(req, res, "Bounce notifications not enabled on this server", 403)
        }
        const tokenHash = (value: string) => crypto.createHash("sha256").update(value || "").digest()
        if (!crypto.timingSafeEqual(tokenHash(req.params.bounceUrlToken as string), tokenHash(settings.mailer.bounceUrlToken))) {
            return webserver.renderError(req, res, "Invalid URL bounce token", 401)
        }

        // SNS posts JSON with a text/plain content type.
        let body = req.body
        if (!body) {
            return webserver.renderError(req, res, "Missing body", 400)
        }
        if (typeof body === "string") {
            try {
                body = JSON.parse(body)
            } catch {
                return webserver.renderError(req, res, "Invalid body", 400)
            }
        }

        // Only accept messages signed by SNS, optionally from the expected topic.
        if (settings.mailer.bounceTopicArn && body.TopicArn != settings.mailer.bounceTopicArn) {
            logger.warn("Routes.mailer", req.method, req.originalUrl, `Unexpected topic: ${body.TopicArn}`)
            return webserver.renderError(req, res, "Invalid topic", 403)
        }
        if (!(await verifySnsMessage(body))) {
            logger.warn("Routes.mailer", req.method, req.originalUrl, "Invalid SNS signature")
            return webserver.renderError(req, res, "Invalid signature", 403)
        }

        // Handle SNS SubscriptionConfirmation.
        if (body.Type == "SubscriptionConfirmation" && body.SubscribeURL) {
            if (!isSnsUrl(body.SubscribeURL)) {
                return webserver.renderError(req, res, "Invalid SubscribeURL", 400)
            }

            logger.info("Routes.mailer", req.method, req.originalUrl, "Subscription confirmed")

            await axios.get(body.SubscribeURL, {maxRedirects: 0, timeout: 10000})
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

export = router
