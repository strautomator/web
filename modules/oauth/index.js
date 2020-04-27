const {resolve} = require("path")
const base = require("./server-middleware")

const defaultOptions = {
    moduleName: "oauth",
    scopes: []
}

module.exports = function NuxtOAuth(moduleOptions) {
    const options = Object.assign(defaultOptions, moduleOptions, this.options.oauth)

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
