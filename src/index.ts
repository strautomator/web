// Strautomator Index / startup

async function start() {
    try {
        const core = require("strautomator-core")
        await core.startup()

        // Load settings.
        const logger = require("anyhow")
        const setmeup = require("setmeup")
        const settings = setmeup.settings

        // Make sure all required settings are there.
        if (settings.api.adminKey) {
            logger.error("Strautomator.startup", "Missing settings.api.adminKey, please set it to a valid secret string")
        }

        // Import and Set Nuxt.js options.
        const config = require("../nuxt.config.js")
        config.dev = process.env.NODE_ENV !== "production"

        // Copy SetMeUp settings to nuxt.
        const oauthConfig = config.oauth
        oauthConfig.secretKey = settings.cookie.secret
        oauthConfig.oauthClientID = settings.strava.api.clientId
        oauthConfig.oauthClientSecret = settings.strava.api.clientSecret
        oauthConfig.scopes = [settings.strava.api.scopes]

        // Init Nuxt.js.
        const {Nuxt, Builder} = require("nuxt")
        const nuxt = new Nuxt(config)

        // Override nuxt configuration.
        const baseUrl = settings.app.url
        nuxt.options.server.host = settings.app.ip
        nuxt.options.server.port = settings.app.port
        nuxt.options.env.baseUrl = baseUrl
        nuxt.options.axios.baseURL = baseUrl
        nuxt.options.axios.browserBaseURL = baseUrl

        // Nuxt setup.
        await nuxt.ready()

        // Force build only in dev mode.
        if (config.dev) {
            const builder = new Builder(nuxt)
            await builder.build()
        }

        // Start the web server.
        const webserver = require("./webserver")
        await webserver.init(nuxt.render)

        // Load scheduler.
        const scheduler = require("./scheduler")
        await scheduler.init()

        // Gracefully shutdown.
        process.on("SIGTERM", async () => {
            await scheduler.shutdown()
            await core.shutdown()
        })
    } catch (ex) {
        console.error("Strautomator Web", ex)
        process.exit()
    }
}

start()
