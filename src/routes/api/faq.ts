// Strautomator API: FAQ

import {faq} from "strautomator-core"
import express = require("express")
import logger = require("anyhow")
import webserver = require("../../webserver")
const router: express.Router = express.Router()

/**
 * Search for answers from the FAQ.
 */
router.get("/", async (req: express.Request, res: express.Response) => {
    try {
        const query = req.query && req.query.q ? req.query.q.toString() : ""
        const results = await faq.search(query)

        logger.info("Routes", req.method, req.originalUrl)
        webserver.renderJson(req, res, results)
    } catch (ex) {
        logger.error("Routes", req.method, req.originalUrl, ex)
        webserver.renderError(req, res, ex, 500)
    }
})

export = router
