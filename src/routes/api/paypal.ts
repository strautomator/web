// Strautomator API: PayPal

import {logHelper, mailer, paypal, UserData} from "strautomator-core"
import express = require("express")
import logger = require("anyhow")
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
        const legacyPlan = paypal.legacyBillingPlans[req.params.billingPlanId]
        if (legacyPlan) {
            throw new Error("This billing plan is not accepting new subscriptions")
        }
        const billingPlan = paypal.currentBillingPlans[req.params.billingPlanId]
        if (!billingPlan) {
            throw new Error("Invalid billing plan")
        }

        // User already has a subscription running? Try getting its details.
        if (user.subscription && user.subscription.id && user.subscription.source == "paypal") {
            const existingSub = await paypal.subscriptions.getSubscription(user.subscription.id)

            // Subscription expired? Log and continue with the subscription creation further below.
            if (!existingSub) {
                logger.debug("Routes", req.method, req.originalUrl, "Subscription not found on PayPal, will create a new one")
            }

            // User hasn't approved it yet, and it's still valid?
            else if (existingSub.billingPlan && existingSub.billingPlan.id == billingPlan.id && existingSub.status == "APPROVAL_PENDING") {
                logger.info("Routes.paypal", `Redirecting user ${user.id} to previous subscription ${existingSub.id}`)
                return webserver.renderJson(req, res, existingSub)
            }

            // User has a valid subscription? Update the database and activate PRO again.
            else if (existingSub.status == "ACTIVE" && existingSub.dateNextPayment) {
                logger.warn("Routes.paypal", req.method, req.originalUrl, `Already subscribed (${existingSub.id}), will fix it`)
                existingSub.userId = user.id
                await paypal.subscriptions.fixSubscription(existingSub)
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
 * Cancel an existing PayPal subscription.
 */
router.post("/:userId/unsubscribe", async (req: express.Request, res: express.Response) => {
    try {
        const user: UserData = (await auth.requestValidator(req, res)) as UserData
        if (!user) return

        // Subscription not active?
        if (!user.subscription && !user.subscription.enabled) {
            return webserver.renderError(req, res, `${logHelper.user(user)} has no active subscription`, 409)
        }

        // Get and validate subscription info from PayPal.
        const subscription = await paypal.subscriptions.getSubscription(user.subscription.id)
        if (!subscription) {
            return webserver.renderError(req, res, `Subscription ${user.subscription.id} is invalid`, 409)
        }

        // Force set user ID on subscription and request cancellation on PayPal.
        subscription.userId = user.id
        await paypal.subscriptions.cancelSubscription(subscription)

        // User provided a reason? Notify it.
        if (req.body && req.body.reason) {
            mailer.send({
                to: settings.mailer.from,
                subject: `Strautomator PayPal subscription cancelled: ${user.id}`,
                body: `User ${user.displayName} (${user.email || "no email"}) unsubscribed.<br>Reason: ${req.body.reason.toString()}`
            })
        }

        webserver.renderJson(req, res, subscription)
    } catch (ex) {
        webserver.renderError(req, res, ex)
    }
})

export = router
