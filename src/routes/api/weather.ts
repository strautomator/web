// Strautomator API: Weather

import {weather, UserData} from "strautomator-core"
import auth from "../auth"
import express = require("express")
import logger = require("anyhow")
import webserver = require("../../webserver")
const router = express.Router()

/**
 * Heartbeat data.
 */
router.get("/:coordinates", async (req: express.Request, res: express.Response) => {
    try {
        if (!req.params) throw new Error("Missing request params")

        const user: UserData = (await auth.requestValidator(req, res)) as UserData
        if (!user) return

        if (!req.params.coordinates) {
            logger.error("Routes", req.method, req.originalUrl, "Missing coordinates")
            return webserver.renderError(req, res, "Missing coordinates", 400)
        }

        const result = {}
        const coordinates = req.params.coordinates.toString()

        for (let provider of weather.providers) {
            try {
                const summary = await provider.getWeather(coordinates.split(","), new Date(), user.preferences)
                result[provider.name] = summary
            } catch (innerEx) {
                logger.error("Routes", req.method, req.originalUrl, `Provider: ${provider.name}`, innerEx)
            }
        }

        logger.info("Routes", req.method, req.originalUrl)
        res.set("Cache-Control", "public, max-age=60")
        webserver.renderJson(req, res, result)
    } catch (ex) {
        logger.error("Routes", req.method, req.originalUrl, ex)
        res.status(500).json({error: ex.toString()})
    }
})

export = router
