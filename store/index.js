export const state = () => ({
    lastUserFetch: new Date().valueOf(),
    user: null,
    athleteRecords: null,
    gearwearCount: null,
    recipeProperties: null,
    recipeActions: null,
    recipeMaxLength: null,
    weatherProviders: null,
    linksOnPercent: null,
    ftpWeeks: null,
    sportTypes: [],
    workoutTypes: [],
    recordFields: [],
    mapStyles: [],
    freePlanDetails: {},
    proPlanDetails: {}
})

export const getters = {
    user(state) {
        return state.user
    },
    athleteRecords(state) {
        return state.athleteRecords
    },
    lastUserFetch(state) {
        return state.lastUserFetch
    }
}

export const mutations = {
    setRecipeOptions(state, data) {
        state.recipeProperties = data.recipeProperties
        state.recipeActions = data.recipeActions
        state.recipeMaxLength = data.recipeMaxLength
    },
    setWeatherProviders(state, data) {
        state.weatherProviders = data
    },
    setLinksOnPercent(state, data) {
        state.linksOnPercent = data
    },
    setSportTypes(state, data) {
        state.sportTypes = data
    },
    setWorkoutTypes(state, data) {
        state.workoutTypes = data
    },
    setRecordFields(state, data) {
        state.recordFields = data
    },
    setMapStyles(state, data) {
        state.mapStyles = data
    },
    setPlanDetails(state, data) {
        state.freePlanDetails = data.free
        state.proPlanDetails = data.pro
    },
    setFtpWeeks(state, data) {
        state.ftpWeeks = data
    },
    setUser(state, data) {
        state.user = data
    },
    setAthleteRecords(state, data) {
        state.athleteRecords = data
    },
    setUserPreferences(state, data) {
        if (!state.user.preferences) state.user.preferences = {}
        state.user.preferences = Object.assign(state.user.preferences, data)
    },
    setUserCalendarTemplate(state, data) {
        if (!state.user.calendarTemplate) state.user.calendarTemplate = {}
        state.user.calendarTemplate = Object.assign(state.user.calendarTemplate, data)
    },
    setUserEmail(state, email) {
        state.user.email = email
    },
    setUserSubscription(state, data) {
        state.user.subscription = data
        if (data.enabled === false) state.user.isPro = false
    },
    setLastUserFetch(state, data) {
        state.lastUserFetch = data
    },
    setUserRecipe(state, recipe) {
        state.user.recipes[recipe.id] = recipe
    },
    deleteUserRecipe(state, recipe) {
        delete state.user.recipes[recipe.id]
    },
    setGearWearCount(state, count) {
        state.gearwearCount = count
    }
}

export const actions = {
    async nuxtServerInit({commit, dispatch, state}) {
        if (process.server) {
            const core = require("strautomator-core")
            const settings = require("setmeup").settings

            // Set recipe properties, actions and rules.
            const recipeOptions = {
                recipeProperties: core.recipes.propertyList,
                recipeActions: core.recipes.actionList,
                recipeMaxLength: settings.recipes.maxLength
            }
            commit("setRecipeOptions", recipeOptions)

            // Set weather providers.
            const weatherProviders = core.weather.providers.map((p) => {
                return {value: p.name, text: p.title}
            })
            weatherProviders.unshift({value: null, text: "Default weather provider"})
            commit("setWeatherProviders", weatherProviders)

            // Set links on percentage.
            const percent = Math.round(100 / settings.plans.free.linksOn)
            commit("setLinksOnPercent", percent)

            // Set sport types.
            const sportTypes = Object.keys(core.StravaSport).map((s) => core.StravaSport[s])
            commit("setSportTypes", sportTypes)

            // Set workout types.
            const rideWorkoutKeys = Object.keys(core.StravaRideType).filter((s) => isNaN(s))
            const rideWorkoutTypes = rideWorkoutKeys.map((s) => {
                return {text: "Ride: " + s.replace(/([A-Z])/g, " $1").trim(), value: core.StravaRideType[s]}
            })
            const runWorkoutKeys = Object.keys(core.StravaRunType).filter((s) => isNaN(s))
            const runWorkoutTypes = runWorkoutKeys.map((s) => {
                return {text: "Run: " + s.replace(/([A-Z])/g, " $1").trim(), value: core.StravaRunType[s]}
            })
            const workoutTypes = rideWorkoutTypes.concat(runWorkoutTypes)
            commit("setWorkoutTypes", workoutTypes)

            // Tracked personal records fields.
            const recordFields = core.StravaTrackedRecords.slice()
            commit("setRecordFields", recordFields)

            // Set map styles.
            const mapStyles = Object.keys(core.StravaMapStyle).map((s) => {
                return {text: s.replace(/([A-Z])/g, " $1").trim(), value: core.StravaMapStyle[s]}
            })
            commit("setMapStyles", mapStyles)

            // Set free / PRO plan details.
            commit("setPlanDetails", settings.plans)

            // Set the FTP weeks default.
            commit("setFtpWeeks", settings.strava.ftp.weeks)
        }

        let user = state.user
        let oauth = state.oauth

        if (!user && oauth && oauth.accessToken) {
            await dispatch("assignUser")
        }
    },
    async assignUser({commit, state}) {
        try {
            if (state.oauth.userId) {
                this.$axios.setToken(state.oauth.accessToken)

                const urlUser = `/api/users/${state.oauth.userId}`
                const urlRecords = `/api/strava/${state.oauth.userId}/athlete-records`

                await Promise.all([this.$axios.$get(urlUser), this.$axios.$get(urlRecords)])
                    .then((res) => {
                        commit("setUser", res[0])

                        const aRecords = res[1] || {}
                        delete aRecords.id
                        delete aRecords.dateRefreshed

                        commit("setAthleteRecords", Object.keys(aRecords).length > 0 ? aRecords : null)
                    })
                    .catch((err) => {
                        throw err
                    })
            }
        } catch (ex) {
            if (process.server) {
                const logger = require("anyhow")
                const userId = state.oauth ? state.oauth.userId : "unknown"
                logger.error("nuxtServerInit.assignUser", `User ${userId}`, ex)
            } else {
                console.error(ex)
                const status = ex.response ? ex.response.status : 401
                document.location.href = `/error?status=${encodeURIComponent(status)}&message=${encodeURIComponent(ex.ToString())}`
            }
        }
    }
}
