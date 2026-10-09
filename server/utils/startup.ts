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
        // Settings are loaded synchronously at the beginning of the core startup,
        // so the tunnel can be started right away while the rest is initializing.
        const coreReady = startup()
        startTunnel()
        await coreReady

        // Enable logging unhandled exceptions and rejections.
        logger.setOptions({uncaughtExceptions: true, unhandledRejections: true})

        // Setup webhooks in the background.
        setupWebhooks()
    } catch (ex) {
        logger.error("Startup", "Failed to start", ex)
        return process.exit(1)
    }
}

/**
 * Execute the tunnel file, if enabled on the settings.
 */
const startTunnel = (): void => {
    if (!settings.app.tunnel || state.tunnel) return
    state.tunnel = true

    // The tunnel script stops when its stdin closes, which happens when the server process (or
    // the dev server worker thread) exits, so no orphaned cloudflared processes are left behind.
    const tunnel = spawn("./tunnel", {stdio: ["pipe", "pipe", "pipe"]})
    tunnel.stdout.on("data", (data) => logger.info("Tunnel", data.toString().trim()))

    // Cloudflared logs to stderr, which must always be consumed, otherwise the tunnel
    // process blocks once the pipe buffer is full. Only errors and connections are logged.
    tunnel.stderr.on("data", (data) => {
        const lines: string[] = data.toString().split("\n")
        for (const line of lines) {
            if (line.includes(" ERR ")) {
                logger.warn("Tunnel", line.trim())
            } else if (line.includes("Registered tunnel connection")) {
                logger.info("Tunnel", line.trim())
            }
        }
    })
    tunnel.on("error", (err) => logger.error("Tunnel", err))
    tunnel.on("close", (code) => {
        state.tunnel = false
        logger.warn("Tunnel", `Closed with code ${code}`)
    })
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
