// Strautomator Web

const express = require("express")
const consola = require("consola")
const {Nuxt, Builder} = require("nuxt")
const app = express()

// Startup function.
async function start() {
    try {
        const core = require("strautomator-core")

        // Startup core component.
        await core.startup()

        // Load settings.
        const setmeup = require("setmeup")
        const settings = setmeup.settings

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

        // Override nuxt
        nuxt.options.server.host = "0.0.0.0"
        nuxt.options.server.port = settings.app.port
        nuxt.options.env.appUrl = settings.app.url
        nuxt.options.env.apiUrl = settings.api.url

        const {host, port} = nuxt.options.server

        await nuxt.ready()

        // Build only in dev mode
        if (config.dev) {
            const builder = new Builder(nuxt)
            await builder.build()
        }

        // Give nuxt middleware to express
        app.use(nuxt.render)

        // Listen the server
        app.listen(port, host)
        consola.ready({
            message: `Server ready on ${host}, port ${port}`,
            badge: true
        })
    } catch (ex) {
        console.error("Strautomator Web", ex)
        process.exit()
    }
}

start()
