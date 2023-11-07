// Strautomator API: Users

import {logHelper, gdpr, openai, recipes, subscriptions, strava, users, RecipeData, RecipeStatsData, UserData, UserPreferences} from "strautomator-core"
import auth from "../auth"
import dayjs from "../../dayjs"
import _ from "lodash"
import express = require("express")
import logger from "anyhow"
import webserver = require("../../webserver")
const router: express.Router = express.Router()
const settings = require("setmeup").settings

// USER DATA
// --------------------------------------------------------------------------

/**
 * Get user by ID.
 */
router.get("/:userId", async (req: express.Request, res: express.Response) => {
    try {
        if (!req.params) throw new Error("Missing request params")

        const userId = req.params.userId
        const user: UserData = (await auth.requestValidator(req, res)) as UserData
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
        if (req.query?.refresh) {
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
                profile: profile,
                displayName: profile.username || profile.firstName || profile.lastName || "strava-user"
            }
            users.update(data)

            // Update profile on current user.
            user.profile = profile
        }

        // Clone user object and remove 3rd party sensitive data.
        const result = _.cloneDeep(user)
        if (result.garmin) {
            delete result.garmin.tokens
        }
        if (result.spotify) {
            delete result.spotify.tokens
        }

        webserver.renderJson(req, res, result)
    } catch (ex) {
        webserver.renderError(req, res, ex)
    }
})

/**
 * Get subscription details for the passed user.
 */
router.get("/:userId/subscription", async (req: express.Request, res: express.Response) => {
    try {
        if (!req.params) throw new Error("Missing request params")

        const user: UserData = (await auth.requestValidator(req, res)) as UserData
        if (!user) return

        // User has no subscription? Stop here.
        if (!user.subscriptionId) {
            return webserver.renderError(req, res, "User has no valid subscription", 404)
        }

        let subscription = await subscriptions.getById(user.subscriptionId)
        if (!subscription) {
            return webserver.renderError(req, res, "User subscription was not found", 404)
        }

        webserver.renderJson(req, res, subscription)
    } catch (ex) {
        webserver.renderError(req, res, ex)
    }
})

/**
 * Delete user and cancel its pending jobs / webhooks.
 */
router.delete("/:userId", async (req: express.Request, res: express.Response) => {
    try {
        if (!req.params) throw new Error("Missing request params")

        const user: UserData = (await auth.requestValidator(req, res)) as UserData
        if (!user) return

        // Delete the user from the database.
        await users.delete(user)
        webserver.renderJson(req, res, {deleted: true})
    } catch (ex) {
        webserver.renderError(req, res, ex)
    }
})

// USER PREFERENCES
// --------------------------------------------------------------------------

/**
 * Update user preferences.
 */
router.post("/:userId/preferences", async (req: express.Request, res: express.Response) => {
    try {
        if (!req.params) throw new Error("Missing request params")

        const user: UserData = (await auth.requestValidator(req, res)) as UserData
        if (!user) return

        const preferences: UserPreferences = {}

        // Make sure preferences were set to avoid clearing it from the user data.
        if (Object.keys(req.body).length == 0) {
            logger.warn("Routes.users", logHelper.user(user), "Empty request body was sent, preferences not saved")
            return webserver.renderJson(req, res, user.preferences)
        }

        // Helper to validate if preference has changed.
        const preferenceChanged = (field: string) => !_.isNil(req.body[field]) && req.body[field] !== user.preferences[field]

        // Make sure weather provider is valid.
        if (preferenceChanged("weatherProvider") && user.isPro) {
            preferences.weatherProvider = req.body.weatherProvider
        }

        // Make sure ftpAutoUpdate is valid.
        if (preferenceChanged("ftpAutoUpdate") && user.isPro) {
            preferences.ftpAutoUpdate = req.body.ftpAutoUpdate ? true : false
        }

        // Make sure linksOn is valid.
        if (preferenceChanged("linksOn")) {
            preferences.linksOn = req.body.linksOn
        }

        // Make sure weather unit is valid.
        if (preferenceChanged("weatherUnit")) {
            preferences.weatherUnit = req.body.weatherUnit != "c" ? "f" : "c"
        }

        // Make sure wind speed unit is valid.
        if (preferenceChanged("windSpeedUnit") && ["m/s", "kph", "mph"].includes(req.body.windSpeedUnit)) {
            preferences.windSpeedUnit = req.body.windSpeedUnit
        }

        // Make sure language is valid.
        if (preferenceChanged("language")) {
            preferences.language = req.body.language.toString().substring(0, 2)
        }

        // Set activity hashtag preference?
        if (preferenceChanged("activityHashtag")) {
            preferences.activityHashtag = req.body.activityHashtag ? true : false
        }

        // Set delayed processing preference?
        if (preferenceChanged("delayedProcessing")) {
            preferences.delayedProcessing = req.body.delayedProcessing ? true : false
        }

        // Set GearWear delay preference?
        if (preferenceChanged("gearwearDelayDays")) {
            preferences.gearwearDelayDays = req.body.gearwearDelayDays
        }

        // Set privacy mode?
        if (preferenceChanged("privacyMode")) {
            preferences.privacyMode = req.body.privacyMode ? true : false
        }

        // Set the omit suffixes preference?
        if (preferenceChanged("noSuffixes")) {
            preferences.noSuffixes = req.body.noSuffixes ? true : false
        }

        // Set counter reset date?
        if (preferenceChanged("dateResetCounter")) {
            if (req.body.dateResetCounter) {
                const dateResetCounter = dayjs(`2000-${req.body.dateResetCounter}`)

                if (!dateResetCounter.isValid()) {
                    return webserver.renderError(req, res, `Invalid counter reset date: ${req.body.dateResetCounter}`, 400)
                }

                preferences.dateResetCounter = req.body.dateResetCounter
            } else {
                preferences.dateResetCounter = false
            }
        }

        // Set the ChatGPT custom prompt? Make sure it ends with a period and passes the OpenAI moderation.
        if (preferenceChanged("chatGptPrompt") && user.isPro && user.isBeta) {
            const lastChar = req.body.chatGptPrompt.substring(req.body.chatGptPrompt.length - 1)
            if (![".", "!", "?"].includes(lastChar)) {
                req.body.chatGptPrompt += "."
            }
            const failedCategories = await openai.validatePrompt(user, req.body.chatGptPrompt)
            if (failedCategories?.length > 0) {
                throw new Error(`ChatGPt prompt failed moderation: ${failedCategories.join(", ")}`)
            }
            preferences.chatGptPrompt = req.body.chatGptPrompt.substring(0, 100).trim()
        }

        // User details to be updated.
        const data: Partial<UserData> = {
            id: user.id,
            displayName: user.displayName,
            isPro: user.isPro,
            preferences: preferences
        }

        // Validate user preferences.
        users.validatePreferences(data)

        // User has switched to privacy mode? Anonymize it.
        if (!user.preferences.privacyMode && preferences.privacyMode) {
            users.anonymize(data)
        } else if (user.preferences.privacyMode && !preferences.privacyMode) {
            user.profile = await strava.athletes.getAthlete(user.stravaTokens)
        }

        await users.update(data)
        webserver.renderJson(req, res, preferences)
    } catch (ex) {
        webserver.renderError(req, res, ex, 400)
    }
})

/**
 * Set user email address.
 */
router.post("/:userId/email", async (req: express.Request, res: express.Response) => {
    try {
        if (!req.params) throw new Error("Missing request params")

        const user: UserData = (await auth.requestValidator(req, res)) as UserData
        if (!user) return

        const email = req.body.email ? req.body.email.trim() : null

        // Try updating the email address.
        await users.setEmail(user, email)
        webserver.renderJson(req, res, {email: email})
    } catch (ex) {
        webserver.renderError(req, res, ex, 400)
    }
})

/**
 * Reset the user's URL token.
 */
router.post("/:userId/url-token", async (req: express.Request, res: express.Response) => {
    try {
        if (!req.params || !req.body) throw new Error("Missing request params")

        const user: UserData = (await auth.requestValidator(req, res)) as UserData
        if (!user) return

        // Validate existing token.
        const oldToken = req.body.urlToken
        if (oldToken != user.urlToken) {
            throw new Error(`The passed URL token does not match the existing one`)
        }

        // Generate a new URL token.
        const newToken = await users.setUrlToken(user)
        webserver.renderJson(req, res, {urlToken: newToken})
    } catch (ex) {
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

        const userId = req.params.userId
        const validated = await auth.requestValidator(req, res)
        if (!validated) return

        let recipe: RecipeData = req.body
        const recipeId = req.params.recipeId || recipe.id
        const user: UserData = await users.getById(userId)
        const asJson = recipe ? recipe["asJson"] || false : false

        if (asJson) {
            delete recipe["asJson"]
        }

        // Make sure recipe was sent in the correct format.
        if (req.method != "DELETE") {
            try {
                recipes.validate(user, recipe)
            } catch (ex) {
                if (asJson && ex.message) {
                    ex.message += " (recipe edited as JSON)"
                }

                return webserver.renderError(req, res, ex, 400)
            }
        }

        // User not found?
        if (!user) {
            return webserver.renderError(req, res, `User ${userId} not found`, 404)
        }

        // If 2 conditions or less, we don't need to set a value for samePropertyOp, as we only use the default op.
        if (recipe.conditions?.length <= 2 && recipe.samePropertyOp) {
            delete recipe.samePropertyOp
        }

        const operatorLog = !recipe.samePropertyOp || recipe.op == recipe.samePropertyOp ? recipe.op : `${recipe.samePropertyOp} ${recipe.op}`

        // Creating a new recipe?
        if (!recipe.id && req.method == "POST") {
            if (!user.isPro && user.recipeCount >= settings.plans.free.maxRecipes) {
                return webserver.renderError(req, res, `Maximum of ${settings.plans.free.maxRecipes} automations allowed on the free plan`, 402)
            }

            const now = dayjs.utc().toDate()
            const hex = Math.round(now.getTime() / 1000).toString(16)
            recipe.id = "r" + hex.toLowerCase()

            // Add to user's recipe list.
            user.recipes[recipe.id] = recipe
            logger.info("Routes.users", logHelper.user(user), `New recipe ${recipe.id}: ${recipe.title}`, operatorLog, `${recipe.conditions.length} conditions, ${recipe.actions.length} actions`)
        } else {
            const existingRecipe = user.recipes[recipeId]

            // Recipe not found?
            if (!existingRecipe) {
                return webserver.renderError(req, res, `Recipe ${recipeId} not found`, 404)
            }

            // Updating an existing recipe?
            if (req.method == "POST") {
                user.recipes[recipe.id] = recipe
                logger.info("Routes.users", logHelper.user(user), `Updated recipe ${recipe.id}: ${recipe.title}`, operatorLog, `${recipe.conditions.length} conditions, ${recipe.actions.length} actions`)
            }
            // Deleting a recipe?
            else if (req.method == "DELETE") {
                delete user.recipes[recipeId]
                logger.info("Routes.users", logHelper.user(user), `Deleted recipe ${recipeId}: ${recipe.title}`)
            }
            // Invalid call.
            else {
                return webserver.renderError(req, res, `Invalid method for recipe ${recipeId}`, 405)
            }
        }

        // User was recently suspended? Unset the flag.
        if (user.suspended) {
            user.suspended = false
        }

        // Update recipe count on user data.
        user.recipeCount = Object.keys(user.recipes).length
        await users.update(user, true)
        webserver.renderJson(req, res, recipe)
    } catch (ex) {
        webserver.renderError(req, res, ex)
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
router.post("/:userId/recipes/order", async (req: express.Request, res: express.Response) => {
    try {
        if (!req.params) throw new Error("Missing request params")

        const user: UserData = (await auth.requestValidator(req, res)) as UserData
        if (!user) return

        const recipesOrder = req.body
        await users.setRecipesOrder(user, recipesOrder)

        webserver.renderJson(req, res, {ok: true})
    } catch (ex) {
        webserver.renderError(req, res, ex)
    }
})

/**
 * Get all the recipe stats for the user.
 */
router.get("/:userId/recipes/stats", async (req: express.Request, res: express.Response) => {
    try {
        if (!req.params) throw new Error("Missing request params")

        const user: UserData = (await auth.requestValidator(req, res)) as UserData
        if (!user) return

        const arrStats = (await recipes.stats.getStats(user)) as RecipeStatsData[]

        // We don't need full list of activity IDs sent to the client.
        arrStats.forEach((s) => delete s.activities)
        webserver.renderJson(req, res, arrStats)
    } catch (ex) {
        webserver.renderError(req, res, ex)
    }
})

/**
 * Get a single recipe stats for the user.
 */
router.get("/:userId/recipes/stats/:recipeId", async (req: express.Request, res: express.Response) => {
    try {
        if (!req.params) throw new Error("Missing request params")

        const recipeId = req.params.recipeId
        const user: UserData = (await auth.requestValidator(req, res)) as UserData
        if (!user) return

        if (!user.recipes[recipeId]) {
            throw new Error(`Invalid recipe: ${recipeId}`)
        }

        const stats = (await recipes.stats.getStats(user, user.recipes[recipeId])) as RecipeStatsData
        webserver.renderJson(req, res, stats)
    } catch (ex) {
        webserver.renderError(req, res, ex)
    }
})

/**
 * Update the counter for the specified recipe stats.
 */
router.post("/:userId/recipes/stats/:recipeId", async (req: express.Request, res: express.Response) => {
    try {
        if (!req.params) throw new Error("Missing request params")
        if (!req.body || !req.body.counter) throw new Error("Missing counter")

        const counter = req.body.counter
        const recipeId = req.params.recipeId
        const user: UserData = (await auth.requestValidator(req, res)) as UserData
        if (!user) return

        if (!user.recipes[recipeId]) {
            throw new Error(`Invalid recipe: ${recipeId}`)
        }

        if (isNaN(counter)) {
            throw new Error(`Counter is not a valid number: ${counter}`)
        }

        await recipes.stats.setCounter(user, user.recipes[recipeId], parseInt(counter))
        webserver.renderJson(req, res, {counter: counter})
    } catch (ex) {
        webserver.renderError(req, res, ex)
    }
})

// GDPR
// --------------------------------------------------------------------------

/**
 * User wants to download an archive of its full data.
 */
router.get("/:userId/archive-download", async (req: express.Request, res: express.Response) => {
    try {
        if (!req.params) throw new Error("Missing request params")

        const user: UserData = (await auth.requestValidator(req, res)) as UserData
        if (!user) return

        const archiveUrl = await gdpr.generateArchive(user)

        if (!archiveUrl) {
            throw new Error("Could not generate archive, please try again in a few hours")
        }

        webserver.renderJson(req, res, {url: archiveUrl})
    } catch (ex) {
        webserver.renderError(req, res, ex)
    }
})

export = router
