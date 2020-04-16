// Strautomator API: Maps routes

import {maps} from "strautomator-core"
import auth from "../auth"
import express = require("express")
import logger = require("anyhow")
import webserver = require("../../webserver")
const router = express.Router()

/**
 * Get geocode for specified address.
 */
router.get("/geocode", async (req, res) => {
    try {
        const validated = await auth.requestValidator(req, res)
        if (!validated) return

        const region: string = req.headers["cf-ipcountry"] as string
        const results = await maps.getGetcode(req.query.address as string, region || "")

        webserver.renderJson(req, res, results)
    } catch (ex) {
        logger.error("Routes", req.method, req.originalUrl, ex)
        webserver.renderError(req, res, ex, 500)
    }
})

/**
 * Get static image for specified coordinates. This won't check for the auth token,
 * but for HTTP origin instead.
 */
router.get("/image", async (req, res) => {
    try {
        const validated = await auth.requestValidator(req, res, {image: true})
        if (!validated) return

        const latlong = req.query.latlong.toString().split(",")
        const coordinates = {
            latitude: latlong[0] as any,
            longitude: latlong[1] as any
        }

        // Possible query parameters.
        const style: any = req.query.sttyle
        const size: any = req.query.size
        const zoom: any = req.query.zoom
        const circle: any = req.query.circle

        // Additional options.
        const options: any = {}
        if (style) {
            options.style = style
        }
        if (size) {
            if (isNaN(size)) {
                throw new Error("Parameter size must be a valid number")
            }
            options.size = parseFloat(size)
        }
        if (zoom) {
            if (isNaN(zoom)) {
                throw new Error("Parameter zoom must be a valid number")
            }
            options.zoom = parseFloat(zoom)
        }
        if (circle) {
            if (isNaN(circle)) {
                throw new Error("Parameter circle must be a valid number")
            }
            options.circle = parseFloat(circle)
        }

        // Fetch static image from our API.
        const result = await maps.getStaticImage(coordinates, options)

        res.setHeader("cache-control", "public, max-age=2592000")
        res.contentType("image/png")
        res.send(result)
    } catch (ex) {
        logger.error("Routes", req.method, req.originalUrl, ex)
        webserver.renderError(req, res, ex, 500)
    }
})

export = router
