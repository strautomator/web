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

    loading: {color: "#FFF"},

    css: ["@/assets/styles.scss"],

    buildModules: ["@nuxtjs/vuetify"],

    // Use axios, cookies and the custom Strava OAuth2 module.
    modules: ["@nuxtjs/axios", "cookie-universal-nuxt", "~/modules/oauth"],

    // Most of the OAuth2 related settings will be copied from the settings.json
    // and settings.ENV.json files on startup!
    oauth: {
        sessionName: "strautsession",
        oauthHost: "https://www.strava.com/oauth/"
    },

    // Root route to redirect to /home or /dashboard.
    serverMiddleware: [{path: "/", handler: "~/server/routes/index.js"}],

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
    },

    plugins: [],
    axios: {},

    build: {
        extend(config, ctx) {}
    }
}
