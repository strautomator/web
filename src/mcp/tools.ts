// Strautomator MCP tools — thin wrappers around the same handlers used by the HTTP API.

import {calendar, database, notifications, recipes, strava, users, StravaEstimatedFtp, UserData} from "strautomator-core"
import {getGearwearById, getGearwearByUser, getProcessedActivities, getPublicUser, getRecipeStats, saveEstimatedFtp, upsertUserRecipe} from "../routes/logic"
import {sanitizeUser, toolError, toolResult} from "./utils"
import dayjs from "../dayjs"
import logger from "anyhow"

type ToolHandler = (user: UserData, args: any) => Promise<any>

interface ToolDef {
    name: string
    description: string
    inputSchema: any
    handler: ToolHandler
}

interface CachedFtpEstimate {
    id: string
    estimation: StravaEstimatedFtp
    dateEstimated: Date
    dateExpiry: Date
}

const FTP_ESTIMATE_COLLECTION = "mcp-ftp-estimates"
const FTP_ESTIMATE_CACHE_DAYS = 7

const getCachedFtpEstimate = async (user: UserData): Promise<{estimation: StravaEstimatedFtp | false; cached: boolean}> => {
    const cached: CachedFtpEstimate = await database.get(FTP_ESTIMATE_COLLECTION, user.id)
    if (cached?.estimation && cached.dateExpiry && dayjs(cached.dateExpiry).isAfter(dayjs())) {
        return {estimation: cached.estimation, cached: true}
    }

    const estimation = await strava.performance.estimateFtp(user)
    if (!estimation) {
        return {estimation: false, cached: false}
    }

    const dateEstimated = new Date()
    await database.set(
        FTP_ESTIMATE_COLLECTION,
        {
            id: user.id,
            estimation,
            dateEstimated,
            dateExpiry: dayjs(dateEstimated).add(FTP_ESTIMATE_CACHE_DAYS, "days").toDate()
        } as CachedFtpEstimate,
        user.id
    )
    return {estimation, cached: false}
}

// TOOL DEFINITIONS
// --------------------------------------------------------------------------

/**
 * MCP tool catalog. Each handler delegates to src/routes/logic.ts or the equivalent core module
 * so behaviour stays aligned with the website API.
 */
const tools: ToolDef[] = [
    {
        name: "get_account",
        description: "Get the authenticated Strautomator user profile, preferences and linked accounts. Secrets, API tokens, automations and FIT device names are omitted.",
        inputSchema: {
            type: "object",
            properties: {refresh: {type: "boolean", description: "If true, refresh the Strava profile first (same as GET /api/users/:userId?refresh=1)"}},
            additionalProperties: false
        },
        handler: async (user, args) => sanitizeUser(await getPublicUser(user, args.refresh === true))
    },
    {
        name: "list_processed_activities",
        description: "List activities that Strautomator already processed (automation history). Same as GET /api/strava/:userId/processed-activities.",
        inputSchema: {
            type: "object",
            properties: {
                limit: {type: "number", description: "Max results"},
                from: {type: "string", description: "Start date (ISO or YYYY-MM-DD)"},
                to: {type: "string", description: "End date (ISO or YYYY-MM-DD)"}
            },
            additionalProperties: false
        },
        handler: async (user, args) => getProcessedActivities(user, args)
    },
    {
        name: "get_processed_activity",
        description: "Get a single Strautomator-processed activity. Same as GET /api/strava/:userId/processed-activities/:id.",
        inputSchema: {
            type: "object",
            properties: {activityId: {type: "string", description: "Strava activity ID"}},
            required: ["activityId"],
            additionalProperties: false
        },
        handler: async (user, args) => strava.activityProcessing.getProcessedActivity(user, parseInt(args.activityId, 10))
    },
    {
        name: "process_activity",
        description: "Run Strautomator automations on a specific Strava activity now. Same as GET /api/strava/:userId/process-activity/:activityId.",
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
        description: "List the user's Strautomator automations (recipes).",
        inputSchema: {type: "object", properties: {}, additionalProperties: false},
        handler: async (user) => {
            const result = await getPublicUser(user)
            return result.recipes || {}
        }
    },
    {
        name: "list_fit_device_names",
        description: "List the custom names assigned to FIT device IDs in the user's account.",
        inputSchema: {type: "object", properties: {}, additionalProperties: false},
        handler: async (user) => user.fitDeviceNames || {}
    },
    {
        name: "get_automation_schema",
        description: "Return valid automation condition properties, operators and action types from core. Call this before save_automation.",
        inputSchema: {type: "object", properties: {}, additionalProperties: false},
        // Full core lists (not filtered by isPro) because MCP access is already PRO-only.
        handler: async () => ({properties: recipes.propertyList, actions: recipes.actionList})
    },
    {
        name: "save_automation",
        description: "Create or update an automation. Same as POST /api/users/:userId/recipes. Omit id to create. Call get_automation_schema first.",
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
            return upsertUserRecipe(fresh, args, "POST")
        }
    },
    {
        name: "delete_automation",
        description: "Delete an automation by ID. Same as DELETE /api/users/:userId/recipes/:recipeId.",
        inputSchema: {
            type: "object",
            properties: {id: {type: "string", description: "Automation ID"}},
            required: ["id"],
            additionalProperties: false
        },
        handler: async (user, args) => {
            const fresh = await users.getById(user.id)
            return upsertUserRecipe(fresh, null, "DELETE", args.id.toString())
        }
    },
    {
        name: "get_automation_stats",
        description: "Get execution stats for all automations, or a single automation if id is set. Same as GET /api/users/:userId/recipes/stats.",
        inputSchema: {
            type: "object",
            properties: {id: {type: "string", description: "Optional automation ID"}},
            additionalProperties: false
        },
        handler: async (user, args) => getRecipeStats(user, args.id)
    },
    {
        name: "list_gearwear",
        description: "List GearWear configurations and device battery tracking information for the user. Same as GET /api/gearwear/:userId.",
        inputSchema: {
            type: "object",
            properties: {refresh: {type: "boolean", description: "If true, refresh gear details from Strava in the background"}},
            additionalProperties: false
        },
        handler: async (user, args) => getGearwearByUser(user, args.refresh === true)
    },
    {
        name: "get_gearwear",
        description: "Get one GearWear configuration plus the Strava gear details. Same as GET /api/gearwear/:userId/:gearId.",
        inputSchema: {
            type: "object",
            properties: {gearId: {type: "string", description: "Strava gear ID"}},
            required: ["gearId"],
            additionalProperties: false
        },
        handler: async (user, args) => getGearwearById(user, args.gearId.toString())
    },
    {
        name: "list_athlete_records",
        description: "Get the athlete's personal records tracked by Strautomator. Same as GET /api/strava/:userId/athlete-records.",
        inputSchema: {type: "object", properties: {}, additionalProperties: false},
        handler: async (user) => strava.athletes.getAthleteRecords(user)
    },
    {
        name: "estimate_ftp",
        description: "Estimate cycling FTP from recent activities with power. Results are cached for 7 days, so this can effectively be called only once every 7 days. Set save=true to write the estimate to Strava (only applied when a fresh, non-cached estimate is generated).",
        inputSchema: {
            type: "object",
            properties: {
                save: {type: "boolean", description: "If true, save the estimated FTP to Strava"},
                ftp: {type: "number", description: "Override watts to save when save=true"}
            },
            additionalProperties: false
        },
        handler: async (user, args) => {
            const {estimation, cached} = await getCachedFtpEstimate(user)
            if (args.save && !cached) {
                return estimation ? saveEstimatedFtp(user, args.ftp, estimation) : false
            }
            return estimation
        }
    },
    {
        name: "list_calendars",
        description: "List metadata for the user's generated calendars without returning calendar contents.",
        inputSchema: {type: "object", properties: {}, additionalProperties: false},
        handler: async (user) => calendar.getByUser(user)
    },
    {
        name: "list_notifications",
        description: "List Strautomator notifications for the user. Same as GET /api/notifications/:userId/unread or /all.",
        inputSchema: {
            type: "object",
            properties: {includeRead: {type: "boolean", description: "If true, include already-read / expired notifications"}},
            additionalProperties: false
        },
        handler: async (user, args) => notifications.getByUser(user, args.includeRead === true)
    },
    {
        name: "get_strava_status",
        description: "Get the current Strava API / incident status tracked by Strautomator. Same as GET /api/strava/status.",
        inputSchema: {type: "object", properties: {}, additionalProperties: false},
        handler: async () => {
            const stravaState = await database.appState.get("strava")
            return {incident: stravaState?.incident || null}
        }
    }
]

// EXPORTS
// --------------------------------------------------------------------------

/**
 * Return the MCP tool list (name, description and JSON Schema) for tools/list.
 */
export const listTools = () => {
    return tools.map((t) => ({name: t.name, description: t.description, inputSchema: t.inputSchema}))
}

/**
 * Execute a tool by name for the authenticated user.
 */
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
