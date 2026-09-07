// Strautomator MCP tools (wrap existing core / API behaviour)

import {database, fitparser, gearwear, notifications, recipes, strava, subscriptions, users, UserData, RecipeData} from "strautomator-core"
import {validateRecipeWebhookActions} from "../utils/urls"
import {sanitizeActivity, sanitizeUser, toolError, toolResult} from "./utils"
import dayjs from "../dayjs"
import _ from "lodash"
import logger from "anyhow"
const settings = require("setmeup").settings
const packageVersion = require("../../package.json").version

type ToolHandler = (user: UserData, args: any) => Promise<any>

interface ToolDef {
    name: string
    description: string
    inputSchema: any
    handler: ToolHandler
}

const requireNumber = (value: any, label: string): number => {
    const parsed = typeof value == "number" ? value : parseInt(value, 10)
    if (!Number.isFinite(parsed)) {
        throw new Error(`Invalid ${label}`)
    }
    return parsed
}

const tools: ToolDef[] = [
    {
        name: "get_account",
        description: "Get the authenticated Strautomator user profile, preferences, subscription flags and linked accounts. Secrets and API tokens are omitted.",
        inputSchema: {type: "object", properties: {}, additionalProperties: false},
        handler: async (user) => {
            const result = sanitizeUser(user)
            if (user.subscriptionId) {
                try {
                    result.subscription = await subscriptions.getById(user.subscriptionId)
                } catch (ex) {
                    logger.warn("McpTools.get_account", user.id, "Failed to load subscription", ex)
                }
            }
            return result
        }
    },
    {
        name: "list_recent_activities",
        description: "List recent Strava activities for the authenticated user. Defaults to the last 10 activities from the past 21 days (max 50, lookback capped at 30 days).",
        inputSchema: {
            type: "object",
            properties: {
                limit: {type: "number", description: "Max activities to return (default 10, max 50)"},
                since: {type: "number", description: "Unix timestamp to start from"}
            },
            additionalProperties: false
        },
        handler: async (user, args) => {
            let limit = args.limit ? requireNumber(args.limit, "limit") : 10
            if (limit > 50) limit = 50
            if (limit < 1) limit = 1

            let dateFrom = args.since ? dayjs.unix(requireNumber(args.since, "since")) : dayjs().subtract(21, "days")
            const minDate = dayjs().subtract(30, "days")
            if (dateFrom.isBefore(minDate)) dateFrom = minDate

            let activities = await strava.activities.getActivities(user, {after: dateFrom})
            activities.reverse()
            if (activities.length > limit) {
                activities = activities.slice(0, limit)
            }
            return activities.map(sanitizeActivity)
        }
    },
    {
        name: "get_activity",
        description: "Get a single Strava activity by ID, including details used by automations.",
        inputSchema: {
            type: "object",
            properties: {activityId: {type: "string", description: "Strava activity ID"}},
            required: ["activityId"],
            additionalProperties: false
        },
        handler: async (user, args) => {
            if (!args.activityId) throw new Error("Missing activityId")
            const activity = await strava.activities.getActivity(user, args.activityId.toString())
            return sanitizeActivity(activity)
        }
    },
    {
        name: "list_processed_activities",
        description: "List activities that Strautomator already processed (automation history).",
        inputSchema: {
            type: "object",
            properties: {
                limit: {type: "number", description: "Max results"},
                from: {type: "string", description: "Start date (ISO or YYYY-MM-DD)"},
                to: {type: "string", description: "End date (ISO or YYYY-MM-DD)"}
            },
            additionalProperties: false
        },
        handler: async (user, args) => {
            const limit = args.limit ? requireNumber(args.limit, "limit") : null
            const dateFrom = args.from ? dayjs(args.from.toString()).startOf("day").toDate() : null
            const dateTo = args.to ? dayjs(args.to.toString()).endOf("day").toDate() : null
            const activities = await strava.activityProcessing.getProcessedActivities(user, dateFrom, dateTo, limit)

            if (user.garmin) {
                await Promise.allSettled(
                    activities.map(async (activity) => {
                        const garminActivity = await fitparser.getMatchingActivity(user, activity, "garmin")
                        if (garminActivity) activity.garminActivity = garminActivity
                    })
                )
            }
            if (user.wahoo) {
                await Promise.allSettled(
                    activities.map(async (activity) => {
                        const wahooActivity = await fitparser.getMatchingActivity(user, activity, "wahoo")
                        if (wahooActivity) activity.wahooActivity = wahooActivity
                    })
                )
            }

            return activities.map(sanitizeActivity)
        }
    },
    {
        name: "get_processed_activity",
        description: "Get a single Strautomator-processed activity, including which automations ran.",
        inputSchema: {
            type: "object",
            properties: {activityId: {type: "string", description: "Strava activity ID"}},
            required: ["activityId"],
            additionalProperties: false
        },
        handler: async (user, args) => {
            const activity = await strava.activityProcessing.getProcessedActivity(user, parseInt(args.activityId, 10))
            return sanitizeActivity(activity)
        }
    },
    {
        name: "process_activity",
        description: "Run Strautomator automations on a specific Strava activity now (same as processing it from the website).",
        inputSchema: {
            type: "object",
            properties: {activityId: {type: "string", description: "Strava activity ID"}},
            required: ["activityId"],
            additionalProperties: false
        },
        handler: async (user, args) => {
            const processed = await strava.activityProcessing.processActivity(user, {id: parseInt(args.activityId, 10)})
            return processed || {processed: false}
        }
    },
    {
        name: "list_automations",
        description: "List the user's Strautomator automations (recipes), including conditions and actions.",
        inputSchema: {type: "object", properties: {}, additionalProperties: false},
        handler: async (user) => {
            return Object.values(user.recipes || {})
        }
    },
    {
        name: "get_automation_schema",
        description: "Return valid automation condition properties, operators and action types. Call this before save_automation.",
        inputSchema: {type: "object", properties: {}, additionalProperties: false},
        handler: async () => {
            return {
                operators: ["any", "=", "!=", "like", "notlike", "approx", ">", "<"],
                logicalOperators: ["AND", "OR"],
                properties: recipes.propertyList.map((p: any) => _.pick(p, ["value", "text", "type", "isPro"])),
                actions: recipes.actionList.map((a: any) => _.pick(a, ["value", "text", "isPro"]))
            }
        }
    },
    {
        name: "save_automation",
        description: "Create or update an automation. Omit id to create. Conditions and actions must follow get_automation_schema. Each condition needs property, operator and value. Each action needs type and value.",
        inputSchema: {
            type: "object",
            properties: {
                id: {type: "string", description: "Existing automation ID to update"},
                title: {type: "string"},
                conditions: {type: "array", items: {type: "object"}},
                actions: {type: "array", items: {type: "object"}},
                op: {type: "string", enum: ["AND", "OR"]},
                samePropertyOp: {type: "string", enum: ["AND", "OR"]},
                order: {type: "number"},
                defaultFor: {type: "string", description: "Sport type this automation always applies to"},
                killSwitch: {type: "boolean"},
                disabled: {type: "boolean"},
                counterProp: {type: "string"},
                counterNoReset: {type: "boolean"}
            },
            required: ["title", "actions"],
            additionalProperties: false
        },
        handler: async (user, args) => {
            const fresh = await users.getById(user.id)
            const recipe: RecipeData = args as RecipeData

            recipes.validate(fresh, recipe)
            validateRecipeWebhookActions(recipe)

            if (recipe.conditions?.length <= 2 && recipe.samePropertyOp) {
                delete recipe.samePropertyOp
            }

            if (!recipe.id) {
                recipe.id = recipes.generateId()
                fresh.recipes = fresh.recipes || {}
                fresh.recipes[recipe.id] = recipe
            } else {
                if (!fresh.recipes?.[recipe.id]) {
                    throw new Error(`Automation ${recipe.id} not found`)
                }
                fresh.recipes[recipe.id] = recipe
            }

            if (fresh.suspended) {
                fresh.suspended = false
            }
            fresh.recipeCount = Object.keys(fresh.recipes).length
            await users.update(fresh, true)
            return recipe
        }
    },
    {
        name: "delete_automation",
        description: "Delete an automation by ID.",
        inputSchema: {
            type: "object",
            properties: {id: {type: "string", description: "Automation ID"}},
            required: ["id"],
            additionalProperties: false
        },
        handler: async (user, args) => {
            const fresh = await users.getById(user.id)
            const recipeId = args.id.toString()
            if (!fresh.recipes?.[recipeId]) {
                throw new Error(`Automation ${recipeId} not found`)
            }
            delete fresh.recipes[recipeId]
            fresh.recipeCount = Object.keys(fresh.recipes).length
            await users.update(fresh, true)
            return {deleted: true, id: recipeId}
        }
    },
    {
        name: "get_automation_stats",
        description: "Get execution stats for all automations, or a single automation if id is set.",
        inputSchema: {
            type: "object",
            properties: {id: {type: "string", description: "Optional automation ID"}},
            additionalProperties: false
        },
        handler: async (user, args) => {
            if (args.id) {
                if (!user.recipes?.[args.id]) {
                    throw new Error(`Automation ${args.id} not found`)
                }
                return recipes.stats.getStats(user, user.recipes[args.id])
            }
            const arrStats = (await recipes.stats.getStats(user)) as any[]
            arrStats.forEach((s) => delete s.activities)
            return arrStats
        }
    },
    {
        name: "list_gearwear",
        description: "List GearWear configurations for the user, including battery tracker when Garmin or Wahoo is linked.",
        inputSchema: {type: "object", properties: {}, additionalProperties: false},
        handler: async (user) => {
            const result: any = {configs: await gearwear.getByUser(user)}
            if (user.garmin?.id || user.wahoo?.id) {
                const batteryTracker = await gearwear.getBatteryTracker(user)
                if (batteryTracker) result.batteryTracker = batteryTracker
            }
            return result
        }
    },
    {
        name: "get_gearwear",
        description: "Get one GearWear configuration plus the Strava gear details.",
        inputSchema: {
            type: "object",
            properties: {gearId: {type: "string", description: "Strava gear ID"}},
            required: ["gearId"],
            additionalProperties: false
        },
        handler: async (user, args) => {
            const config = await gearwear.getById(args.gearId.toString())
            if (config && config.userId != user.id) {
                throw new Error("No access to this GearWear configuration")
            }
            const gear = await strava.athletes.getGear(user, args.gearId.toString())
            return {config, gear}
        }
    },
    {
        name: "list_athlete_records",
        description: "Get the athlete's personal records tracked by Strautomator.",
        inputSchema: {type: "object", properties: {}, additionalProperties: false},
        handler: async (user) => strava.athletes.getAthleteRecords(user)
    },
    {
        name: "list_routes",
        description: "List the athlete's Strava routes.",
        inputSchema: {type: "object", properties: {}, additionalProperties: false},
        handler: async (user) => strava.routes.getUserRoutes(user)
    },
    {
        name: "list_upcoming_club_events",
        description: "List upcoming Strava club events. PRO accounts can look further ahead than the website default.",
        inputSchema: {
            type: "object",
            properties: {days: {type: "number", description: "How many days ahead to look"}},
            additionalProperties: false
        },
        handler: async (user, args) => {
            const days = args.days ? requireNumber(args.days, "days") : settings.plans.pro.futureCalendarDays
            const events = await strava.clubs.getUpcomingClubEvents(user, days, [user.profile.country])
            return events
        }
    },
    {
        name: "estimate_ftp",
        description: "Estimate cycling FTP from recent activities with power. Does not write to Strava unless save is true.",
        inputSchema: {
            type: "object",
            properties: {
                save: {type: "boolean", description: "If true, save the estimated FTP to Strava"},
                ftp: {type: "number", description: "Override watts to save when save=true"}
            },
            additionalProperties: false
        },
        handler: async (user, args) => {
            const estimation = await strava.performance.estimateFtp(user)
            if (!estimation) {
                return {estimated: false}
            }
            if (args.save) {
                if (args.ftp && args.ftp > 0) {
                    estimation.ftpWatts = parseInt(args.ftp, 10)
                }
                const updated = await strava.performance.saveFtp(user, estimation)
                return {saved: !!updated, ftp: estimation.ftpWatts, estimation}
            }
            return estimation
        }
    },
    {
        name: "list_notifications",
        description: "List Strautomator notifications for the user.",
        inputSchema: {
            type: "object",
            properties: {includeRead: {type: "boolean", description: "If true, include already-read / expired notifications"}},
            additionalProperties: false
        },
        handler: async (user, args) => notifications.getByUser(user, args.includeRead === true)
    },
    {
        name: "get_strava_status",
        description: "Get the current Strava API / incident status tracked by Strautomator.",
        inputSchema: {type: "object", properties: {}, additionalProperties: false},
        handler: async () => {
            const stravaState = await database.appState.get("strava")
            return {incident: stravaState?.incident || null, version: packageVersion}
        }
    }
]

export const listTools = () => {
    return tools.map((t) => ({name: t.name, description: t.description, inputSchema: t.inputSchema}))
}

export const callTool = async (user: UserData, name: string, args: any) => {
    const tool = tools.find((t) => t.name == name)
    if (!tool) {
        return toolError(`Unknown tool: ${name}`)
    }

    try {
        const result = await tool.handler(user, args || {})
        return toolResult(result)
    } catch (ex) {
        logger.error("McpTools.callTool", user.id, name, ex)
        return toolError(ex.message || ex.toString())
    }
}
