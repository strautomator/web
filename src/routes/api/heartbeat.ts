// Strautomator API: Heartbeat

import cache = require("bitecache")
import express = require("express")
import logger = require("anyhow")
const router = express.Router()
const packageVersion = require("../../../package.json").version

/**
 * Heartbeat data.
 */
router.get("/", async (req, res) => {
    try {
        const result = {
            version: packageVersion,
            bitecache: {
                size: cache.totalSize,
                misses: cache.totalMemSize
            }
        }

        res.json(result)
    } catch (ex) {
        logger.error("Routes", req.method, req.originalUrl, ex)
        res.json({error: ex.toString()})
    }
})

export = router
