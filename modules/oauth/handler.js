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
    const defaultRedirect = "/dashboard"
    let redirectUrl

    try {
        const {state} = parse(this.req.url.split("?")[1])
        redirectUrl = atob(state)

        // Make sure we never redirect back to home or error pages.
        const redirectPath = redirectUrl.replace("/", "").substring(0, 5)
        if (redirectPath == "home" || redirectPath == "error") {
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
        await this.saveData({accessToken, refreshToken, expiresAt})

        const athlete = await core.strava.athletes.getAthlete(tokens)

        // Check for existing user, and create a new one if necessary.
        await core.users.upsert(athlete, tokens)
        logger.info("OAuth.authenticateCallbackToken", athlete.id, athlete.username, "Logged in")

        return this.redirect(redirectUrl)
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
            const userFromToken = await core.users.getByToken({accessToken: accessToken, refreshToken: refreshToken})
            return userFromToken
        } catch (ex) {
            logger.error("OAuth.fetchUser", ex)
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
        logger.debug("OAuth.saveData", `User ${user.id} ${user.displayName}`)
    }

    // No need to expose the tokens under the user object.
    delete user.stravaTokens

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
