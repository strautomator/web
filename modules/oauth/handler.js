const core = require("strautomator-core")
const jaul = require("jaul")
const logger = require("anyhow")
const sessions = require("client-sessions")
const {atob, btoa} = require("Base64")
const {parse} = require("qs")
const settings = require("setmeup").settings

function Handler(opts) {
    this.init(opts)
}

Handler.prototype.init = function init({req, res, next, options = {sessionName: "nuxtSession"}} = {}) {
    this.req = req
    this.res = res
    this.next = next
    this.opts = options
}

Handler.prototype.checkRequestAuthorization = async function checkRequestAuthorization() {
    const existingToken = this.extractToken()

    // When an existing token exists try to authenticate the session, and logout if failed.
    try {
        if (existingToken) {
            await this.saveData({accessToken: existingToken})
        }
    } catch (ex) {
        logger.warn("OAuth.checkRequestAuthorization", ex)
        return this.logout()
    }

    return false
}

Handler.prototype.authenticateCallbackToken = async function authenticateCallbackToken() {
    const defaultRedirect = "/dashboard"
    let redirectUrl

    try {
        const {state} = parse(this.req.url.split("?")[1])
        redirectUrl = atob(state)

        // Make sure we never redirect back to home or error pages.
        const redirectPath = redirectUrl.replace("/", "").substring(0, 4)
        if (redirectPath == "home" || redirectPath == "erro" || redirectPath == "auth") {
            redirectUrl = defaultRedirect
        }
    } catch (ex) {
        logger.error("OAuth.authenticateCallbackToken", "Can't parse redirect URL", ex)
        redirectUrl = defaultRedirect
    }

    try {
        const stravaTokens = await core.strava.getToken(this.req.query.code)

        if (!stravaTokens || !stravaTokens.accessToken) {
            logger.warn("OAuth.authenticateCallbackToken", this.req.query.code, "Can't extract access token, will restart the OAuth2 flow")
            return this.redirectToOAuth()
        }

        const {accessToken, refreshToken, expiresAt} = stravaTokens

        // Get athlete data from Strava.
        const athlete = await core.strava.athletes.getAthlete(stravaTokens)
        if (!athlete) {
            throw new Error("Strava athlete not found")
        }

        // Check for existing user and create a new one if necessary.
        await core.users.upsert(athlete, stravaTokens, true)

        // Only proceed if session data has been validated and saved successfully.
        const saved = await this.saveData({accessToken, refreshToken, expiresAt}, athlete)
        if (saved) {
            logger.info("OAuth.authenticateCallbackToken", athlete.id, athlete.username, `Logged in, redirecting to ${redirectUrl.replace(settings.app.url, "")}`)
            return this.redirect(redirectUrl)
        }

        return this.redirectAccessDenied()
    } catch (ex) {
        logger.warn("OAuth.authenticateCallbackToken", ex)
        return this.redirectToOAuth()
    }
}

Handler.prototype.createSession = function createSession() {
    if (this.req[this.opts.sessionName]) {
        return Promise.resolve()
    }

    try {
        const session = sessions({
            cookieName: this.opts.sessionName,
            secret: this.opts.secretKey,
            duration: 7 * 24 * 60 * 60 * 1000
        })

        logger.info("OAuth.createSession", `IP: ${jaul.network.getClientIP(this.req)}`)
        return new Promise((resolve) => session(this.req, this.res, resolve))
    } catch (ex) {
        logger.error("OAuth.createSession", ex)
        throw ex
    }
}

Handler.prototype.extractToken = function extractToken() {
    const authorization = this.req?.headers?.authorization || null
    if (!authorization) return null

    // Take the second split so it handles all token types.
    return authorization.split(" ")[1]
}

Handler.prototype.getSessionToken = function getSessionToken() {
    return this.req[this.opts.sessionName]?.token || null
}

Handler.prototype.updateToken = async function updateToken() {
    await this.createSession()

    const userId = this.req[this.opts.sessionName]?.userId || null

    let stravaTokens = this.getSessionToken()
    if (!stravaTokens || !stravaTokens.accessToken) {
        logger.debug("OAuth.updateToken", `User ${userId || "unknown"}`, "Session token not found")
        return null
    }

    try {
        const now = new Date()
        const epoch = now.getTime() / 1000 - 1

        // Current token expired? Refresh it.
        if (stravaTokens.expiresAt && stravaTokens.expiresAt <= epoch) {
            logger.debug("OAuth.updateToken", `User ${userId}`, `Current token expires at ${stravaTokens.expiresAt}`)
            stravaTokens = await core.strava.refreshToken(stravaTokens.refreshToken, stravaTokens.accessToken, settings.beta.enabled)

            if (stravaTokens) {
                const {accessToken, refreshToken, expiresAt} = stravaTokens
                stravaTokens.accessToken = accessToken
                stravaTokens.refreshToken = refreshToken
                stravaTokens.expiresAt = expiresAt

                logger.info("OAuth.updateToken", `Refreshed token for user ${userId}`, `${accessToken.substring(0, 2)}*${accessToken.substring(accessToken.length - 2)}`)
            } else {
                stravaTokens = null
            }
        } else {
            const accessToken = stravaTokens.accessToken
            logger.debug("OAuth.updateToken", `User ${userId}`, `Token still valid: ${accessToken.substring(0, 2)}*${accessToken.substring(accessToken.length - 2)}`)
        }

        await this.saveData(stravaTokens)
        return stravaTokens
    } catch (ex) {
        logger.error("OAuth.updateToken", `User ${userId}`, ex)
        return null
    }
}

Handler.prototype.saveData = async function saveData(stravaTokens, athlete) {
    const now = new Date()
    const epoch = now.getTime() / 1000 - 1
    let userId

    try {
        await this.createSession()

        if (!stravaTokens || !stravaTokens.accessToken) {
            userId = this.req[this.opts.sessionName]?.userId || null
            logger.warn("OAuth.saveData", `User ${userId}`, "No access token passed to save, will reset")
            this.req[this.opts.sessionName].reset()
            return false
        }

        const {accessToken, refreshToken, expiresAt} = stravaTokens
        this.req.accessToken = accessToken

        // Make sure session exists.
        if (!this.req[this.opts.sessionName].token) {
            this.req[this.opts.sessionName].token = {}
        }

        // Save access token on cookie.
        this.req[this.opts.sessionName].token.accessToken = accessToken

        // If passed, also save refreshToken and expiry date.
        if (refreshToken) this.req[this.opts.sessionName].token.refreshToken = refreshToken
        if (expiresAt) this.req[this.opts.sessionName].token.expiresAt = expiresAt

        // Get user data from session if not expired yet.
        if (expiresAt && epoch < expiresAt) {
            userId = this.req[this.opts.sessionName]?.userId || null
        }

        // If user expired or not set yet, get from database.
        if (!userId) {
            try {
                userId = athlete?.id || null
                const userFromToken = await core.users.getByToken({accessToken: accessToken, refreshToken: refreshToken}, userId)

                if (userFromToken) {
                    userId = userFromToken.id
                } else {
                    logger.warn("OAuth.saveData", `Can't find ${userId ? userId : "user"} by token`)
                }
            } catch (innerEx) {
                logger.error("OAuth.saveData", "Error fetching user", innerEx)
            }
        }

        // Beta environment is available to PRO users only.
        // Enabled for everyone (temporarily).
        // if (userId && settings.beta.enabled) {
        //     const userFromProd = await core.beta.getProductionUser(userId)
        //     if (!userFromProd) {
        //         logger.warn("OAuth.saveData", `User ${userId} is not PRO and can't access the beta environment`)
        //         this.req[this.opts.sessionName].token = false
        //         this.req.accessToken = false
        //         this.req.accessDenied = true
        //         return false
        //     }
        // }

        if (userId) {
            this.req[this.opts.sessionName].userId = userId
            this.req.userId = userId
            return true
        }
    } catch (ex) {
        logger.error("OAuth.saveData", `User ${userId || "unknown"}`, ex)
    }
}

Handler.routes = {
    login: "/auth/login",
    callback: "/auth/callback",
    logout: "/auth/logout",
    refresh: "/auth/refresh"
}

Handler.prototype.redirect = function redirect(path) {
    this.res.writeHead(302, {location: path})
    this.res.end()
}

Handler.prototype.redirectAccessDenied = async function redirectToOAuth() {
    const qBeta = settings.beta.enabled ? "&beta=1" : ""
    return this.redirect(`/error?status=401${qBeta}`)
}

Handler.prototype.redirectToOAuth = async function redirectToOAuth(redirectUrl) {
    if (redirectUrl) {
        redirectUrl = btoa(redirectUrl)
    }

    return this.redirect(core.strava.getAuthUrl(redirectUrl))
}

Handler.prototype.logout = async function logout() {
    const userId = this.req[this.opts.sessionName]?.userId || null

    if (userId) {
        logger.warn("OAuth.logout", userId)
    }

    await this.createSession()

    this.req[this.opts.sessionName].reset()
    this.req[this.opts.sessionName].setDuration(0)

    if (this.res.headersSent) return
    this.redirect("/home")
}

Handler.prototype.isRoute = function isRoute(route) {
    const path = this.constructor.routes[route]
    return this.req.url.startsWith(path)
}

module.exports = Handler
