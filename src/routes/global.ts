// Global route handler, to log errors.

const logger = require("anyhow")

export default function(req, res, next) {
    if (res.statusCode >= 400) {
        logger.error("Routes", req.originalUrl, `Status ${res.statusCode}`)
    }

    next()
}
