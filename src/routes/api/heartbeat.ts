// Strautomator API: Heartbeat

import express = require("express")
import jaul = require("jaul")
import logger = require("anyhow")
const router = express.Router()
const packageVersion = require("../../../package.json").version

/**
 * Heartbeat data.
 */
router.get("/", async (req, res) => {
    try {
        const systemInfo = jaul.system.getInfo({labels: false})
        const result = {
            version: packageVersion,
            memory: systemInfo.process.memoryUsed,
            uptime: systemInfo.uptime
        }

        logger.error("Routes", req.method, req.originalUrl, "Heartbeat sent")
        res.json(result)
    } catch (ex) {
        logger.error("Routes", req.method, req.originalUrl, ex)
        res.status(500).json({error: ex.toString()})
    }
})

export = router
