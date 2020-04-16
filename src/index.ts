// Strautomator Index / startup

import fs = require("fs")
import path = require("path")
import webserver = require("./webserver")
const {Nuxt, Builder} = require("nuxt")

// Startup function.
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
        const nuxt = new Nuxt(config)

        // Override nuxt configuration.
        const baseUrl = settings.app.url
        nuxt.options.server.host = settings.app.ip || "0.0.0.0"
        nuxt.options.server.port = settings.app.port
        nuxt.options.env.baseUrl = baseUrl
        nuxt.options.axios.baseURL = baseUrl
        nuxt.options.axios.browserBaseURL = baseUrl

        // Nuxt host and port.
        const {host, port} = nuxt.options.server

        await nuxt.ready()

        // Force build only in dev mode.
        if (config.dev) {
            const builder = new Builder(nuxt)
            await builder.build()
        }

        // When running behind a proxy / LB.
        webserver.app.set("trust proxy", settings.api.trustProxy)

        // Set rate limiting.
        const rateLimit = require("express-rate-limit")(settings.api.rateLimit)
        rateLimit.onLimitReached = (req) => {
            logger.warn("Routes", req.method, req.originalUrl, `Rate limited: ${req.ip}`)
        }
        webserver.app.use("/api/*", rateLimit)

        // Load routes.
        const routers = fs.readdirSync(`${__dirname}/routes/api`)
        for (let r of routers) {
            if (r.indexOf(".d.ts") < 0) {
                const basename = path.basename(r).split(".")[0]
                webserver.app.use(`/api/${basename}`, require(`./routes/api/${r}`))
            }
        }

        logger.info("Strautomator.startup", `Global API rate limit: ${settings.api.rateLimit.max} / ${settings.api.rateLimit.windowMs}`)

        // Give nuxt middleware to express.
        webserver.app.use(nuxt.render)

        // Load scheduler.
        const scheduler = require("./scheduler")
        await scheduler.init()

        // Listen the server.
        webserver.app.listen(port, host)
        logger.info("Strautomator.startup", `Server ready on ${host}, port ${port}`)

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
