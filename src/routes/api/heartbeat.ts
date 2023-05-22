// Strautomator API: Heartbeat

import express = require("express")
const router: express.Router = express.Router()
const packageVersion = require("../../../package.json").version

/**
 * Heartbeat data.
 */
router.get("/", async (_req, res: express.Response) => {
    res.json({version: packageVersion})
})

export = router
