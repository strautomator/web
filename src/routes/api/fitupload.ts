// Strautomator API: FIT file uploads

import {fitparser, FitUploadResult, UserData} from "strautomator-core"
import auth from "../auth"
import express from "express"
import webserver = require("../../webserver")
const settings = require("setmeup").settings
const router: express.Router = express.Router()

/**
 * Get the limits that apply to the uploaded archives.
 */
router.get("/limits", async (req: express.Request, res: express.Response) => {
    try {
        const upload = settings.fitparser.upload
        webserver.renderJson(req, res, {maxSize: upload.maxSize, maxFiles: upload.maxFiles, maxFileSize: upload.maxFileSize})
    } catch (ex) {
        webserver.renderError(req, res, ex)
    }
})

/**
 * Upload a ZIP archive with FIT files to be processed. The request body is the raw archive,
 * and results are streamed back as NDJSON so the client can display the progress in real time.
 */
router.post("/:userId/zip", async (req: express.Request, res: express.Response) => {
    let streaming = false

    try {
        const user: UserData = (await auth.requestValidator(req, res)) as UserData
        if (!user) return
        if (!user.isPro) {
            return webserver.renderError(req, res, "Uploading FIT files is available to PRO users only", 402)
        }

        // Reject oversized archives upfront, the actual streamed size is enforced by the core.
        const maxSize = settings.fitparser.upload.maxSize
        const contentLength = parseInt(req.headers["content-length"] as string) || 0
        if (contentLength > maxSize) {
            return webserver.renderError(req, res, `The archive is bigger than ${Math.round(maxSize / 1024 / 1024)}MB`, 413)
        }

        res.status(200)
        res.setHeader("Content-Type", "application/x-ndjson")
        res.setHeader("Cache-Control", "no-store")
        res.setHeader("X-Accel-Buffering", "no")
        res.flushHeaders()
        streaming = true

        const write = (data: any) => new Promise<void>((resolve) => res.write(`${JSON.stringify(data)}\n`, () => resolve()))
        const callbacks = {
            onStart: async (total: number) => await write({type: "start", total: total}),
            onFile: async (result: FitUploadResult) => await write({type: "file", result: result})
        }
        const results = await fitparser.upload.processZip(user, req, callbacks)

        await write({type: "end", results: results})
        res.end()
    } catch (ex) {
        if (streaming) {
            res.write(`${JSON.stringify({type: "error", message: ex.message || ex.toString()})}\n`)
            res.end()
        } else {
            webserver.renderError(req, res, ex)
        }
    }
})

export = router
