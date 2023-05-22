// Strautomator API: FAQ

import {faq} from "strautomator-core"
import express = require("express")
import webserver = require("../../webserver")
const router: express.Router = express.Router()

/**
 * Search for answers from the FAQ.
 */
router.get("/", async (req: express.Request, res: express.Response) => {
    try {
        const query = req.query && req.query.q ? req.query.q.toString() : ""
        const results = await faq.search(query)

        webserver.renderJson(req, res, results)
    } catch (ex) {
        webserver.renderError(req, res, ex)
    }
})

export = router
