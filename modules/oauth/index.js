const {resolve} = require("path")
const base = require("./server-middleware")
const core = require("strautomator-core")
const logger = require("anyhow")

const defaultFetchUser = async (accessToken) => {
    try {
        const user = await core.users.getByToken(accessToken)
        return user
    } catch (ex) {
        logger.error("OAuth.fetchUser", ex)
        return null
    }
}

const defaultOptions = {
    moduleName: "oauth",
    fetchUser: defaultFetchUser,
    onLogout: () => {},
    scopes: []
}

module.exports = function NuxtOAuth(moduleOptions) {
    const options = Object.assign(defaultOptions, moduleOptions, this.options.oauth)

    if (typeof options.onLogout !== "function") throw new Error("options.onLogout must be a function")
    if (typeof options.fetchUser !== "function") throw new Error("options.fetchUser must be a function")
    if (options.scopes && !Array.isArray(options.scopes)) throw new Error("options.scopes must be an array")

    // Setup middlewares
    this.addServerMiddleware(base(options))
    this.addPlugin({
        src: resolve(__dirname, "plugin.js"),
        fileName: "nuxt-oauth.plugin.js",
        options: {
            moduleName: options.moduleName
        }
    })

    // Add router middleware to config
    this.options.router = this.options.router || {}
    this.options.router.middleware = this.options.router.middleware || []
    this.options.router.middleware.push("auth")

    // Setup te /auth/login route
    this.extendRoutes((routes, resolve) => {
        routes.push(
            {
                name: "oauth-login",
                path: "/auth/login",
                component: resolve(__dirname, "./route.vue")
            },
            {
                name: "oauth-logout",
                path: "/auth/logout",
                component: resolve(__dirname, "./route.vue")
            }
        )
    })
}
