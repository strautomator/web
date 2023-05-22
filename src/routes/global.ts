// Global route handler, to log errors.

const logger = require("anyhow")

export default function (req, res, next) {
    if (res.statusCode >= 400) {
        logger.error("Routes", req.method, req.originalUrl, `Status ${res.statusCode || "not sent"}`, `From ${req.ip}`)
    }

    next()
}
