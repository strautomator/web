// Strautomator: WebServer

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
        this.app = express()

        let protocol: string

        // Check if certificate files are present.
        if (fs.existsSync(`./strautomator.cert`) && fs.existsSync(`./strautomator.key`)) {
            const cert = fs.readFileSync("./strautomator.cert")
            const key = fs.readFileSync(`./strautomator.key`)
            const options = {
                cert: cert,
                key: key
            }

            this.server = https.createServer(options, this.app)
            protocol = "HTTPS"
        } else {
            this.server = http.createServer(this.app)
            protocol = "HTTP"
        }

        // When running behind a proxy / LB.
        this.app.set("trust proxy", settings.api.trustProxy)

        // Set rate limiting.
        const rateLimit = require("express-rate-limit")(settings.api.rateLimit)
        rateLimit.onLimitReached = (req) => {
            logger.warn("Routes", req.method, req.originalUrl, `Rate limited: ${req.ip}`)
        }
        this.app.use("/api/*", rateLimit)

        // Load routes.
        const routers = fs.readdirSync(`${__dirname}/routes/api`)
        for (let r of routers) {
            if (r.indexOf(".d.ts") < 0) {
                const basename = path.basename(r).split(".")[0]
                this.app.use(`/api/${basename}`, require(`./routes/api/${r}`))
            }
        }

        this.app.use(nuxtRender)

        // Listen the server.
        this.app.listen(settings.app.port, settings.app.ip)
        logger.info("Strautomator.WebServer", protocol, `Server ready on ${settings.app.ip}: ${settings.app.port}`)
        logger.info("Strautomator.WebServer", `Global rate limit: ${settings.api.rateLimit.max} / ${settings.api.rateLimit.windowMs}ms`)
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
