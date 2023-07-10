const colors = require("vuetify/es5/util/colors").default

// Please note that some of the settings here will be overwritten with values from the settings.json
// and settings.ENV.json files during startup on ~/src/index.ts.
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
        retry: {
            retries: 1
        }
    },

    // Additional build config.
    build: {
        babel: {
            plugins: [["@babel/plugin-proposal-private-methods", {loose: true}]]
        },
        optimization: {
            runtimeChunk: true
        },
        devMiddleware: {
            headers: {
                "Cache-Control": "no-cache",
                Vary: "*"
            }
        },
        transpile: ["json-editor-vue"],
        extend(config) {
            config.module.rules.push({
                test: /\.mjs$/,
                include: /node_modules/,
                type: "javascript/auto"
            })
        }
    },

    // Additional builders.
    buildModules: ["@nuxtjs/vuetify", "@nuxtjs/dayjs"],

    // Append global styles.
    css: ["@/assets/styles.scss"],

    // Day.js options.
    dayjs: {
        locales: ["en"],
        plugins: ["advancedFormat", "localizedFormat", "duration", "utc", "relativeTime"]
    },

    // Forced environment variables.
    env: {
        baseUrl: process.env.SMU_app_url
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
    plugins: ["~/plugins/breakpoint", "~/plugins/errorhandler", "~/plugins/localstorage", "~/plugins/authtoken", "~/plugins/jsoneditorvue.client"],

    // Private runtime config.
    privateRuntimeConfig: {
        axios: {
            baseURL: process.env.SMU_app_url
        }
    },

    // Public runtime config.
    publicRuntimeConfig: {
        axios: {
            browserBaseURL: process.env.SMU_app_url
        }
    },

    // Server settings are defined on runtime.
    server: {},

    // Root route to redirect to /home or /dashboard, and follow redirects.
    serverMiddleware: [{path: "/", handler: "~/server/routes/index.js"}, "~/server/routes/redirects.js"],

    // Vuetify general options.
    vuetify: {
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
