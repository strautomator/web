// Strautomator MCP tools — thin wrappers around the same handlers used by the HTTP API.

import {database, notifications, recipes, strava, users, UserData} from "strautomator-core"
import {getGearwearById, getGearwearByUser, getProcessedActivities, getPublicUser, getRecipeStats, saveEstimatedFtp, upsertUserRecipe} from "../routes/logic"
import {sanitizeUser, toolError, toolResult} from "./utils"
import logger from "anyhow"

type ToolHandler = (user: UserData, args: any) => Promise<any>

interface ToolDef {
    name: string
    description: string
    inputSchema: any
    handler: ToolHandler
}

const tools: ToolDef[] = [
    {
        name: "get_account",
        description: "Get the authenticated Strautomator user profile, preferences, automations and linked accounts. Secrets and API tokens are omitted.",
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
        name: "get_automation_schema",
        description: "Return valid automation condition properties, operators and action types from core. Call this before save_automation.",
        inputSchema: {type: "object", properties: {}, additionalProperties: false},
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
        description: "List GearWear configurations for the user. Same as GET /api/gearwear/:userId.",
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
        description: "Estimate cycling FTP from recent activities with power. Same as GET /api/strava/:userId/ftp/estimate. Set save=true to write it to Strava (POST).",
        inputSchema: {
            type: "object",
            properties: {
                save: {type: "boolean", description: "If true, save the estimated FTP to Strava"},
                ftp: {type: "number", description: "Override watts to save when save=true"}
            },
            additionalProperties: false
        },
        handler: async (user, args) => {
            if (args.save) {
                return saveEstimatedFtp(user, args.ftp)
            }
            return (await strava.performance.estimateFtp(user)) || false
        }
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
