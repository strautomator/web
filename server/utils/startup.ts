// Strautomator Web: Startup routines

import {paypal, startup, strava} from "strautomator-core"
import {spawn} from "node:child_process"
import _ from "lodash"
import express from "express"
import countryLinkify from "country-linkify"
import logger from "anyhow"
import setmeup from "setmeup"
const settings = setmeup.settings

/**
 * Global startup state, kept on globalThis to survive hot reloads during development.
 */
interface StartupState {
    /** Core startup promise. */
    ready?: Promise<void>
    /** Express app handling the affiliate links. */
    affiliatesApp?: express.Express
    /** Tunnel was started? */
    tunnel?: boolean
}

const state: StartupState = ((globalThis as any).__strautomatorWeb = (globalThis as any).__strautomatorWeb || {})

/**
 * Start the Strautomator core and related services. Returns the same promise if called multiple times.
 */
export const coreStartup = (): Promise<void> => {
    if (!state.ready) {
        state.ready = run()
    }
    return state.ready
}

/**
 * Get the affiliate links app (if enabled).
 */
export const getAffiliatesApp = (): express.Express => state.affiliatesApp

/**
 * Startup routine.
 */
const run = async (): Promise<void> => {
    try {
        await startup()

        // Enable logging unhandled exceptions and rejections.
        logger.setOptions({uncaughtExceptions: true, unhandledRejections: true})

        // Static files are now served from the public folder.
        if (settings.affiliates?.images?.path?.includes("./static/")) {
            settings.affiliates.images.path = settings.affiliates.images.path.replace("./static/", "./public/")
        }

        // Execute the tunnel file?
        if (settings.app.tunnel && !state.tunnel) {
            state.tunnel = true
            const tunnel = spawn("./tunnel")
            tunnel.stdout.on("data", (data) => logger.info("Tunnel", data.toString()))
            tunnel.on("error", (err) => logger.error("Tunnel", err))
            tunnel.on("close", (code) => logger.warn("Tunnel", `Closed with code ${code}`))
        }

        // Setup affiliate links.
        if (settings.affiliates?.server?.url) {
            const app = express()
            app.set("trust proxy", settings.app.trustProxy)
            await countryLinkify(settings.affiliates, app)
            state.affiliatesApp = app
            logger.info("Startup", `Affiliate links available at ${settings.affiliates.server.url}`)
        }

        // Setup webhooks in the background.
        setupWebhooks()
    } catch (ex) {
        logger.error("Startup", "Failed to start", ex)
        return process.exit(1)
    }
}

/**
 * Prepare webhooks with Strava and PayPal.
 */
const setupWebhooks = async (): Promise<void> => {
    let err = null

    try {
        if (!strava.webhooks.current || strava.webhooks.current.callbackUrl != strava.webhooks.callbackUrl) {
            try {
                await strava.webhooks.cancelWebhook()
            } catch (cancelEx) {
                logger.warn("Startup.setupWebhooks", "Could not cancel the current Strava webhook, will proceed anyways")
            }

            await strava.webhooks.createWebhook()
        }
    } catch (ex) {
        logger.error("Startup.setupWebhooks", "Could not setup the Strava webhook")
        err = ex
    }

    if (!settings.paypal.disabled) {
        try {
            const webhooks = await paypal.webhooks.getWebhooks()
            const existingWebhook = _.find(webhooks, {url: paypal.webhookUrl})

            // No webhooks on PayPal yet? Register one now.
            if (!existingWebhook) {
                logger.warn("Startup.setupWebhooks", "No matching webhook (URL) found on PayPal, will register one now")
                await paypal.webhooks.createWebhook()
            }
        } catch (ex) {
            logger.error("Startup.setupWebhooks", "Could not setup the PayPal webhook")
            err = ex
        }
    }

    if (err) {
        logger.error("Startup.setupWebhooks", "Will retry the webhook setup later")
        setTimeout(setupWebhooks, settings.webhooks.retryInterval)
    }
}
