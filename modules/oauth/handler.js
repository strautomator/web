const core = require("strautomator-core")
const logger = require("anyhow")
const sessions = require("client-sessions")
const {atob, btoa} = require("Base64")
const {parse} = require("qs")

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
        await this.saveData({accessToken, refreshToken, expiresAt}, athlete)

        logger.info("OAuth.authenticateCallbackToken", athlete.id, athlete.username, "Logged in")

        return this.redirect(redirectUrl)
    } catch (ex) {
        logger.warn("OAuth.authenticateCallbackToken", ex)
        return this.redirectToOAuth()
    }
}

Handler.prototype.createSession = function createSession() {
    if (this.req[this.opts.sessionName]) return Promise.resolve()

    try {
        const session = sessions({
            cookieName: this.opts.sessionName,
            secret: this.opts.secretKey,
            duration: 7 * 24 * 60 * 60 * 1000
        })

        return new Promise((resolve) => session(this.req, this.res, resolve))
    } catch (ex) {
        logger.error("OAuth.createSession", ex)
        throw ex
    }
}

Handler.prototype.extractToken = function extractToken() {
    const authorization = this.req && this.req.headers ? this.req.headers.authorization : null
    if (!authorization) return null

    // Take the second split so it handles all token types.
    return authorization.split(" ")[1]
}

Handler.prototype.getSessionToken = function getSessionToken() {
    return this.req[this.opts.sessionName] ? this.req[this.opts.sessionName].token : null
}

Handler.prototype.updateToken = async function updateToken() {
    await this.createSession()

    let stravaTokens = this.getSessionToken()
    if (!stravaTokens || !stravaTokens.accessToken) return null

    const userId = this.req[this.opts.sessionName] ? this.req[this.opts.sessionName].userId : null

    try {
        const now = new Date()
        const epoch = now.getTime() / 1000 - 1

        // Current token expired? Refresh it.
        if (stravaTokens.expiresAt && stravaTokens.expiresAt <= epoch) {
            stravaTokens = await core.strava.refreshToken(stravaTokens.refreshToken, stravaTokens.accessToken)

            if (stravaTokens) {
                const {accessToken, refreshToken, expiresAt} = stravaTokens
                stravaTokens.accessToken = accessToken
                stravaTokens.refreshToken = refreshToken
                stravaTokens.expiresAt = expiresAt

                logger.info("OAuth.updateToken", `Refreshed token for user ${userId}`)
            } else {
                stravaTokens = null
            }
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

    await this.createSession()

    if (!stravaTokens || !stravaTokens.accessToken) {
        userId = this.req[this.opts.sessionName].userId ? this.req[this.opts.sessionName].userId : null
        logger.warn("OAuth.saveData", `User ${userId}`, "No access token passed to save, will reset")
        return this.req[this.opts.sessionName].reset()
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
        userId = this.req[this.opts.sessionName] ? this.req[this.opts.sessionName].userId : null
    }

    // If user expired or not set yet, get from database.
    if (!userId) {
        try {
            userId = athlete ? athlete.id : null
            const userFromToken = await core.users.getByToken({accessToken: accessToken, refreshToken: refreshToken}, userId)

            if (userFromToken) {
                userId = userFromToken.id
            } else {
                logger.warn("OAuth.saveData", `Can't find user ${userId} by token`)
            }
        } catch (ex) {
            logger.error("OAuth.saveData", "Error fetching user", ex)
        }
    }

    if (userId) {
        this.req[this.opts.sessionName].userId = userId
        this.req.userId = userId
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

Handler.prototype.redirectToOAuth = async function redirectToOAuth(redirectUrl) {
    if (redirectUrl) {
        redirectUrl = btoa(redirectUrl)
    }

    return this.redirect(core.strava.getAuthUrl(redirectUrl))
}

Handler.prototype.logout = async function logout() {
    const userId = this.req[this.opts.sessionName] ? this.req[this.opts.sessionName].userId : null

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
