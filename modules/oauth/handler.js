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

/**
 * TODO Handle some max retry logic to stop the spam when a token is not valid.
 */
Handler.prototype.redirect = function redirect(path) {
    this.res.writeHead(302, {location: path})
    this.res.end()
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
        const tokens = await core.strava.getToken(this.req.query.code)

        if (!tokens || !tokens.accessToken) {
            return this.redirectToOAuth()
        }

        const {accessToken, refreshToken, expiresAt} = tokens
        const athlete = await core.strava.athletes.getAthlete(tokens)

        if (!athlete) {
            throw new Error("Strava athlete not found")
        }

        await this.saveData({accessToken, refreshToken, expiresAt}, athlete)

        // Check for existing user and create a new one if necessary.
        await core.users.upsert(athlete, tokens)
        logger.info("OAuth.authenticateCallbackToken", athlete.id, athlete.username, "Logged in")

        return this.redirect(redirectUrl)
    } catch (ex) {
        logger.error("OAuth.authenticateCallbackToken", ex)
        return this.redirectToOAuth()
    }
}

Handler.prototype.saveData = async function saveData(token, athlete) {
    await this.createSession()

    if (!token) {
        return this.req[this.opts.sessionName].reset()
    }

    const {accessToken, refreshToken, expiresAt} = token
    this.req.accessToken = accessToken
    this.req[this.opts.sessionName].token = {accessToken}

    if (refreshToken) this.req[this.opts.sessionName].token.refreshToken = refreshToken
    if (expiresAt) this.req[this.opts.sessionName].token.expiresAt = expiresAt

    const fetchUser = async () => {
        try {
            const userId = athlete ? athlete.id : null
            const userFromToken = await core.users.getByToken({accessToken: accessToken, refreshToken: refreshToken}, userId)
            return userFromToken
        } catch (ex) {
            logger.error("OAuth.fetchUser", ex)
            return null
        }
    }

    const now = new Date().getTime() / 1000
    let user

    // Get user from session or fetch from the database.
    if (expiresAt && now < expiresAt) {
        user = this.req[this.opts.sessionName].user
    }
    if (!user) {
        user = await fetchUser()
    }

    this.req[this.opts.sessionName].user = user
    this.req.user = user
}

Handler.prototype.updateToken = async function updateToken() {
    await this.createSession()

    let {token} = this.req[this.opts.sessionName]
    if (!token) return false

    try {
        const now = new Date()
        const epoch = Math.round(now.getTime() / 1000)

        if (token.expiresAt <= epoch) {
            const user = this.req[this.opts.sessionName] ? this.req[this.opts.sessionName].user : null
            const userId = user ? user.id : null

            if (userId) {
                logger.info("OAuth.updateToken", `Will refresh token for ${userId}`)
            }

            const stravaTokens = await core.strava.refreshToken(token.refreshToken, token.accessToken)

            if (stravaTokens) {
                const {accessToken, refreshToken, expiresAt} = stravaTokens
                token.accessToken = accessToken
                token.refreshToken = refreshToken
                token.expiresAt = expiresAt
            } else {
                token = null
            }
        }
    } catch (ex) {
        logger.error("OAuth.updateToken", ex)
        token = null
    }

    await this.saveData(token)

    return token
}

Handler.prototype.redirectToOAuth = async function redirectToOAuth(redirectUrl) {
    if (redirectUrl) {
        redirectUrl = btoa(redirectUrl)
    }

    return this.redirect(core.strava.getAuthUrl(redirectUrl))
}

Handler.prototype.logout = async function logout() {
    const user = this.req[this.opts.sessionName] ? this.req[this.opts.sessionName].user : null

    if (user) {
        logger.warn("OAuth.logout", user.id)
    }

    await this.createSession()

    this.req[this.opts.sessionName].reset()
    this.req[this.opts.sessionName].setDuration(0)

    if (this.res.headersSent) return
    this.redirect("/home")
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

    // Take the second split so it handles all token types.
    const [, token] = authorization.split(" ")

    return token
}

module.exports = Handler
