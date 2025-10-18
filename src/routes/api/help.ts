// Strautomator API: Help

import {chatbase, faq, UserData} from "strautomator-core"
import auth from "../auth"
import express = require("express")
import webserver = require("../../webserver")
const router: express.Router = express.Router()

/**
 * Search for answers from the FAQ.
 */
router.get("/faq", async (req: express.Request, res: express.Response) => {
    try {
        const query = req.query?.q?.toString() || ""
        const results = await faq.search(query)

        webserver.renderJson(req, res, results)
    } catch (ex) {
        webserver.renderError(req, res, ex)
    }
})

/**
 * Ask the Chatbase AI bot.
 */
router.post("/chat", async (req: express.Request, res: express.Response) => {
    try {
        if (!req.body?.message) throw new Error("Missing request body")

        const user: UserData = (await auth.requestValidator(req, res, {anonymous: true, referer: true})) as UserData
        await chatbase.getAnswer(user, req.body.message.trim(), res)
    } catch (ex) {
        webserver.renderError(req, res, ex)
    }
})

export = router
