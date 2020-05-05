import Vue from "vue"

Vue.prototype.$webError = async (method, ex) => {
    try {
        const status = ex.status || ex.statusCode || 500
        const message = ex.message || ex.toString()
        const title = ex.title || ""

        if (process.server) {
            const logger = require("anyhow")
            logger.error("Vue", method, `Status ${status}`, `${title || "Error"} - ${message}`)
        } else {
            document.location.href = `/error?status=${encodeURIComponent(status)}&message=${encodeURIComponent(message)}&title=${encodeURIComponent(title)}`
        }
    } catch (ex2) {
        console.error("Vue.webError", ex, ex2)
    }
}
