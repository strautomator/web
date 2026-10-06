import colors from "vuetify/util/colors"
import fs from "node:fs"

/**
 * Hosts allowed to access the dev server (for example via a tunnel), taken from the
 * app.url on the SMU_app_url env variable and on the local (gitignored) settings files.
 */
const getDevAllowedHosts = (): string[] => {
    const urls: string[] = [process.env.SMU_app_url]

    for (const file of ["settings.local.json", "settings.secret.json"]) {
        try {
            const content = fs.readFileSync(file, "utf8")
            try {
                urls.push(JSON.parse(content).app?.url)
            } catch (ex) {
                // Settings with comments are not valid JSON, so fallback to a regex.
                urls.push(content.match(/"app"\s*:\s*\{[^}]*?"url"\s*:\s*"([^"]+)"/)?.[1])
            }
        } catch (ex) {
            // File not found, ignore.
        }
    }

    const hosts = urls.filter((url) => !!url).map((url) => URL.parse(url)?.hostname)
    return [...new Set(hosts.filter((host) => !!host && host != "localhost"))]
}

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
        server: {
            allowedHosts: getDevAllowedHosts(),
            // Vite serves the same CSS URL either as CSS or as a JS module depending on the request
            // headers, so dev responses must never be cached by browsers or proxies (Cloudflare).
            headers: {"Cache-Control": "no-store"}
        },
        plugins: [
            {
                // Cloudflare revalidates its cached copies with conditional requests, and a 304 from Vite
                // would keep serving a stale (and possibly wrong) variant through the tunnel.
                name: "strautomator-dev-tunnel-nocache",
                apply: "serve",
                configureServer(server) {
                    server.middlewares.use((req, _res, next) => {
                        if (req.headers["cf-ray"]) {
                            delete req.headers["if-none-match"]
                            delete req.headers["if-modified-since"]
                        }
                        next()
                    })
                }
            }
        ],
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
