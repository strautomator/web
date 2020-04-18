// Strautomator: Scheduler

import {recipes, strava, users, RecipeData, UserData} from "strautomator-core"
import _ = require("lodash")
import logger = require("anyhow")
const settings = require("setmeup").settings

/**
 * Scheduler to manage update and dispatch jobs to Strava.
 */
class Scheduler {
    private constructor() {}
    private static _instance: Scheduler
    static get Instance(): Scheduler {
        return this._instance || (this._instance = new this())
    }

    /**
     * Timer to retry failed activity updates every few minutes.
     */
    private timerRetry = null

    /**
     * Holds a list of jobs to be retried.
     */
    failedJobs: FailedJob[] = []

    // INIT
    // --------------------------------------------------------------------------

    /**
     * Init the scheduler. Failed jobs will be checked once every minute.
     */
    init = async (): Promise<void> => {
        this.timerRetry = setInterval(this.retryJobs, 1000 * 60)
    }

    /**
     * Gracefully shutdown the Scheduler.
     */
    shutdown = async (): Promise<void> => {
        try {
            clearInterval(this.timerRetry)
            await this.retryJobs()
        } catch (ex) {
            logger.error("Scheduler.shutdown", ex)
        }
    }

    // ACTIVITIES
    // --------------------------------------------------------------------------

    /**
     * Process activity event pushed by Strava.
     * @param user The activity's owner (user).
     * @param activityId The activity's unique ID.
     */
    processActivity = async (user: UserData, activityId: number, retryCount?: number): Promise<void> => {
        logger.debug("StravaScheduler.processActivity", user.id, activityId)

        try {
            if (Object.keys(user.recipes).length == 0) {
                logger.info("Scheduler.processActivity", `User ${user.id} has no recipes, won't process activity ${activityId}`)
                return
            }

            // Retry count defaults to 0.
            if (!retryCount) {
                retryCount = 0
            }

            let recipeIds = []

            // Get activity details from Strava.
            let activity = await strava.getActivity(user.stravaTokens, activityId)
            let recipe: RecipeData

            // Evaluate each of user's recipes, and set update to true if something was processed.
            for (recipe of Object.values(user.recipes)) {
                if (await recipes.evaluate(user, recipe.id, activity)) {
                    recipeIds.push(recipe.id)
                }
            }

            // Activity updated? Save to Strava and increment activity counter.
            if (recipeIds.length > 0) {
                await strava.setActivity(user.stravaTokens, activity)

                try {
                    await strava.saveProcessedActivity(user, activity, recipeIds)
                    await users.setActivityCount(user)
                } catch (ex) {
                    logger.error("Scheduler.processActivity", `User ${user.id}`, `Activity ${activityId}`, ex)
                }
            }
        } catch (ex) {
            if (retryCount < settings.scheduled.maxRetry) {
                this.failedJobs.push({
                    user: user,
                    activityId: activityId,
                    timestamp: new Date().getTime(),
                    retryCount: retryCount
                })
                logger.warn("Scheduler.processActivity", `User ${user.id}`, `Activity ${activityId}`, `Failed, will try again soon`)
            } else {
                logger.error("Scheduler.processActivity", `User ${user.id}`, `Activity ${activityId}`, ex)
            }
        }
    }

    /**
     * Process failed jobs again.
     */
    retryJobs = async (): Promise<void> => {
        if (this.failedJobs.length == 0) {
            logger.debug("Scheduler.retryJobs", "No failed jobs to retry")
            return
        }

        const now = new Date().getTime()
        const minTimestamp = now - settings.scheduler.retryAfter * 1000

        // Filter jobs that have waited long enough.
        const jobs = _.remove(this.failedJobs, (j) => j.timestamp <= minTimestamp)

        // Iterate jobs to try again.
        for (let job of jobs) {
            try {
                await this.processActivity(job.user, job.activityId, job.retryCount + 1)
            } catch (ex) {
                logger.error("Scheduler.retryJobs", `User ${job.user.id}`, `Activity ${job.activityId}`, ex)
            }
        }
    }
}

/**
 * Ativity
 */
interface FailedJob {
    /** Owner of the activity. */
    user: UserData
    /** The activity ID. */
    activityId: number
    /** Timestamp. */
    timestamp: number
    /** How many retries. */
    retryCount: number
}

// Exports...
export = Scheduler.Instance
