const colors = require("vuetify/es5/util/colors").default

module.exports = {
    mode: "universal",

    head: {
        titleTemplate: "Strautomator - %s",
        title: "Strautomator",
        meta: [
            {charset: "utf-8"},
            {name: "viewport", content: "width=device-width, initial-scale=1"},
            {
                hid: "description",
                name: "description",
                content: "Turbocharge your Strava activities with automated rules!"
            }
        ],
        link: [{rel: "icon", type: "image/x-icon", href: "/favicon.png"}]
    },

    // Additional axios config.
    axios: {
        baseURL: "https://strautomator.com/",
        retry: {
            retries: 1
        }
    },

    // Additional build config.
    build: {
        extend() {}
    },

    // Additional builders.
    buildModules: ["@nuxtjs/vuetify", "@nuxtjs/google-analytics"],

    // Append global styles.
    css: ["@/assets/styles.scss"],

    // Please change the GA ID to your own, or simply disable the module if not needed.
    googleAnalytics: {
        id: "UA-9331973-6"
    },

    // Loading is white by default.
    loading: {color: "#FFF"},

    // Use axios, cookies and the custom Strava OAuth2 module.
    modules: ["@nuxtjs/axios", "cookie-universal-nuxt", "~/modules/oauth/index.js"],

    // Most of the OAuth2 related settings will be copied from the settings.json
    // and settings.ENV.json files on startup!
    oauth: {
        sessionName: "strautsession",
        oauthHost: "https://www.strava.com/oauth/"
    },

    // Additional plugins.
    plugins: [],

    // Root route to redirect to /home or /dashboard.
    serverMiddleware: [{path: "/", handler: "~/server/routes/index.js"}, "~/server/routes/global.js"],

    // Vuetify general options.
    vuetify: {
        customVariables: ["~/assets/variables.scss"],
        theme: {
            dark: true,
            themes: {
                dark: {
                    primary: colors.amber.darken3,
                    secondary: colors.amber.darken4,
                    accent: colors.grey.darken3,
                    info: colors.teal.lighten1,
                    warning: colors.amber.base,
                    error: colors.deepOrange.accent4,
                    success: colors.green.accent3
                }
            }
        }
    }
}
