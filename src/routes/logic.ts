// Shared handlers used by the HTTP API and the MCP tools.

import {fitparser, gearwear, logHelper, recipes, strava, users, RecipeData, RecipeStatsData, StravaProcessedActivity, UserData} from "strautomator-core"
import {validateRecipeWebhookActions} from "../utils/urls"
import dayjs from "../dayjs"
import _ from "lodash"
import logger from "anyhow"
const settings = require("setmeup").settings

// USER
// --------------------------------------------------------------------------

/**
 * Public user payload returned by GET /api/users/:userId.
 */
export const getPublicUser = async (user: UserData, refresh?: boolean): Promise<any> => {
    let recipeCounter = 0
    for (let recipe of Object.values(user.recipes)) {
        if (!recipe.order) {
            recipe.order = recipeCounter
            recipeCounter++
        }
    }

    if (refresh) {
        const profile = await strava.athletes.getAthlete(user.stravaTokens)

        for (let bike of profile.bikes) {
            const existingBike = _.find(user.profile.bikes, {id: bike.id})
            if (existingBike) _.defaults(bike, existingBike)
        }
        for (let shoes of profile.shoes) {
            const existingShoes = _.find(user.profile.shoes, {id: shoes.id})
            if (existingShoes) _.defaults(shoes, existingShoes)
        }

        const data: Partial<UserData> = {
            id: user.id,
            profile: profile,
            displayName: user.preferences.privacyMode ? user.displayName : profile.username || profile.firstName || profile.lastName
        }
        users.update(data)
        user.profile = profile
    }

    const result = _.cloneDeep(user)
    if (result.confirmEmail) {
        result.confirmEmail = result.confirmEmail.substring(result.confirmEmail.indexOf(":") + 1)
    }
    if (result.garmin) {
        delete result.garmin.tokens
    }
    if (result.wahoo) {
        delete result.wahoo.tokens
    }
    if (result.spotify) {
        delete result.spotify.tokens
    }

    return result
}

// RECIPES
// --------------------------------------------------------------------------

/**
 * Create, update or delete a user automation (same as POST/DELETE /api/users/:userId/recipes).
 */
export const upsertUserRecipe = async (user: UserData, recipeInput: any, method: string, recipeId?: string): Promise<RecipeData> => {
    const id: string = recipeId || recipeInput?.id
    const recipe: RecipeData = recipeInput?.title ? recipeInput : user.recipes[id]
    if (!recipe) {
        throw Object.assign(new Error(`Recipe ${id} not found`), {status: 404})
    }

    const asJson = recipe ? recipe["asJson"] || false : false
    if (asJson) {
        delete recipe["asJson"]
    }

    if (method != "DELETE") {
        try {
            recipes.validate(user, recipe)
            validateRecipeWebhookActions(recipe)
        } catch (ex) {
            if (asJson && ex.message) {
                ex.message += " (recipe edited as JSON)"
            }
            ex.status = 400
            throw ex
        }
    }

    if (recipe.conditions?.length <= 2 && recipe.samePropertyOp) {
        delete recipe.samePropertyOp
    }

    const operatorLog = !recipe.samePropertyOp || recipe.op == recipe.samePropertyOp ? recipe.op : `${recipe.samePropertyOp} ${recipe.op}`

    if (!recipe.id && method == "POST") {
        if (!user.isPro && user.recipeCount >= settings.plans.free.maxRecipes) {
            throw Object.assign(new Error(`Maximum of ${settings.plans.free.maxRecipes} automations allowed on the free plan`), {status: 402})
        }

        recipe.id = recipes.generateId()
        user.recipes[recipe.id] = recipe
        logger.info("Routes.users", logHelper.user(user), `New recipe ${recipe.id}: ${recipe.title}`, operatorLog, `${recipe.conditions.length} conditions, ${recipe.actions.length} actions`)
    } else {
        const existingRecipe = user.recipes[id]
        if (!existingRecipe) {
            throw Object.assign(new Error(`Recipe ${id} not found`), {status: 404})
        }

        if (method == "POST") {
            user.recipes[recipe.id] = recipe
            logger.info("Routes.users", logHelper.user(user), `Updated recipe ${recipe.id}: ${recipe.title}`, operatorLog, `${recipe.conditions.length} conditions, ${recipe.actions.length} actions`)
        } else if (method == "DELETE") {
            delete user.recipes[id]
            logger.info("Routes.users", logHelper.user(user), `Deleted recipe ${recipeId || id}: ${recipe.title}`)
        } else {
            throw Object.assign(new Error(`Invalid method for recipe ${id}`), {status: 405})
        }
    }

    if (user.suspended) {
        user.suspended = false
    }

    user.recipeCount = Object.keys(user.recipes).length
    await users.update(user, true)
    return recipe
}

/**
 * Automation stats returned by GET /api/users/:userId/recipes/stats[/:recipeId].
 */
export const getRecipeStats = async (user: UserData, recipeId?: string): Promise<RecipeStatsData | RecipeStatsData[]> => {
    if (recipeId) {
        if (!user.recipes[recipeId]) {
            throw new Error(`Invalid recipe: ${recipeId}`)
        }
        return (await recipes.stats.getStats(user, user.recipes[recipeId])) as RecipeStatsData
    }

    const arrStats = (await recipes.stats.getStats(user)) as RecipeStatsData[]
    arrStats.forEach((s) => delete s.activities)
    return arrStats
}

// STRAVA
// --------------------------------------------------------------------------

/**
 * Processed activities returned by GET /api/strava/:userId/processed-activities.
 */
export const getProcessedActivities = async (user: UserData, query?: {limit?: any; from?: any; to?: any}): Promise<StravaProcessedActivity[]> => {
    const limit: number = query?.limit ? parseInt(query.limit as string) : null
    const dateFrom: Date = query?.from ? dayjs(query.from.toString()).startOf("day").toDate() : null
    const dateTo: Date = query?.to ? dayjs(query.to.toString()).endOf("day").toDate() : null

    const activities = await strava.activityProcessing.getProcessedActivities(user, dateFrom, dateTo, limit)

    if (user.garmin) {
        const getGarminActivity = async (activity: StravaProcessedActivity) => {
            const garminActivity = await fitparser.getMatchingActivity(user, activity, "garmin")
            if (garminActivity) {
                activity.garminActivity = garminActivity
            }
        }
        await Promise.allSettled(activities.map(getGarminActivity))
    }
    if (user.wahoo) {
        const getWahooActivity = async (activity: StravaProcessedActivity) => {
            const wahooActivity = await fitparser.getMatchingActivity(user, activity, "wahoo")
            if (wahooActivity) {
                activity.wahooActivity = wahooActivity
            }
        }
        await Promise.allSettled(activities.map(getWahooActivity))
    }

    return activities
}

/**
 * Save estimated FTP, same as POST /api/strava/:userId/ftp/estimate.
 */
export const saveEstimatedFtp = async (user: UserData, ftp?: number): Promise<any> => {
    const estimation = await strava.performance.estimateFtp(user)
    if (ftp && ftp > 0) {
        estimation.ftpWatts = parseInt(ftp as any)
    }

    const updated = await strava.performance.saveFtp(user, estimation)
    return updated ? {ftp: estimation.ftpWatts} : false
}

// GEARWEAR
// --------------------------------------------------------------------------

/**
 * GearWear list returned by GET /api/gearwear/:userId.
 */
export const getGearwearByUser = async (user: UserData, refresh?: boolean): Promise<any> => {
    const result: any = {}
    result.configs = await gearwear.getByUser(user)

    if (user.isPro && (user.garmin?.id || user.wahoo?.id)) {
        const batteryTracker = await gearwear.getBatteryTracker(user)
        if (batteryTracker) {
            result.batteryTracker = batteryTracker
        }
    }

    if (refresh) {
        gearwear.refreshGearDetails(user)
    }

    return result
}

/**
 * Single GearWear payload returned by GET /api/gearwear/:userId/:gearId.
 */
export const getGearwearById = async (user: UserData, gearId: string): Promise<any> => {
    const config = await gearwear.getById(gearId)
    const gear = await strava.athletes.getGear(user, gearId)

    if (config && config.userId != user.id) {
        throw Object.assign(new Error(`${logHelper.user(user)} has no access to GearWear ${gearId}`), {status: 403})
    }

    return {config: config, gear: gear}
}
