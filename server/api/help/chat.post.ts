// Strautomator API: Help chat

import {chatbase} from "strautomator-core"
import {defineEventHandler} from "nuxt/server"
import {requestValidator} from "../../utils/auth"
import {createStreamWriter, getBody, renderError} from "../../utils/web"

/**
 * Ask the Chatbase AI bot.
 */
export default defineEventHandler(async (event) => {
    try {
        const body = await getBody(event)
        if (!body?.message) throw new Error("Missing request body")

        const user = await requestValidator(event, {anonymous: true, referer: true})
        const {stream, writer} = createStreamWriter()
        await chatbase.getAnswer(user as any, body.message.trim(), writer as any)
        return new Response(stream)
    } catch (ex) {
        return renderError(event, ex)
    }
})
