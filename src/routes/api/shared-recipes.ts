// Strautomator API: Recipes

import {recipes, users, UserData} from "strautomator-core"
import auth from "../auth"
import express = require("express")
import webserver = require("../../webserver")
const router: express.Router = express.Router()

// USER DATA
// --------------------------------------------------------------------------

/**
 * Get all shared recipes for the logged user.
 */
router.get("/:userId", async (req: express.Request, res: express.Response) => {
    try {
        if (!req.params) throw new Error("Missing request params")

        const user: UserData = (await auth.requestValidator(req, res)) as UserData
        if (!user) return

        const result = await recipes.getUserSharedRecipes(user)
        webserver.renderJson(req, res, result)
    } catch (ex) {
        webserver.renderError(req, res, ex)
    }
})

/**
 * Get a shared recipe by ID. The user ID on the route is used for logging purposes only.
 */
router.get("/:userId/:id", async (req: express.Request, res: express.Response) => {
    try {
        if (!req.params) throw new Error("Missing request params")

        const user: UserData = (await auth.requestValidator(req, res)) as UserData
        if (!user) return

        const recipeId = req.params.id
        const result = await recipes.getSharedRecipe(user, recipeId)
        const owner = await users.getById(result.userId)
        result.userDisplayName = owner.displayName || owner.id
        webserver.renderJson(req, res, result)
    } catch (ex) {
        webserver.renderError(req, res, ex)
    }
})

/**
 * Create or edit a shared recipe.
 */
router.post("/:userId/:id", async (req: express.Request, res: express.Response) => {
    try {
        const user: UserData = (await auth.requestValidator(req, res)) as UserData
        if (!user) return

        const data = req.body
        const result = await recipes.setSharedRecipe(user, data)

        webserver.renderJson(req, res, result)
    } catch (ex) {
        webserver.renderError(req, res, ex)
    }
})

/**
 * Delete an existing shared automation.
 */
router.delete("/:userId/:id", async (req: express.Request, res: express.Response) => {
    try {
        const user: UserData = (await auth.requestValidator(req, res)) as UserData
        if (!user) return

        const recipeId = req.params.id
        await recipes.deleteSharedRecipe(user, recipeId)

        webserver.renderJson(req, res, {deleted: recipeId})
    } catch (ex) {
        webserver.renderError(req, res, ex)
    }
})

export = router
