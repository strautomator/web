// Strautomator API: GearWear

import {logHelper, gearwear, GearWearConfig, strava, UserData} from "strautomator-core"
import auth from "../auth"
import _ from "lodash"
import express = require("express")
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

        const result: any = {}
        const gearwearConfigs = await gearwear.getByUser(user)
        result.configs = gearwearConfigs

        // Also get battery tracker for PRO users.
        if (user.isPro && (user.garmin?.id || user.wahoo?.id)) {
            const batteryTracker = await gearwear.getBatteryTracker(user)
            if (batteryTracker) {
                result.batteryTracker = batteryTracker
            }
        }

        // If a refresh query was passed, trigger an async call to
        // refresh gear details from Strava.
        if (req.query?.refresh) {
            gearwear.refreshGearDetails(user)
        }

        webserver.renderJson(req, res, result)
    } catch (ex) {
        webserver.renderError(req, res, ex)
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
            return webserver.renderError(req, res, `${logHelper.user(user)} has no access to GearWear ${gearId}`, 403)
        }

        webserver.renderJson(req, res, {config: config, gear: gear})
    } catch (ex) {
        webserver.renderError(req, res, ex)
    }
})

/**
 * Update configuration for the specified GearWear.
 */
router.post("/:userId/:gearId", async (req: express.Request, res: express.Response) => {
    try {
        if (!req.params) throw new Error("Missing request params")

        const gearId = req.params.gearId
        const userId = req.params.userId
        const user: UserData = (await auth.requestValidator(req, res)) as UserData
        if (!user) return

        const max = settings.plans.free.maxGearWear
        let configs = await gearwear.getByUser(user)
        let existingConfig: GearWearConfig = _.find(configs, {id: gearId})

        // Check if user has reached the limit of gearwear configs on free accounts.
        if (!user.isPro && !existingConfig && configs.length >= max) {
            return webserver.renderError(req, res, `${logHelper.user(user)} reached limit of ${max} GearWear on free accounts`, 400)
        }

        // Reenabling the gear config?
        if (req.body.disabled === false && existingConfig.disabled) {
            await gearwear.reEnable(user, existingConfig)
            return webserver.renderJson(req, res, {ok: true})
        }

        // Make sure gear exists on the user profile.
        const bike = _.find(user.profile.bikes, {id: gearId})
        const shoe = _.find(user.profile.shoes, {id: gearId})
        if (!bike && !shoe) {
            return webserver.renderError(req, res, `Gear ${gearId} for user ${userId} not found`, 404)
        }

        // Is it a GearWear config update, or a reset distance request?
        if (!req.body.resetTracking) {
            const config = {
                id: gearId,
                userId: userId,
                components: req.body.components,
                updating: false
            }

            // Save GearWear configuration to the database.
            await gearwear.upsert(user, config)
        } else if (existingConfig) {
            const compName = req.body.resetTracking

            // Reset distance for the specified component.
            await gearwear.resetTracking(user, existingConfig, compName)
        } else {
            return webserver.renderError(req, res, `No configuration found for gear ${gearId}`, 404)
        }

        webserver.renderJson(req, res, {ok: true})
    } catch (ex) {
        webserver.renderError(req, res, ex)
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
            return webserver.renderError(req, res, `GearWear ${gearId} for user ${user.id} does not exist`, 404)
        }

        // Stop here if owner of the specified gear is not the logged user.
        if (config.userId != user.id) {
            return webserver.renderError(req, res, `${logHelper.user(user)} has no access to GearWear ${gearId}`, 403)
        }

        // Delete the GearWear from the database.
        await gearwear.delete(config)
        webserver.renderJson(req, res, {deleted: true})
    } catch (ex) {
        webserver.renderError(req, res, ex)
    }
})

/**
 * Delete the specified device from the list of devices of the battery tracker.
 */
router.delete("/:userId/battery-tracker/:deviceId", async (req: express.Request, res: express.Response) => {
    try {
        if (!req.params) throw new Error("Missing request params")

        const user: UserData = (await auth.requestValidator(req, res)) as UserData
        if (!user) return

        // Delete the device from the battery tracker.
        await gearwear.deleteBatteryTrackerDevice(user, req.params.deviceId)
        webserver.renderJson(req, res, {deleted: true})
    } catch (ex) {
        webserver.renderError(req, res, ex)
    }
})

export = router
