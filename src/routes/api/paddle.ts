// Strautomator API: Paddle

import {paddle, users, UserData} from "strautomator-core"
import auth from "../auth"
import express = require("express")
import logger from "anyhow"
import webserver = require("../../webserver")
const router: express.Router = express.Router()

/**
 * Process Paddle webhooks.
 */
router.post("/webhook", async (req: express.Request, res: express.Response) => {
    try {
        await paddle.processWebhook(req as any)
    } catch (ex) {
        logger.error("Routes.paddle", req.method, req.originalUrl, ex)
    }

    webserver.renderJson(req, res, {ok: true})
})

/**
 * Update user with Paddle customer details and set the user ID on Paddle.
 */
router.post("/:userId/customer", async (req: express.Request, res: express.Response) => {
    try {
        const user: UserData = (await auth.requestValidator(req, res)) as UserData
        if (!user) return

        // Body with a paddle ID is mandatory.
        const data = req.body
        if (!data || !data.id) {
            throw new Error("Missing Paddle ID")
        }

        // Update user Paddle customer and transaction IDs.
        user.paddleId = data.id
        user.paddleTransactionId = data.transactionId
        const updatedUser: Partial<UserData> = {id: user.id, displayName: user.displayName, paddleId: user.paddleId, paddleTransactionId: user.paddleTransactionId}
        await users.update(updatedUser)
        await paddle.customers.setCustomerUser(user)

        webserver.renderJson(req, res, {ok: true})
    } catch (ex) {
        webserver.renderError(req, res, ex, 400)
    }
})

/**
 * Get a new transaction ID so the user can manage / update the payment details.
 */
router.get("/:userId/new-transaction", async (req: express.Request, res: express.Response) => {
    try {
        const user: UserData = (await auth.requestValidator(req, res)) as UserData
        if (!user) return

        const transaction = await paddle.subscriptions.getUpdateTransaction(user)
        user.paddleTransactionId = transaction.id
        webserver.renderJson(req, res, transaction)
    } catch (ex) {
        webserver.renderError(req, res, ex, 400)
    }
})

export = router
