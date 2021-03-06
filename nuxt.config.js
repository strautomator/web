const colors = require("vuetify/es5/util/colors").default

// Please note that some of the settings here are hard coded for production but can be
// overwritten during startup on ~/src/index.ts, specially when running in development.
module.exports = {
    telemetry: false,

    head: {
        titleTemplate: "Strautomator - %s",
        title: "Strautomator",
        meta: [
            {charset: "utf-8"},
            {name: "viewport", content: "width=device-width, initial-scale=1"},
            {
                hid: "description",
                name: "description",
                content: "Turbocharge your Strava activities with automated rules! Strautomator is like IFTTT, but for Strava."
            }
        ],
        link: [{rel: "icon", type: "image/x-icon", href: "/favicon.png"}]
    },

    // Additional axios config.
    axios: {
        baseURL: "https://strautomator.com/",
        retry: false
    },

    // Additional build config.
    build: {
        optimization: {
            runtimeChunk: true
        }
    },

    // Additional builders.
    buildModules: ["@nuxtjs/vuetify", "@nuxtjs/moment", "@nuxtjs/google-analytics"],

    // Append global styles.
    css: ["@/assets/styles.scss"],

    // Forced environment variables.
    env: {
        baseUrl: "https://strautomator.com/"
    },

    // Please change the GA ID to your own, or simply disable the module if not needed.
    googleAnalytics: {
        id: "UA-9331973-6",
        autoTracking: {
            exception: true
        }
    },

    // Loading specs.
    loading: {color: "#FFECB3"},

    // Use axios, cookies and the custom Strava OAuth2 module.
    modules: ["@nuxtjs/axios", "cookie-universal-nuxt", "~/modules/oauth/index.js"],

    // Most of the OAuth2 related settings will be copied from the settings.json
    // and settings.ENV.json files on startup!
    oauth: {
        sessionName: "strautsession",
        oauthHost: "https://www.strava.com/oauth/"
    },

    // Additional plugins.
    plugins: ["~/plugins/breakpoint", "~/plugins/errorhandler", "~/plugins/authtoken"],

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
                    secondary: colors.amber.lighten4,
                    accent: colors.grey.darken3,
                    toolbar: colors.grey.darken4,
                    info: colors.grey.lighten1,
                    warning: colors.amber.base,
                    error: colors.deepOrange.accent4,
                    removal: colors.red.darken3,
                    success: colors.lightGreen.darken4
                }
            }
        }
    }
}
