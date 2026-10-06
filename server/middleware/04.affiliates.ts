// Strautomator Web: Affiliate links

import {defineEventHandler, getRequestHost} from "nuxt/server"
import {fromNodeHandler, type H3Event} from "nitro/h3"
import {getAffiliatesApp} from "../utils/startup"
import setmeup from "setmeup"
const settings = setmeup.settings

/**
 * Affiliate links are handled by the country-linkify Express app, either via
 * the affiliates subdomain or directly via the affiliates base path.
 */
export default defineEventHandler((event) => {
    const app = getAffiliatesApp()
    if (!app) {
        return
    }

    const basePath: string = settings.affiliates.server.basePath
    const hostname = getRequestHost(event).split(":")[0].toLowerCase()
    const subdomains = hostname.split(".").slice(0, -2)
    let url = event.url.pathname + event.url.search

    if (subdomains.length > 0 && settings.affiliates.server.url.includes(hostname)) {
        url = basePath + url.substring(1)
    }
    if (!url.startsWith(basePath)) {
        return
    }

    return fromNodeHandler((req, res) => {
        req.url = url
        app(req as any, res as any)
    })(event as unknown as H3Event)
})
