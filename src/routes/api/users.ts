// Strautomator API: User routes

import {paypal, recipes, strava, users, weather, RecipeData, RecipeStats, UserData, UserPreferences} from "strautomator-core"
import auth from "../auth"
import _ = require("lodash")
import express = require("express")
import logger = require("anyhow")
import webserver = require("../../webserver")
const router = express.Router()
const settings = require("setmeup").settings

// USER DATA
// --------------------------------------------------------------------------

/**
 * Get user by ID.
 */
router.get("/:userId", async (req, res) => {
    try {
        const userId = req.params.userId
        const user: UserData = (await auth.requestValidator(req, res, {userId: userId})) as UserData
        if (!user) return

        logger.info("Routes", req.method, req.originalUrl)
        webserver.renderJson(req, res, user)
    } catch (ex) {
        logger.error("Routes", req.method, req.originalUrl, ex)
        webserver.renderError(req, res, ex, 500)
    }
})

/**
 * Get subscription details for the passed user.
 */
router.get("/:userId/subscription", async (req, res) => {
    try {
        const userId = req.params.userId
        const user: UserData = (await auth.requestValidator(req, res, {userId: userId})) as UserData
        if (!user) return

        // User has no subscription? Stop here.
        if (!user.subscription) {
            logger.error("Routes", req.method, req.originalUrl, "User has no valid subscription")
            return webserver.renderJson(req, res, "User has no valid subscription", 404)
        }

        // Subscribed via PayPal or GitHub?
        if (user.subscription.source == "paypal") {
            const subscription = await paypal.subscriptions.getSubscription(user.subscription.id)
            subscription.userId = userId
            webserver.renderJson(req, res, {paypal: subscription})
        } else {
            webserver.renderJson(req, res, {github: null})
        }
    } catch (ex) {
        logger.error("Routes", req.method, req.originalUrl, ex)
        webserver.renderJson(req, res, {error: ex.toString()})
    }
})

/**
 * Delete user and cancel its pending jobs / webhooks.
 */
router.delete("/:userId", async (req, res) => {
    try {
        const userId = req.params.userId
        const user: UserData = (await auth.requestValidator(req, res, {userId: userId})) as UserData
        if (!user) return

        // Delete the user from the database.
        await users.delete(user)

        logger.info("Routes", req.method, req.originalUrl)
        webserver.renderJson(req, res, {deleted: true})
    } catch (ex) {
        logger.error("Routes", req.method, req.originalUrl, ex)
        webserver.renderError(req, res, ex, 500)
    }
})

// USER PREFERENCES
// --------------------------------------------------------------------------

/**
 * Updated user preferences.
 */
router.post("/:userId/preferences", async (req, res) => {
    try {
        const userId = req.params.userId
        const user: UserData = (await auth.requestValidator(req, res, {userId: userId})) as UserData
        if (!user) return

        const preferences: UserPreferences = {}

        // Make sure weather provider is valid.
        if (user.isPro && !_.isNil(req.body.weatherProvider)) {
            const weatherProvider = req.body.weatherProvider

            if (weatherProvider && _.map(weather.providers, "name").indexOf(weatherProvider) < 0) {
                logger.error("Routes", req.method, req.originalUrl, `Invalid weatherProvider: ${weatherProvider}`)
                return webserver.renderError(req, res, "Invalid weather provider", 400)
            }

            preferences.weatherProvider = weatherProvider
        }

        // Make sure weather unit is valid.
        if (!_.isNil(req.body.weatherUnit)) {
            preferences.weatherUnit = req.body.weatherUnit != "c" ? "f" : "c"
        }

        // Set activity hashtag preference?
        if (!_.isNil(req.body.activityHashtag)) {
            preferences.activityHashtag = req.body.activityHashtag ? true : false
        }

        // Set twitter share preference?
        if (!_.isNil(req.body.twitterShare)) {
            preferences.twitterShare = req.body.twitterShare ? true : false
        }

        // Set user data and save to the database.
        const data: Partial<UserData> = {
            id: userId,
            preferences: preferences
        }
        await users.update(data)

        logger.info("Routes", req.method, req.originalUrl, _.toPairs(preferences))
        webserver.renderJson(req, res, preferences)
    } catch (ex) {
        logger.error("Routes", req.method, req.originalUrl, ex)
        webserver.renderError(req, res, ex, 500)
    }
})

// USER ACTIVITIES
// --------------------------------------------------------------------------

/**
 * Get user's activities that were processed by Strautomator.
 */
router.get("/:userId/processed-activities", async (req, res) => {
    try {
        const userId = req.params.userId
        const user: UserData = (await auth.requestValidator(req, res, {userId: userId})) as UserData
        if (!user) return

        const activities = await strava.activities.getProcessedActivites(user, 10)

        logger.info("Routes", req.method, req.originalUrl)
        webserver.renderJson(req, res, activities)
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
            if (!user.isPro && user.recipes.length >= settings.plans.free.maxRecipes) {
                throw new Error(`User ${user.id} is not PRO and has reached the free acccount limit`)
            }

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

/**
 * Get recipe stats for the user.
 */
router.get("/:userId/recipes/stats", async (req, res) => {
    try {
        const userId = req.params.userId
        const user: UserData = (await auth.requestValidator(req, res, {userId: userId})) as UserData
        if (!user) return

        const arrStats = (await recipes.getStats(user)) as RecipeStats[]

        logger.info("Routes", req.method, req.originalUrl)
        webserver.renderJson(req, res, arrStats)
    } catch (ex) {
        logger.error("Routes", req.method, req.originalUrl, ex)
        webserver.renderError(req, res, ex, 500)
    }
})

export = router
