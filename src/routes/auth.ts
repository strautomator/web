// Strautomator: Auth

import {strava, users, UserData} from "strautomator-core"
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

    /**
     * Validate request according to the passed options. Returns false if not authorized,
     * otherwise the user object (if identified), or just true (if not user identified).
     * @param req The Express Request object.
     * @param res The Express Response object.
     * @param options Additional validaton options.
     */
    requestValidator = async (req: any, res: any, options?: RequestOptions): Promise<UserData | boolean> => {
        try {
            const bearer = req.headers["authorization"]

            // Default options.
            if (!options) {
                options = {}
            }

            // Check for referer instead of token? Will use same URL set for CORS.
            if (options.image) {
                const referer = req.headers["referer"] || "unknown"

                if (referer.indexOf(settings.app.url) < 0) {
                    logger.error("Auth.requestValidator", req.originalUrl, `Invalid referer: ${referer}`, `From ${req.ip}`)

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
                logger.error("Auth.requestValidator", req.originalUrl, "Missing token", `From ${req.ip}`)
                webserver.renderError(req, res, "Missing token", 401)
                return false
            }

            // Find user by token.
            let token: string = bearer.substring(1, 6) == "earer" ? bearer.substring(6).trim() : bearer.trim()
            let user = await users.getByToken({accessToken: token})

            // User not found? Maybe has a new token?
            if (!user) {
                const athlete = await strava.athletes.getAthlete({accessToken: token})

                // User token is valid on Strava? Update previous token saved on the database.
                if (athlete) {
                    user = await users.getById(athlete.id)

                    // Athlete found by ID Proceed updating the previous access token.
                    if (user) {
                        user.stravaTokens.accessToken = token
                        const newUserData = {
                            id: user.id,
                            displayName: user.displayName,
                            stravaTokens: {previousAccessToken: token}
                        }

                        await users.update(newUserData)
                        logger.info("Auth.requestValidator", req.originalUrl, `Updated previous Strava token for ${user.id} - ${user.displayName}`)
                    }
                }
            }

            // User really not found?
            if (!user) {
                logger.error("Auth.requestValidator", req.originalUrl, "User not found", `From ${req.ip}`)
                webserver.renderError(req, res, "Access denied", 401)
                return false
            }

            // User ID does not match the one passed with the options?
            if (options.userId && user.id != options.userId) {
                logger.error("Auth.requestValidator", req.originalUrl, "User not authorized", `From ${req.ip}`)
                webserver.renderError(req, res, "User not authorized", 401)
                return false
            }

            // All good!
            return user
        } catch (ex) {
            logger.error("Auth.requestValidator", req.originalUrl, ex, `From ${req.ip}`)
            webserver.renderError(req, res, ex, 401)
            return false
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
