// Strautomator API: User routes

import {paypal, recipes, strava, users, weather, RecipeData, RecipeStatsData, UserData, UserPreferences} from "strautomator-core"
import auth from "../auth"
import _ = require("lodash")
import express = require("express")
import moment = require("moment")
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
        if (!req.params) throw new Error("Missing request params")

        const userId = req.params.userId
        const user: UserData = (await auth.requestValidator(req, res, {userId: userId})) as UserData
        if (!user) return

        // DEPRECATED! Recipes with no order must have a default set now.
        let recipeCounter = 0
        for (let recipe of Object.values(user.recipes)) {
            if (!recipe.order) {
                recipe.order = recipeCounter
                recipeCounter++
            }
        }

        // Refresh profile from Strava?
        if (req.query && req.query.refresh) {
            const profile = await strava.athletes.getAthlete(user.stravaTokens)

            // Merge bikes and shoes.
            // Do not overwrite all gear details, as they won't have brand and model (coming from the athlete endpoint).
            // Merge the bikes and shoes instead.
            for (let bike of profile.bikes) {
                const existingBike = _.find(user.profile.bikes, {id: bike.id})
                if (existingBike) _.defaults(bike, existingBike)
            }
            for (let shoes of profile.shoes) {
                const existingShoes = _.find(user.profile.shoes, {id: shoes.id})
                if (existingShoes) _.defaults(shoes, existingShoes)
            }

            // Save updated profile on the database.
            const data: Partial<UserData> = {
                id: userId,
                profile: profile
            }
            users.update(data)

            // Update profile on current user.
            user.profile = profile
        }

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
        if (!req.params) throw new Error("Missing request params")

        const userId = req.params.userId
        const user: UserData = (await auth.requestValidator(req, res, {userId: userId})) as UserData
        if (!user) return

        // User has no subscription? Stop here.
        if (!user.subscription) {
            logger.error("Routes", req.method, req.originalUrl, "User has no valid subscription")
            return webserver.renderJson(req, res, "User has no valid subscription", 404)
        }

        // Subscribed as a friend, via PayPal, or via GitHub?
        if (user.subscription.source == "friend") {
            webserver.renderJson(req, res, {friend: user.subscription.enabled})
        } else if (user.subscription.source == "paypal") {
            const subscription = await paypal.subscriptions.getSubscription(user.subscription.id)
            subscription.userId = userId
            webserver.renderJson(req, res, {paypal: subscription})
        } else if (user.subscription.source == "github") {
            webserver.renderJson(req, res, {github: true})
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
        if (!req.params) throw new Error("Missing request params")

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
 * Update user preferences.
 */
router.post("/:userId/preferences", async (req, res) => {
    try {
        if (!req.params) throw new Error("Missing request params")

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

        // Make sure linksOn is valid.
        if (!_.isNil(req.body.linksOn)) {
            preferences.linksOn = req.body.linksOn
        }

        // Only PRO users can disable the linkback.
        if (preferences.linksOn == 0 && !user.isPro) {
            preferences.linksOn = settings.plans.free.linksOn
            logger.warn("Routes", req.method, req.originalUrl, `User ${user.id} not a PRO, linksOn changed from 0 to ${settings.plans.free.linksOn}`)
        }

        // Only PRO users can enable the FTP auto update.
        if (preferences.ftpAutoUpdate && !user.isPro) {
            preferences.ftpAutoUpdate = false
            logger.warn("Routes", req.method, req.originalUrl, `User ${user.id} not a PRO, FTP auto update force disabled`)
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

        logger.info("Routes", req.method, req.originalUrl, _.toPairs(preferences).join(" | "))
        webserver.renderJson(req, res, preferences)
    } catch (ex) {
        logger.error("Routes", req.method, req.originalUrl, ex)
        webserver.renderError(req, res, ex, 400)
    }
})

/**
 * Set user email address.
 */
router.post("/:userId/email", async (req, res) => {
    try {
        if (!req.params) throw new Error("Missing request params")

        const userId = req.params.userId
        const user: UserData = (await auth.requestValidator(req, res, {userId: userId})) as UserData
        if (!user) return

        const email = req.body.email ? req.body.email.trim() : null

        // Try updating the email address.
        await users.setEmail(user, email)

        logger.info("Routes", req.method, req.originalUrl)
        webserver.renderJson(req, res, {email: email})
    } catch (ex) {
        logger.error("Routes", req.method, req.originalUrl, ex)
        webserver.renderError(req, res, ex, 400)
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
        if (!req.params) throw new Error("Missing request params")

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

            const now = moment.utc().toDate()
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
 * Update the ordering of recipes for a user.
 */
router.post("/:userId/recipes/order", async (req, res) => {
    try {
        if (!req.params) throw new Error("Missing request params")

        const userId = req.params.userId
        const user: UserData = (await auth.requestValidator(req, res, {userId: userId})) as UserData
        if (!user) return

        const recipesOrder = req.body
        await users.setRecipesOrder(user, recipesOrder)

        logger.info("Routes", req.method, req.originalUrl)
        webserver.renderJson(req, res, {ok: true})
    } catch (ex) {
        logger.error("Routes", req.method, req.originalUrl, ex)
        webserver.renderError(req, res, ex, 500)
    }
})

/**
 * Get all the recipe stats for the user.
 */
router.get("/:userId/recipes/stats", async (req, res) => {
    try {
        if (!req.params) throw new Error("Missing request params")

        const userId = req.params.userId
        const user: UserData = (await auth.requestValidator(req, res, {userId: userId})) as UserData
        if (!user) return

        const arrStats = (await recipes.stats.getStats(user)) as RecipeStatsData[]

        logger.info("Routes", req.method, req.originalUrl)
        webserver.renderJson(req, res, arrStats)
    } catch (ex) {
        logger.error("Routes", req.method, req.originalUrl, ex)
        webserver.renderError(req, res, ex, 500)
    }
})

/**
 * Get a single recipe stats for the user.
 */
router.get("/:userId/recipes/stats/:recipeId", async (req, res) => {
    try {
        if (!req.params) throw new Error("Missing request params")

        const recipeId = req.params.recipeId
        const userId = req.params.userId
        const user: UserData = (await auth.requestValidator(req, res, {userId: userId})) as UserData
        if (!user) return

        if (!user.recipes[recipeId]) {
            throw new Error("Invalid recipe")
        }

        const stats = (await recipes.stats.getStats(user, user.recipes[recipeId])) as RecipeStatsData

        logger.info("Routes", req.method, req.originalUrl)
        webserver.renderJson(req, res, stats)
    } catch (ex) {
        logger.error("Routes", req.method, req.originalUrl, ex)
        webserver.renderError(req, res, ex, 500)
    }
})

/**
 * Update the counter for the specified recipe stats.
 */
router.post("/:userId/recipes/stats/:recipeId", async (req, res) => {
    try {
        if (!req.params) throw new Error("Missing request params")
        if (!req.body || !req.body.counter) throw new Error("Missing counter")

        const counter = req.body.counter
        const recipeId = req.params.recipeId
        const userId = req.params.userId
        const user: UserData = (await auth.requestValidator(req, res, {userId: userId})) as UserData
        if (!user) return

        if (!user.recipes[recipeId]) {
            throw new Error("Invalid recipe")
        }

        if (isNaN(counter)) {
            throw new Error("Counter is not a valid number")
        }

        await recipes.stats.setCounter(user, user.recipes[recipeId], parseInt(counter))

        logger.info("Routes", req.method, req.originalUrl)
        webserver.renderJson(req, res, {counter: counter})
    } catch (ex) {
        logger.error("Routes", req.method, req.originalUrl, ex)
        webserver.renderError(req, res, ex, 500)
    }
})

export = router
