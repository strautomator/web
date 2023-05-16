// Strautomator API: Heartbeat

import express = require("express")
import logger = require("anyhow")
const router: express.Router = express.Router()
const packageVersion = require("../../../package.json").version

/**
 * Heartbeat data.
 */
router.get("/", async (req: express.Request, res: express.Response) => {
    try {
        const result = {
            version: packageVersion
        }

        logger.info("Routes", req.method, req.originalUrl, "Heartbeat sent")
        res.json(result)
    } catch (ex) {
        logger.error("Routes", req.method, req.originalUrl, ex)
        res.status(500).json({error: ex.toString()})
    }
})

export = router
