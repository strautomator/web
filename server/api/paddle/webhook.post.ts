// Strautomator API: Paddle webhook

import {paddle} from "strautomator-core"
import {defineEventHandler} from "nuxt/server"
import {Buffer} from "node:buffer"
import {renderError, renderJson, toCoreRequest} from "../../utils/web"
import logger from "anyhow"

/**
 * Process Paddle webhooks.
 */
export default defineEventHandler(async (event) => {
    try {
        const rawBody = Buffer.from(await event.req.arrayBuffer())
        event.context.requestBody = rawBody.toString()
        await paddle.processWebhook(toCoreRequest(event, rawBody) as any)
    } catch (ex) {
        logger.error("Routes.paddle", event.req.method, event.url.pathname + event.url.search, ex)
        return renderError(event, "Failed to process webhook", 500)
    }

    return renderJson(event, {ok: true})
})
