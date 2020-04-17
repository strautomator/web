// Strautomator: Auth

import {strava, users} from "strautomator-core"
import fs = require("fs")
import logger = require("anyhow")
import webserver = require("../webserver")
const settings = require("setmeup").settings

/**
 * Database wrapper.
 */
export class Auth {
    private constructor() {}
    private static _instance: Auth
    static get Instance() {
        return this._instance || (this._instance = new this())
    }

    /** Cached token info. */
    tokens: []

    /**
     * Validate request according to the passed options.
     * @param req The Express Request object.
     * @param res The Express Response object.
     * @param options Additional validaton options.
     */
    requestValidator = async (req: any, res: any, options?: RequestOptions): Promise<boolean> => {
        try {
            const bearer = req.headers["authorization"]

            // Default options.
            if (!options) {
                options = {}
            }

            // Set to skip validation altogether? This works on development only.
            if (settings.api.skipAuthValidation && process.env.NODE_ENV == "development") {
                logger.debug("Auth.requestValidator", req.originalUrl, `skipValidation = true`)
                return true
            }

            // Check for referer instead of token? Will use same URL set for CORS.
            if (options.image) {
                const referer = req.headers["referer"] || "unknown"

                if (referer.indexOf(settings.app.url) < 0) {
                    logger.error("Auth.requestValidator", req.originalUrl, `Invalid referer: ${referer}`)

                    const result = fs.readFileSync(`${__dirname}/../static/access-denied.png`)
                    res.setHeader("cache-control", "no-cache")
                    res.contentType("image/png")
                    res.send(result)
                    return false
                }

                return true
            }

            // Auth bearer header is mandatory.
            if (!bearer) {
                logger.error("Auth.requestValidator", req.originalUrl, "Missing token")
                webserver.renderError(req, res, "Missing token", 401)
                return false
            }

            // Find user by token.
            let token = bearer.substring(1, 6) == "earer" ? bearer.substring(6).trim() : bearer.trim()
            let user = await users.getByToken(token)

            // User not found? Maybe has a new token?
            if (!user) {
                const athlete = await strava.getAthlete({accessToken: token})

                // User found on Strava? Update token saved on the database.
                if (athlete) {
                    user = await users.getById(athlete.id)
                    user.stravaTokens.accessToken = token
                    await users.update(user)
                    logger.info("Auth.requestValidator", req.originalUrl, `Updated Strava token for user ${user.id} - ${user.displayName}`)
                }
            }

            // User really not found?
            if (!user) {
                logger.error("Auth.requestValidator", req.originalUrl, "User not found")
                webserver.renderError(req, res, "Access denied", 401)
                return false
            }

            // Requires admin permissions?
            if (options.admin && req.headers["x-strautomator-admin"] != settings.api.adminToken) {
                logger.error("Auth.requestValidator", req.originalUrl, "Invalid admin token")
                webserver.renderError(req, res, "Access denied", 401)
                return false
            }

            // All good!
            return true
        } catch (ex) {
            logger.error("Auth.requestValidator", ex)
            webserver.renderError(req, res, ex, 401)
        }
    }
}

/**
 * Request validation options.
 */
export interface RequestOptions {
    /** Requires admin permissions (check bearer and the strautomator admin header). */
    admin?: boolean
    /** Passed token is owned by the user that particular ID. */
    userId?: string
    /** Requesting an image? Accept requests only from the Strautomator referer. */
    image?: boolean
}

/**
 * Token information.
 */
export interface TokenInfo {
    /** Access token. */
    token: string
    /** ID of the user. */
    userId: string
    /** Username of the user. */
    username: string
}

// Exports...
export default Auth.Instance