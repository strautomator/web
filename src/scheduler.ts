// Strautomator: Scheduler

import {recipes, strava, users, RecipeData, StravaWebhook, UserData} from "strautomator-core"
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
     * Timer to check and reset subscriptions (webhooks) on Strava.
     */
    private timerSubscriptions = null

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
        this.timerSubscriptions = setInterval(this.checkSubscriptions, 1000 * 60 * 60 * 24)
        this.timerRetry = setInterval(this.retryJobs, 1000 * 60)

        // Check Strava subscriptions with a 1 minute delay.
        setTimeout(this.checkSubscriptions, 60000)
    }

    /**
     * Gracefully shutdown the Scheduler.
     */
    shutdown = async (): Promise<void> => {
        try {
            clearInterval(this.timerSubscriptions)
            clearInterval(this.timerRetry)
            await this.retryJobs()
        } catch (ex) {
            logger.error("Scheduler.shutdown", ex)
        }
    }

    // STRAVA SUBSCRIPTIONS
    // --------------------------------------------------------------------------

    /**
     * Periodically check user subscriptions and renew them, if needed.
     */
    checkSubscriptions = async (): Promise<void> => {
        try {
            const subscriptions = await strava.getSubscriptions()
            const idleUsers = await users.getIdle()

            logger.info("Scheduler.checkSubscriptions", `${subscriptions.length} webhooks`, `${idleUsers.length} idle users`)

            // Iterate users and make sure subscriptions are active.
            for (let user of idleUsers) {
                try {
                    let sub: StravaWebhook

                    // Find correct subscription for the user.
                    for (let s of subscriptions) {
                        if (s.id == user.stravaSubscription) {
                            sub = s
                            break
                        } else if (s.callbackUrl.indexOf(`${settings.strava.api.urlToken}/${user.id}`) > 0) {
                            logger.warn("Scheduler.checkSubscriptions", `User ${user.id} - ${user.displayName}`, `Wrong subscription ID ${user.stravaSubscription}, correct is ${s.id}`)
                            sub = s
                            break
                        }
                    }

                    // Reset subscription if it's not valid.
                    if (!sub) {
                        logger.info("Scheduler.checkSubscriptions", `User ${user.id} - ${user.displayName}`, `Subscription ${user.stravaSubscription || "empty"}`, `Needs renewal`)
                        await strava.setSubscription(user)
                    } else {
                        logger.debug("Scheduler.checkSubscriptions", `User ${user.id} - ${user.displayName}`, `Subscription ${user.stravaSubscription} is active`)
                    }
                } catch (ex) {
                    logger.debug("Sccheduler.checkSubscriptions", `User ${user.id} - ${user.displayName}`, user.stravaSubscription, "Failed", ex)
                }
            }
        } catch (ex) {
            logger.error("Scheduler.checkSubscriptions", ex)
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
