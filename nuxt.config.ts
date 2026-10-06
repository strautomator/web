import colors from "vuetify/util/colors"

// Most of the server side settings are loaded at runtime via setmeup (settings.json,
// settings.ENV.json and SMU_ environment variables), see server/utils/startup.ts.
export default defineNuxtConfig({
    compatibilityDate: "2026-06-01",
    telemetry: false,

    // Same as the previous setup, strict mode is disabled.
    typescript: {
        strict: false
    },

    devServer: {
        port: 3000
    },

    // Page and head defaults.
    app: {
        head: {
            titleTemplate: "Strautomator - %s",
            title: "Strautomator",
            meta: [{charset: "utf-8"}, {name: "viewport", content: "width=device-width, initial-scale=1"}, {name: "description", content: "Turbocharge your Strava activities with automated rules! Strautomator is like IFTTT, but for Strava"}],
            link: [{rel: "icon", type: "image/x-icon", href: "/favicon.png"}],
            script: [{src: "https://cdn.paddle.com/paddle/v2/paddle.js", crossorigin: "anonymous"}]
        }
    },

    // Global styles.
    css: ["@mdi/font/css/materialdesignicons.css", "~/assets/styles.scss"],

    modules: ["vuetify-nuxt-module"],

    // Auto import the Pinia stores.
    imports: {
        dirs: ["stores"]
    },

    // Nitro server options.
    nitro: {
        preset: "node-server",
        // The core settings files are loaded relative to the package folder, so it must
        // be fully copied to the output instead of having only the traced files.
        traceDeps: ["strautomator-core*", "setmeup", "anyhow"]
    },

    // The Vite / Vue build options.
    vite: {
        optimizeDeps: {
            include: ["json-editor-vue", "vanilla-jsoneditor"]
        }
    },

    // Vuetify options.
    vuetify: {
        moduleOptions: {
            styles: {configFile: "app/assets/vuetify-settings.scss"},
            importComposables: ["useDate", "useDisplay", "useTheme"]
        },
        vuetifyOptions: {
            display: {
                thresholds: {md: 960, lg: 1280, xl: 1920, xxl: 2560}
            },
            icons: {
                defaultSet: "mdi"
            },
            theme: {
                defaultTheme: "dark",
                themes: {
                    dark: {
                        dark: true,
                        colors: {
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
    }
})
