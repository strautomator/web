// Strautomator: WebServer

import {strava, paypal} from "strautomator-core"
import express = require("express")
import _ = require("lodash")
import fs = require("fs")
import http = require("http")
import https = require("https")
import logger = require("anyhow")
import path = require("path")
const settings = require("setmeup").settings

/**
 * Exposes the Express server.
 */
class WebServer {
    private constructor() {}
    private static _instance: WebServer
    static get Instance(): WebServer {
        return this._instance || (this._instance = new this())
    }

    /**
     * The Express app.
     */
    app: express.Express

    /**
     * The underlying HTTP(S) server.
     */
    server: http.Server

    // INIT
    // --------------------------------------------------------------------------

    /**
     * Init the web server. If the strautomator.key and strautomator.cert files are
     * present, listen on HTTPS, otherwise regular HTTP.
     */
    init = async (nuxtRender): Promise<void> => {
        try {
            this.app = express()

            let protocol: string

            // Check if certificate files are present.
            if (fs.existsSync(`./strautomator.cert`) && fs.existsSync(`./strautomator.key`)) {
                const cert = fs.readFileSync("./strautomator.cert", "utf8")
                const key = fs.readFileSync("./strautomator.key", "utf8")
                const options = {
                    cert: cert,
                    key: key
                }

                this.server = https.createServer(options, this.app)
                protocol = "HTTPS"

                // HTTPS defaults to port 8443.
                if (!settings.app.port) {
                    settings.app.port = 8443
                }
            } else {
                this.server = http.createServer(this.app)
                protocol = "HTTP"

                // HTTP defaults to port 8080.
                if (!settings.app.port) {
                    settings.app.port = 8080
                }
            }

            // When running behind a proxy / LB.
            this.app.set("trust proxy", settings.app.trustProxy)

            // Add body parser.
            const bodyParser = require("body-parser")
            this.app.use(bodyParser.json())
            this.app.use((err, req, res, next) => {
                if (err) {
                    return this.renderError(req, res, err.toString(), 400)
                }
                next()
            })

            // Set API rate limiting (if defined on the settings).
            if (settings.api.rateLimit && settings.api.rateLimit.max) {
                const rateLimit = require("express-rate-limit")(settings.api.rateLimit)
                rateLimit.onLimitReached = (req) => {
                    logger.warn("Routes", req.method, req.originalUrl, `Rate limited: ${req.ip}`)
                }
                this.app.use("/api/*", rateLimit)

                logger.info("WebServer.init", `API rate limit: ${settings.api.rateLimit.max} / ${settings.api.rateLimit.windowMs}ms`)
            } else {
                logger.info("WebServer.init", `API rate limit: disabled`)
            }

            // Load routes.
            const routers = fs.readdirSync(`${__dirname}/routes/api`)
            for (let r of routers) {
                if (r.indexOf(".d.ts") < 0) {
                    const basename = path.basename(r).split(".")[0]
                    this.app.use(`/api/${basename}`, require(`./routes/api/${r}`))
                }
            }

            // Use Nuxt render.
            this.app.use(nuxtRender)

            // Listen the server.
            this.server.listen(settings.app.port)
            logger.info("WebServer.init", protocol, `Server ready on port ${settings.app.port}`)

            // Setup webhooks.
            await this.setupWebhooks()
        } catch (ex) {
            logger.error("WebServer.init", ex)
            process.exit(1)
        }
    }

    /**
     * Prepare webhooks with Strava and PayPal.
     */
    setupWebhooks = async () => {
        let err = null

        try {
            if (!strava.webhooks.current || strava.webhooks.current.callbackUrl != strava.webhooks.callbackUrl) {
                await strava.webhooks.cancelWebhook()
                await strava.webhooks.createWebhook()
            }
        } catch (ex) {
            logger.error("WebServer.setupWebhooks", "Could not setup the Strava webhook")
            err = ex
        }

        try {
            const webhooks = await paypal.webhooks.getWebhooks()
            const existingWebhook = _.find(webhooks, {url: paypal.webhookUrl})

            // No webhooks on PayPal yet? Register one now.
            if (!existingWebhook) {
                logger.warn("PayPal.setupWebhook", "No matching webhook (URL) found on PayPal, will register one now")
                await paypal.webhooks.createWebhook()
            }
        } catch (ex) {
            logger.error("WebServer.setupWebhooks", "Could not setup the PayPal webhook")
            err = ex
        }

        if (err) {
            logger.error("WebServer.init", `Will retry the webhook setup later`)

            const callback = async () => {
                await this.setupWebhooks()
            }
            setTimeout(callback, settings.webhooks.retryInterval)
        }
    }

    // HELPER METHODS
    // --------------------------------------------------------------------------

    /**
     * Render response as JSON data and send to the client.
     * @param req The Express request object.
     * @param res The Express response object.
     * @param data The JSON data to be sent.
     * @param status Optional status code, defaults to 200.
     * @event renderJson
     */
    renderJson = (req: express.Request, res: express.Response, data: any, status?: number) => {
        logger.debug("WebServer.renderJson", req.originalUrl, data)

        if (_.isString(data)) {
            try {
                data = JSON.parse(data)
            } catch (ex) {
                logger.error("WebServer.renderJson", ex)
                return this.renderError(req, res, ex, 500)
            }
        }

        // A specific status code was passed?
        if (status) {
            res.status(status)
        }

        // Add Access-Control-Allow-Origin if set.
        if (settings.app.allowOriginHeader) {
            res.setHeader("Access-Control-Allow-Origin", settings.app.allowOriginHeader)
        }

        // Send JSON response.
        res.json(data)
    }

    /**
     * Sends error response as JSON.
     * @param req The Express request object.
     * @param res The Express response object.
     * @param error The error object or message to be sent to the client.
     * @param status The response status code, optional, default is 500.
     * @event renderError
     */
    renderError = (req: express.Request, res: express.Response, error: any, status?: number | string) => {
        let message
        logger.debug("WebServer.renderError", req.originalUrl, status, error)

        /* istanbul ignore next */
        if (typeof error == "undefined" || error == null) {
            error = "Unknown error"
            logger.warn("WebServer.renderError", "Called with null error")
        }

        // Status default statuses.
        if (status == null) {
            status = error.statusCode || error.status || error.code
        }
        if (status == "ETIMEDOUT") {
            status = 408
        }

        // Error defaults to 500 if not a valid number.
        if (!_.isNumber(status)) {
            status = 500
        }

        try {
            // Error inside another .error property?
            if (error.error && !error.message && !error.error_description && !error.reason) {
                error = error.error
            }

            if (_.isString(error)) {
                message = {message: error}
            } else {
                message = {}
                message.message = error.message || error.error_description || error.description

                // No message found? Just use the default .toString() then.
                /* istanbul ignore next */
                if (!message.message) {
                    message.message = error.toString()
                }

                if (error.friendlyMessage) {
                    message.friendlyMessage = error.friendlyMessage
                }
                if (error.reason) {
                    message.reason = error.reason
                }
                if (error.code) {
                    message.code = error.code
                } else if (error.status) {
                    message.code = error.status
                }
            }
        } catch (ex) {
            /* istanbul ignore next */
            logger.error("WebServer.renderError", ex)
        }

        // Send error JSON to client.
        res.status(status as number).json(message)
    }
}

// Exports...
export = WebServer.Instance
