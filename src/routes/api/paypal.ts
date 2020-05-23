// Strautomator API: PayPal routes

import {paypal, UserData} from "strautomator-core"
import express = require("express")
import logger = require("anyhow")
import webserver = require("../../webserver")
import auth from "../auth"
const settings = require("setmeup").settings
const router = express.Router()

/**
 * Process webhooks dispatched by PayPal.
 */
const routeWebhook = async (req, res) => {
    const data = req.body

    try {
        if (req.params.urlToken != settings.paypal.api.urlToken) {
            logger.error("Routes", req.method, req.originalUrl, "Invalid URL token")
            return webserver.renderError(req, res, "Invalid URL token", 401)
        }

        // Check if a body was passed.
        if (!data) {
            logger.error("Routes", req.method, req.originalUrl, "Missing request body")
            return webserver.renderError(req, res, "Missing request body", 400)
        }
    } catch (ex) {
        logger.error("Routes", req.method, req.originalUrl, ex)
        webserver.renderJson(req, res, {error: ex.toString()})
        return false
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
router.get("/billingplans", async (req, res) => {
    try {
        webserver.renderJson(req, res, paypal.currentBillingPlans)
    } catch (ex) {
        logger.error("Routes", req.method, req.originalUrl, ex)
        webserver.renderJson(req, res, {error: ex.toString()})
    }
})

/**
 * Create a new PayPal subscription.
 */
router.post("/subscribe/:billingPlanId", async (req, res) => {
    try {
        const user: UserData = (await auth.requestValidator(req, res)) as UserData
        if (!user) return

        // Check if billing plan is valid.
        const billingPlan = paypal.currentBillingPlans[req.params.billingPlanId]
        if (!billingPlan) {
            throw new Error("Invalid billing plan")
        }

        // User already has a subscription running?
        if (user.subscription && user.subscription.id) {
            const existingSub = await paypal.subscriptions.getSubscription(user.subscription.id)

            // User hasn't approved it yet, and it's still valid?
            if (existingSub.billingPlan && existingSub.billingPlan.id == billingPlan.id && existingSub.status == "APPROVAL_PENDING") {
                logger.info("Routes", req.method, req.originalUrl, `Redirecting user ${user.id} to previous subscription ${existingSub.id}`)
                return webserver.renderJson(req, res, existingSub)
            }

            // User has a valid subscription? Throw an error then.
            if (existingSub.status == "ACTIVE") {
                throw new Error(`Already subscribed, subscription ID ${existingSub.id}`)
            }
        }

        // Create subscription and update it on the user.
        const subscription = await paypal.subscriptions.createSubscription(billingPlan, user.id)
        webserver.renderJson(req, res, subscription)
    } catch (ex) {
        logger.error("Routes", req.method, req.originalUrl, ex)
        webserver.renderJson(req, res, {error: ex.toString()})
    }
})

/**
 * Cancel an existing PayPal subscription.
 */
router.post("/unsubscribe", async (req, res) => {
    try {
        const user: UserData = (await auth.requestValidator(req, res)) as UserData
        if (!user) return

        // Subscription not active?
        if (!user.subscription && !user.subscription.enabled) {
            logger.error("Routes", req.method, req.originalUrl, `User ${user.id} has no active subscription`)
            return webserver.renderError(req, res, "User has no active subscription", 400)
        }

        // Get and validate subscription info from PayPal.
        const subscription = await paypal.subscriptions.getSubscription(user.subscription.id)
        if (!subscription) {
            logger.error("Routes", req.method, req.originalUrl, `Subscription ${user.subscription.id} is invalid`)
            return webserver.renderError(req, res, `Subscription ${user.subscription.id} is invalid`, 400)
        }

        await paypal.subscriptions.cancelSubscription(subscription)

        webserver.renderJson(req, res, subscription)
    } catch (ex) {
        logger.error("Routes", req.method, req.originalUrl, ex)
        webserver.renderJson(req, res, {error: ex.toString()})
    }
})

export = router
