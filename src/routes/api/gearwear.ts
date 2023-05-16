// Strautomator API: GearWear

import {gearwear, GearWearConfig, strava, UserData} from "strautomator-core"
import auth from "../auth"
import _ from "lodash"
import express = require("express")
import logger = require("anyhow")
import webserver = require("../../webserver")
const router: express.Router = express.Router()
const settings = require("setmeup").settings

// GEARWEAR
// --------------------------------------------------------------------------

/**
 * Get GearWear configurations for the user.
 */
router.get("/:userId", async (req: express.Request, res: express.Response) => {
    try {
        if (!req.params) throw new Error("Missing request params")

        const user: UserData = (await auth.requestValidator(req, res)) as UserData
        if (!user) return

        const gearwearConfigs = await gearwear.getForUser(user)

        // If a refresh query was passed, trigger an async call to
        // refresh gear details from Strava.
        if (req.query && req.query.refresh) {
            gearwear.refreshGearDetails(user)
        }

        logger.info("Routes", req.method, req.originalUrl)
        webserver.renderJson(req, res, gearwearConfigs)
    } catch (ex) {
        logger.error("Routes", req.method, req.originalUrl, ex)
        webserver.renderError(req, res, ex, 500)
    }
})

/**
 * Get the specified GearWear configuration.
 */
router.get("/:userId/:gearId", async (req: express.Request, res: express.Response) => {
    try {
        if (!req.params) throw new Error("Missing request params")

        const gearId = req.params.gearId
        const user: UserData = (await auth.requestValidator(req, res)) as UserData
        if (!user) return

        // Get GearWear config and gear details from Strava.
        const config = await gearwear.getById(gearId)
        const gear = await strava.athletes.getGear(user, gearId)

        // Stop here if owner of the specified gear is not the logged user.
        if (config && config.userId != user.id) {
            logger.error("Routes", req.method, req.originalUrl, `User ${user.id} has no access to GearWear ${gearId}`)
            return webserver.renderError(req, res, "No permissions to access this GearWear", 403)
        }

        logger.info("Routes", req.method, req.originalUrl)
        webserver.renderJson(req, res, {config: config, gear: gear})
    } catch (ex) {
        logger.error("Routes", req.method, req.originalUrl, ex)
        webserver.renderError(req, res, ex, 500)
    }
})

/**
 * Updated gearwear configuration for the specified GearWear.
 */
router.post("/:userId/:gearId", async (req: express.Request, res: express.Response) => {
    try {
        if (!req.params) throw new Error("Missing request params")

        const gearId = req.params.gearId
        const userId = req.params.userId
        const user: UserData = (await auth.requestValidator(req, res)) as UserData
        if (!user) return

        const max = settings.plans.free.maxGearWear
        let configs = await gearwear.getForUser(user)
        let existingConfig: GearWearConfig[] = _.remove(configs, {id: gearId})

        // Check if user has reached the limit of gearwear configs on free accounts.
        if (!user.isPro && configs.length >= max) {
            logger.error("Routes", req.method, req.originalUrl, `User ${user.id} reached limit of ${max} GearWear on free accounts`)
            return webserver.renderError(req, res, `Reached the limit of GearWear on free accounts`, 400)
        }

        const bike = _.find(user.profile.bikes, {id: gearId})
        const shoe = _.find(user.profile.shoes, {id: gearId})

        // Make sure gear exists on the user profile.
        if (!bike && !shoe) {
            logger.error("Routes", req.method, req.originalUrl, `User ${user.id} ${user.displayName}`, `Gear ${gearId} not found`)
            return webserver.renderError(req, res, "Gear not found", 404)
        }

        // Is it a GearWear config upate, or a reset distance request?
        if (!req.body.resetTracking) {
            const config = {
                id: gearId,
                userId: userId,
                components: req.body.components,
                updating: false
            }

            // Save GearWear configuration to the database.
            await gearwear.upsert(user, config)
        } else {
            const compName = req.body.resetTracking

            // Reset distance for the specified component.
            await gearwear.resetTracking(user, existingConfig[0], compName)
        }

        logger.info("Routes", req.method, req.originalUrl)
        webserver.renderJson(req, res, {ok: true})
    } catch (ex) {
        logger.error("Routes", req.method, req.originalUrl, ex)
        webserver.renderError(req, res, ex, 500)
    }
})

/**
 * Delete the specified GearWear configuration.
 */
router.delete("/:userId/:gearId", async (req: express.Request, res: express.Response) => {
    try {
        if (!req.params) throw new Error("Missing request params")

        const gearId = req.params.gearId
        const user: UserData = (await auth.requestValidator(req, res)) as UserData
        if (!user) return

        // Get GearWear config and check its owner.
        const config = await gearwear.getById(gearId)

        // GearWear does not exist? Log error.
        if (!config) {
            logger.error("Routes", req.method, req.originalUrl, `GearWear ${gearId} does not exist`)
            return webserver.renderJson(req, res, {deleted: false})
        }

        // Stop here if owner of the specified gear is not the logged user.
        if (config.userId != user.id) {
            logger.error("Routes", req.method, req.originalUrl, `User ${user.id} has no access to GearWear ${gearId}`)
            return webserver.renderError(req, res, "No permissions to access this GearWear", 403)
        }

        // Delete the GearWear from the database.
        await gearwear.delete(config)

        logger.info("Routes", req.method, req.originalUrl)
        webserver.renderJson(req, res, {deleted: true})
    } catch (ex) {
        logger.error("Routes", req.method, req.originalUrl, ex)
        webserver.renderError(req, res, ex, 500)
    }
})

export = router
