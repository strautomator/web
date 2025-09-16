// Strautomator API: PayPal

import {paypal, subscriptions, users, UserData, PayPalSubscription} from "strautomator-core"
import express = require("express")
import logger from "anyhow"
import webserver = require("../../webserver")
import auth from "../auth"
const settings = require("setmeup").settings
const router: express.Router = express.Router()

/**
 * Process webhooks dispatched by PayPal.
 */
const routeWebhook = async (req: express.Request, res: express.Response) => {
    const data = req.body

    try {
        if (req.params.urlToken != settings.paypal.api.urlToken) {
            return webserver.renderError(req, res, "Invalid URL token", 401)
        }

        // Check if a body was passed.
        if (!data) {
            return webserver.renderError(req, res, "Missing request body", 400)
        }
    } catch (ex) {
        return webserver.renderError(req, res, ex)
    }

    // Process event and return.
    await paypal.webhooks.processWebhook(data)
    webserver.renderJson(req, res, {ok: true})
}

/**
 * Bind webhook routes.
 */
router.get("/webhook/:urlToken", routeWebhook)
router.post("/webhook/:urlToken", routeWebhook)

/**
 * Get available billing plans.
 */
router.get("/billingplans", async (req: express.Request, res: express.Response) => {
    try {
        webserver.renderJson(req, res, paypal.currentBillingPlans)
    } catch (ex) {
        webserver.renderError(req, res, ex)
    }
})

/**
 * Get available billing plans (for the user).
 */
router.get("/:userId/billingplans", async (req: express.Request, res: express.Response) => {
    try {
        webserver.renderJson(req, res, paypal.currentBillingPlans)
    } catch (ex) {
        webserver.renderError(req, res, ex)
    }
})

/**
 * Create a new PayPal subscription.
 */
router.post("/:userId/subscribe/:billingPlanId", async (req: express.Request, res: express.Response) => {
    try {
        if (!req.params) throw new Error("Missing request params")

        const user: UserData = (await auth.requestValidator(req, res)) as UserData
        if (!user) return

        // Check if billing plan is valid.
        const billingPlan = paypal.currentBillingPlans[req.params.billingPlanId]
        if (!billingPlan) {
            throw new Error("Invalid billing plan")
        }

        const userSubs = await subscriptions.getByUser(user)
        const paypalSubs = userSubs.filter((s) => s.source == "paypal")

        // User already has a PayPal subscription running? Try getting its details.
        for (let sub of paypalSubs) {
            const existingSub = await paypal.subscriptions.getSubscription(sub.id)

            // Subscription expired? Log and continue with the subscription creation further below.
            if (!existingSub) {
                logger.info("Routes.paypal", `Subscription not found on PayPal: ${sub.id}`)
                continue
            }

            // User hasn't approved it yet, and it's still valid?
            else if (existingSub.billingPlan?.id == billingPlan.id && existingSub.status == "APPROVAL_PENDING") {
                logger.info("Routes.paypal", `Redirecting user ${user.id} to previous subscription ${existingSub.id}`)
                return webserver.renderJson(req, res, existingSub)
            }

            // User still has a valid subscription? Update the database and activate PRO again.
            else if (existingSub.status == "ACTIVE" && existingSub.dateNextPayment) {
                logger.warn("Routes.paypal", `Already subscribed (${existingSub.id})`)
                return webserver.renderJson(req, res, existingSub)
            }
        }

        // Create subscription and update it on the user.
        const subscription = await paypal.subscriptions.createSubscription(billingPlan, user.id)
        webserver.renderJson(req, res, subscription)
    } catch (ex) {
        webserver.renderError(req, res, ex)
    }
})

/**
 * Triggered when a user has migrated from PayPal to Paddle.
 */
router.post("/:userId/paddlemigration", async (req: express.Request, res: express.Response) => {
    try {
        if (!req.params) throw new Error("Missing request params")

        const user: UserData = (await auth.requestValidator(req, res)) as UserData
        if (!user) return

        // User must be subscribed via Paddle to proceed with the refund.
        if (!user.paddleId) {
            throw new Error("User has not subscribed to Paddle yet")
        }
        if (!req.body.paddleTransactionId) {
            throw new Error("Missing Paddle transaction ID")
        }

        const userSubs = await subscriptions.getByUser(user)
        const paypalSub = userSubs.find((s) => s.source == "paypal" && s.status == "ACTIVE")
        if (!paypalSub) {
            throw new Error("User has no active PayPal subscription")
        }

        // In case the Paddle subscription notification is delayed, we set the user subscription ID straight away.
        if (user.subscriptionId == paypalSub.id) {
            user.subscriptionId = req.body.paddleTransactionId
            await users.update({id: user.id, displayName: user.displayName, subscriptionId: user.subscriptionId})
        }

        // If migrating to a lifetime subscription, a refund is not issued.
        let refundAmount = null
        if (req.body.lifetime) {
            await paypal.subscriptions.cancelSubscription(paypalSub as PayPalSubscription, `Migrated to Paddle lifetime: (${req.body.paddleTransactionId})`)
        } else {
            refundAmount = await paypal.subscriptions.refundAndCancel(user, paypalSub.id, `Migrated to Paddle yearly: (${req.body.paddleTransactionId})`)
        }

        webserver.renderJson(req, res, {subscriptionId: paypalSub.id, refundAmount: refundAmount})
    } catch (ex) {
        webserver.renderError(req, res, ex, 400)
    }
})

export = router
