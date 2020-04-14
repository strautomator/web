const core = require("strautomator-core")
const logger = require("anyhow")
const sessions = require("client-sessions")
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

const errorLog = (e) => process.env.NODE_ENV === "development" && console.error(e)

/**
 * TODO Handle some max retry logic to stop the spam when a token is not valid
 * * x-Retries - could be passed as a simple header
 * * npm library (requestretry)[https://www.npmjs.com/package/requestretry] might also be helpful
 */
Handler.prototype.redirect = function redirect(path) {
    this.res.writeHead(302, {location: path})
    this.res.end()
}

Handler.prototype.createSession = function createSession() {
    if (this.req[this.opts.sessionName]) return Promise.resolve()
    const session = sessions({
        cookieName: this.opts.sessionName,
        secret: this.opts.secretKey,
        duration: 24 * 60 * 60 * 1000
    })
    return new Promise((resolve) => session(this.req, this.res, resolve))
}

Handler.prototype.checkRequestAuthorization = async function checkRequestAuthorization() {
    const existingToken = this.extractToken()

    // When an existing token exists try to authenticate the session,
    // and logout if failed.
    try {
        if (existingToken) {
            await this.saveData({accessToken: existingToken})
        }
    } catch (e) {
        logger.warn("OAuth.checkRequestAuthorization", ex)
        return this.logout()
    }

    return false
}

Handler.prototype.authenticateCallbackToken = async function authenticateCallbackToken() {
    try {
        const tokens = await core.strava.getToken(this.req.query.code)
        const {accessToken, refreshToken, expiresAt} = tokens
        await this.saveData({accessToken, refreshToken, expiresAt})

        const athlete = await core.strava.getAthlete(tokens)

        // Check for existing user, and create a new one if necessary.
        await core.users.upsert(athlete, tokens)
        logger.info("OAuth.authenticateCallbackToken", athlete.id, athlete.username, "Logged in")

        return this.redirect(settings.routes.afterLogin)
    } catch (ex) {
        logger.error("OAuth.authenticateCallbackToken", ex)
        return this.redirectToOAuth()
    }
}

Handler.prototype.saveData = async function saveData(token) {
    await this.createSession()

    if (!token) {
        return this.req[this.opts.sessionName].reset()
    }

    const {accessToken, refreshToken, expiresAt} = token
    this.req[this.opts.sessionName].token = {accessToken, refreshToken, expiresAt}
    this.req.accessToken = accessToken

    const fetchUser = async () => {
        try {
            return await this.opts.fetchUser(accessToken, this.req, this.opts)
        } catch (ex) {
            return null
        }
    }

    const now = new Date().getTime() / 1000
    let user

    if (now < expiresAt) {
        user = this.req[this.opts.sessionName].user
    }
    if (!user) {
        user = await fetchUser()
    }
    if (!user) {
        return false
    } else {
        logger.info("OAuth.saveData", `User ${user.id} - ${user.profile.username}`)
    }

    this.req[this.opts.sessionName].user = user
    this.req.user = user
    return true
}

Handler.prototype.updateToken = async function updateToken() {
    await this.createSession()
    let {token} = this.req[this.opts.sessionName]
    if (!token) return false

    try {
        const now = new Date()
        const epoch = Math.round(now.getTime() / 1000)

        if (token.expiresAt * 0.9 < epoch) {
            const {accessToken, refreshToken, expiresAt} = await core.strava.refreshToken(token.refreshToken, token.accessToken)
            token.accessToken = accessToken
            token.refreshToken = refreshToken
            token.expiresAt = expiresAt
        }
    } catch (ex) {
        logger.error("OAuth.updateToken", ex)
        token = null
    }

    await this.saveData(token)

    return token
}

Handler.prototype.redirectToOAuth = async function redirectToOAuth() {
    return this.redirect(core.strava.api.authUrl)
}

Handler.prototype.logout = async function logout() {
    await this.createSession()
    this.req[this.opts.sessionName].reset()
    this.req[this.opts.sessionName].setDuration(0)

    const redirectUrl = parse(this.req.url.split("?")[1])["redirect-url"] || "/"
    try {
        await this.opts.onLogout(this.req, this.res, redirectUrl)
    } catch (ex) {
        logger.error("OAuth.logout", ex)
    }

    if (this.res.headersSent) return
    this.redirect(redirectUrl)
}

Handler.routes = {
    login: "/auth/login",
    callback: "/auth/callback",
    logout: "/auth/logout",
    refresh: "/auth/refresh"
}

Handler.prototype.isRoute = function isRoute(route) {
    const path = this.constructor.routes[route]

    return this.req.url.startsWith(path)
}

Handler.prototype.extractToken = function extractToken() {
    const {
        headers: {authorization}
    } = this.req

    if (!authorization) return null

    // Take the second split, handles all token types
    const [, token] = authorization.split(" ")

    return token
}

module.exports = Handler
