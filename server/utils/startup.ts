// Strautomator Web: Startup routines

import {paypal, startup, strava} from "strautomator-core"
import {spawn} from "node:child_process"
import _ from "lodash"
import logger from "anyhow"
import setmeup from "setmeup"
const settings = setmeup.settings

/**
 * Global startup state, kept on globalThis to survive hot reloads during development.
 */
interface StartupState {
    /** Core startup promise. */
    ready?: Promise<void>
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
 * Startup routine.
 */
const run = async (): Promise<void> => {
    try {
        await startup()

        // Enable logging unhandled exceptions and rejections.
        logger.setOptions({uncaughtExceptions: true, unhandledRejections: true})

        // Execute the tunnel file?
        if (settings.app.tunnel && !state.tunnel) {
            state.tunnel = true
            const tunnel = spawn("./tunnel", {stdio: ["ignore", "pipe", "pipe"]})
            tunnel.stdout.on("data", (data) => logger.info("Tunnel", data.toString().trim()))

            // Cloudflared logs to stderr, which must always be consumed, otherwise the tunnel
            // process blocks once the pipe buffer is full. Only errors are logged.
            tunnel.stderr.on("data", (data) => {
                const lines = data.toString().split("\n")
                for (const line of lines.filter((l) => l.includes(" ERR "))) {
                    logger.warn("Tunnel", line.trim())
                }
            })
            tunnel.on("error", (err) => logger.error("Tunnel", err))
            tunnel.on("close", (code) => {
                state.tunnel = false
                logger.warn("Tunnel", `Closed with code ${code}`)
            })

            // Make sure the tunnel does not outlive the server.
            process.once("exit", () => tunnel.kill())
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
