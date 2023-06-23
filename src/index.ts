// Strautomator Index / startup

import logger from "anyhow"

async function start() {
    try {
        const core = require("strautomator-core")
        await core.startup()

        // Load settings.
        const setmeup = require("setmeup")
        const settings = setmeup.settings
        const baseUrl = settings.app.url

        // Enable logging unhandled exceptions and rejections.
        logger.setOptions({uncaughtExceptions: true, unhandledRejections: true})

        // Import and Set Nuxt.js options.
        const config = require("../nuxt.config.js")
        config.dev = process.env.NODE_ENV !== "production"

        // Override nuxt configuration.
        config.oauth.secretKey = settings.cookie.secret
        config.oauth.sessionName = settings.cookie.sessionName
        config.oauth.oauthClientID = settings.strava.api.clientId
        config.oauth.oauthClientSecret = settings.strava.api.clientSecret
        config.oauth.scopes = [settings.strava.api.scopes]
        config.head.title = settings.app.title
        config.head.titleTemplate = `${settings.app.title} - %s`
        config.server.host = settings.app.ip
        config.server.port = settings.app.port
        config.env.baseUrl = baseUrl
        config.axios.baseURL = baseUrl
        config.privateRuntimeConfig.axios.baseURL = baseUrl
        config.publicRuntimeConfig.axios.browserBaseURL = baseUrl

        // Init Nuxt.js.
        const {Nuxt, Builder} = require("nuxt")
        const nuxt = new Nuxt(config)

        // Port set via the PORT environment variable?
        if (process.env.PORT) {
            logger.info("Strautomator.startup", `Port ${process.env.PORT} set via envionment variable`)
            settings.app.port = process.env.PORT
        }

        // Nuxt setup.
        await nuxt.ready()

        // Force build only in dev mode.
        if (config.dev) {
            const builder = new Builder(nuxt)
            await builder.build()
        }

        // Execute the tunnel file?
        if (settings.app.tunnel) {
            const {spawn} = require("child_process")
            const tunnel = spawn("./tunnel")
            tunnel.stdout.on("data", (data) => logger.info("Tunnel", data.toString()))
            tunnel.on("error", (err) => logger.error("Tunnel", err))
            tunnel.on("close", (code) => logger.warn("Tunnel", `Closed with code ${code}`))
        }

        // Start the web server.
        const webserver = require("./webserver")
        await webserver.init(nuxt.render)
    } catch (ex) {
        logger.error("Strautomator.startup", "Failed to start", ex)
        process.exit(1)
    }
}

start()
