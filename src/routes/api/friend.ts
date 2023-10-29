// Strautomator API: Friend routes

import {mailer, users, UserData} from "strautomator-core"
import express = require("express")
import webserver = require("../../webserver")
import auth from "../auth"
const settings = require("setmeup").settings
const router: express.Router = express.Router()

/**
 * Cancel an existing Friend subscription.
 */
router.post("/:userId/unsubscribe", async (req: express.Request, res: express.Response) => {
    try {
        const user: UserData = (await auth.requestValidator(req, res)) as UserData
        if (!user) return

        await users.switchToFree(user)

        // User provided a reason? Notify it.
        if (req.body?.reason) {
            mailer.send({
                to: settings.mailer.from,
                subject: `Strautomator friend subscription cancelled: ${user.id}`,
                body: `User ${user.displayName} (${user.email || "no email"}) unsubscribed.<br>Reason: ${req.body.reason.toString()}`
            })
        }

        webserver.renderJson(req, res, {subscription: false})
    } catch (ex) {
        webserver.renderError(req, res, ex)
    }
})

export = router
