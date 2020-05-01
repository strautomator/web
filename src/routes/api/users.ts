// Strautomator API: User routes

import {strava, recipes, users, RecipeData, UserData} from "strautomator-core"
import auth from "../auth"
import express = require("express")
import logger = require("anyhow")
import webserver = require("../../webserver")
const router = express.Router()

// USER DATA
// --------------------------------------------------------------------------

/**
 * Search users.
 */
router.get("/", async (req, res) => {
    try {
        const validated = await auth.requestValidator(req, res, {admin: true})
        if (!validated) return

        const result = await users.getAll()
        webserver.renderJson(req, res, result)
    } catch (ex) {
        logger.error("Routes", req.method, req.originalUrl, ex)
        webserver.renderError(req, res, ex, 500)
    }
})

/**
 * Get user by ID.
 */
router.get("/:userId", async (req, res) => {
    try {
        const userId = req.params.userId
        const validated = await auth.requestValidator(req, res, {userId: userId})
        if (!validated) return

        const userData = await users.getById(userId)

        if (userData) {
            logger.info("Routes", req.method, req.originalUrl, userData.displayName)
            webserver.renderJson(req, res, userData)
        } else {
            logger.error("Routes", req.method, req.originalUrl, `User ${userId} not found`)
            webserver.renderError(req, res, "User not found", 404)
        }
    } catch (ex) {
        logger.error("Routes", req.method, req.originalUrl, ex)
        webserver.renderError(req, res, ex, 500)
    }
})

/**
 * Delete user and cancel its pending jobs / webhooks.
 */
router.delete("/:userId", async (req, res) => {
    try {
        const userId = req.params.userId
        const validated = await auth.requestValidator(req, res, {userId: userId})
        if (!validated) return

        const user = await users.getById(userId)

        // User not found?
        if (!user) {
            logger.error("Routes", req.method, req.originalUrl, `User ${userId} not found`)
            return webserver.renderError(req, res, "User not found", 404)
        }

        // Delete the user from the database.
        await users.delete(user)
        logger.info("Routes", req.method, req.originalUrl, `User ${user.displayName} deleted`)

        webserver.renderJson(req, res, {deleted: true})
    } catch (ex) {
        logger.error("Routes", req.method, req.originalUrl, ex)
        webserver.renderError(req, res, ex, 500)
    }
})

// USER RECIPES MANAGEMENT
// --------------------------------------------------------------------------

/**
 * Create / update / delete user recipes.
 * @param req Express request.
 * @param res Express response.
 */
const routeUserRecipe = async (req: any, res: any) => {
    try {
        const method = req.method.toUpperCase()
        const userId = req.params.userId
        const validated = await auth.requestValidator(req, res, {userId: userId})
        if (!validated) return

        let recipe: RecipeData = req.body

        // Make sure recipe was sent in the correct format.
        if (method != "DELETE") {
            try {
                recipes.validate(recipe)
            } catch (ex) {
                logger.error("Routes", req.method, req.originalUrl, ex, req.body)
                return webserver.renderError(req, res, ex, 400)
            }
        }

        const recipeId = req.params.recipeId || recipe.id
        const user: UserData = await users.getById(userId)

        // User not found?
        if (!user) {
            logger.error("Routes", req.method, req.originalUrl, `User ${userId} not found`)
            return webserver.renderError(req, res, "User not found", 404)
        }

        const username = user.displayName

        // Creating a new recipe?
        if (!recipe.id && method == "POST") {
            const now = new Date()
            const hex = Math.round(now.getTime() / 1000).toString(16)
            recipe.id = "r" + hex.toLowerCase()

            // Add to user's recipe list.
            user.recipes[recipe.id] = recipe
            logger.info("Routes", req.method, req.originalUrl, `User ${username}`, `New recipe ${recipe.id}: ${recipe.title}`)
        } else {
            const existingRecipe = user.recipes[recipeId]

            // Recipe not found?
            if (!existingRecipe) {
                logger.error("Routes", req.method, req.originalUrl, `User ${username}`, `Recipe ${recipeId} not found`)
                return webserver.renderError(req, res, "Recipe not found", 404)
            }

            // Updating an existing recipe?
            if (method == "POST") {
                user.recipes[recipe.id] = recipe
                logger.info("Routes", req.method, req.originalUrl, `User ${username}`, `Updated recipe ${recipe.id}: ${recipe.title}`, `${recipe.conditions.length} conditions, ${recipe.actions.length} actions`)
            }
            // Deleting a recipe?
            else if (method == "DELETE") {
                delete user.recipes[recipeId]
                logger.info("Routes", req.method, req.originalUrl, `User ${username}`, `Deleted recipe ${recipeId}`)
            }
            // Invalid call.
            else {
                logger.error("Routes", req.method, req.originalUrl, `User ${username}`, `Recipe ${recipeId}`, `Invalid call: ${method}`)
                return webserver.renderError(req, res, "Invalid call", 400)
            }
        }

        // Update recipe count on user data.
        user.recipeCount = Object.keys(user.recipes).length

        // If user has no subscription yet, create one now.
        if (!user.stravaSubscription && user.recipeCount > 0) {
            try {
                await strava.webhooks.setSubscription(user)
            } catch (ex) {
                logger.error("Routes", req.method, req.originalUrl, `Could not create a Strava subscription (webhook) for ${user.displayName}`)
            }
        }

        await users.update(user, true)
        webserver.renderJson(req, res, recipe)
    } catch (ex) {
        logger.error("Routes", req.method, req.originalUrl, ex)
        webserver.renderError(req, res, ex, 500)
    }
}

/**
 * Add a new recipe to the user's automations.
 */
router.post("/:userId/recipes", routeUserRecipe)

/**
 * Delete the specified recipe from the user's automations.
 */
router.delete("/:userId/recipes/:recipeId", routeUserRecipe)

export = router
