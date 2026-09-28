// Strautomator: Auth

import {logHelper, strava, users, UserData} from "strautomator-core"
import {isAppOriginUrl} from "../utils/urls"
import crypto from "crypto"
import fs = require("fs")
import logger from "anyhow"
import webserver = require("../webserver")
const settings = require("setmeup").settings

// Short-lived in-memory token caches, keyed by the SHA-256 of the token. Only user IDs are cached
// (the user itself is always fetched fresh), and tokens that are unknown to both the database and Strava.
const tokenCacheMaxSize = 20000
const tokenUserIds = new Map<string, {userId: string; expiry: number}>()
const invalidTokens = new Map<string, number>()
const setCacheEntry = <T>(cache: Map<string, T>, key: string, value: T): void => {
    if (cache.size >= tokenCacheMaxSize) {
        cache.delete(cache.keys().next().value)
    }
    cache.set(key, value)
}

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
     * @param options Additional validation options.
     */
    requestValidator = async (req: any, res: any, options?: RequestOptions): Promise<UserData | boolean> => {
        try {
            const bearer = req.headers["authorization"]

            // Default options.
            if (!options) {
                options = {}
            }

            // Check for referer instead of token? Will use same URL set for CORS.
            if (options.referer) {
                const referer = req.headers["referer"] || "unknown"

                if (!isAppOriginUrl(referer, settings.app.url)) {
                    logger.error("Auth.requestValidator", req.originalUrl, `Invalid referer: ${referer}`, `From ${req.ip}`)

                    res.setHeader("cache-control", "no-cache")
                    res.status(403)

                    if (options.image) {
                        const result = fs.readFileSync(`${__dirname}/../static/access-denied.png`)
                        res.contentType("image/png")
                        res.send(result)
                    } else {
                        res.send("Access denied")
                    }

                    return false
                }

                if (options.anonymous) {
                    return true
                }
            }

            // Auth bearer header is mandatory.
            if (!bearer) {
                webserver.renderError(req, res, "Missing token", 401)
                return false
            }

            // Token recently seen as invalid? Stop here, without hitting the database or Strava.
            let token: string = bearer.substring(1, 6) == "earer" ? bearer.substring(6).trim() : bearer.trim()
            const tokenHash = crypto.createHash("sha256").update(token).digest("hex")
            const invalidExpiry = invalidTokens.get(tokenHash)
            if (invalidExpiry && invalidExpiry > Date.now()) {
                webserver.renderError(req, res, "User not found", 404)
                return false
            }

            // Token recently matched to a user? Get the user directly, and make sure the token is still valid.
            let user: UserData = null
            const cachedUserId = tokenUserIds.get(tokenHash)
            if (cachedUserId && cachedUserId.expiry > Date.now()) {
                user = await users.getById(cachedUserId.userId)
                if (user && user.stravaTokens?.accessToken != token && user.stravaTokens?.previousAccessToken != token) {
                    user = null
                }
            }
            const fromCache = user ? true : false
            if (!fromCache) {
                tokenUserIds.delete(tokenHash)
            }

            // Find user by token.
            if (!user) {
                user = await users.getByToken({accessToken: token})
            }
            if (!user && options.acceptPreviousToken) {
                user = await users.getByToken({previousAccessToken: token})
            }

            // User not found? Maybe has a new token? Tokens rejected by Strava are cached as invalid.
            if (!user) {
                let athlete = null
                try {
                    athlete = await strava.athletes.getAthlete({accessToken: token})
                } catch (athleteEx) {
                    const status = athleteEx.response?.status || athleteEx.statusCode
                    if (status == 401 || status == 403) {
                        setCacheEntry(invalidTokens, tokenHash, Date.now() + (settings.api.invalidTokenCacheSeconds || 600) * 1000)
                    }
                    throw athleteEx
                }

                // User token is valid on Strava? Update previous token saved on the database.
                if (athlete) {
                    user = await users.getById(athlete.id)

                    // Athlete found by ID Proceed updating the previous access token.
                    if (user) {
                        user.stravaTokens.accessToken = token
                        const newUserData = {
                            id: user.id,
                            displayName: user.preferences.privacyMode ? user.id : user.displayName,
                            stravaTokens: {previousAccessToken: token}
                        }

                        await users.update(newUserData)
                        logger.info("Auth.requestValidator", req.originalUrl, `Updated previous Strava token for ${logHelper.user(user)}`)
                    }
                }
            }

            // User really not found?
            if (!user) {
                webserver.renderError(req, res, "User not found", 404)
                return false
            }

            // User ID does not match the one passed with the options?
            if (req.params.userId && req.params.userId != user.id) {
                webserver.renderError(req, res, "User not authorized", 401)
                return false
            }

            // All good!
            if (!fromCache) {
                setCacheEntry(tokenUserIds, tokenHash, {userId: user.id, expiry: Date.now() + (settings.api.tokenCacheSeconds || 300) * 1000})
            }
            return user
        } catch (ex) {
            webserver.renderError(req, res, ex, 401)
            return false
        }
    }
}

/**
 * Request validation options.
 */
export interface RequestOptions {
    /** Accept unauthenticated requests. */
    anonymous?: boolean
    /** Accept previous access token (in case user was logged in for too long). */
    acceptPreviousToken?: boolean
    /** Requesting an image? Accept requests only from the Strautomator referer. */
    image?: boolean
    /** Accept requests only from the Strautomator referer. */
    referer?: boolean
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
