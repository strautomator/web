const countryListGbp = ["uk", "gb", "england", "great britain", "scotland", "united kingdom"]
const countryListEur = [
    "ad",
    "andorra",
    "al",
    "albania",
    "am",
    "armenia",
    "at",
    "austria",
    "be",
    "belgium",
    "bg",
    "bulgaria",
    "by",
    "belarus",
    "ch",
    "switzerland",
    "cy",
    "cyprus",
    "cz",
    "czech republic",
    "de",
    "germany",
    "dk",
    "denmark",
    "ee",
    "estonia",
    "es",
    "spain",
    "fi",
    "filand",
    "fr",
    "france",
    "gi",
    "gibraltar",
    "gr",
    "greece",
    "hr",
    "croatia",
    "hu",
    "hungary",
    "ie",
    "ireland",
    "is",
    "iceland",
    "im",
    "isle of man",
    "it",
    "italy",
    "lt",
    "lithuania",
    "lu",
    "luxembourg",
    "lv",
    "slovenia",
    "mt",
    "malta",
    "mc",
    "monaco",
    "nl",
    "holland",
    "netherlands",
    "no",
    "norway",
    "pl",
    "poland",
    "pt",
    "portugal",
    "ro",
    "romania",
    "ru",
    "russia",
    "se",
    "sweden",
    "si",
    "slovenia",
    "sk",
    "slovakia",
    "slovakian republic",
    "sm",
    "san marino",
    "tr",
    "turkey",
    "ua",
    "ukraine"
]

export const state = () => ({
    lastUserFetch: new Date().valueOf(),
    errorTitle: null,
    errorMessage: null,
    errorMethod: null,
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
    proPlanDetails: {},
    fitnessLevel: {},
    country: null,
    expectedCurrency: null,
    archiveDownloadDays: null,
    aiHumours: null,
    beta: false
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
    setError(state, data) {
        if (data) {
            state.errorTitle = data.title
            state.errorMessage = data.message
            state.errorMethod = data.method
        } else {
            state.errorTitle = null
            state.errorMessage = null
            state.errorMethod = null
        }
    },
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
    setFitnessLevel(state, data) {
        state.fitnessLevel = data
    },
    setFtpWeeks(state, data) {
        state.ftpWeeks = data
    },
    setUser(state, data) {
        if (data?.recipes) {
            const recipes = Object.values(data.recipes)
            for (let recipe of recipes) {
                if (!recipe.op) recipe.op = "AND"
                if (!recipe.samePropertyOp) recipe.samePropertyOp = recipe.op
            }
        }
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
        if (!state.user.preferences.calendarTemplate) state.user.preferences.calendarTemplate = {}
        state.user.preferences.calendarTemplate = Object.assign(state.user.preferences.calendarTemplate, data)
    },
    setUserEmail(state, email) {
        state.user.email = email
    },
    setUserUrlToken(state, token) {
        state.user.urlToken = token
    },
    setLastUserFetch(state, data) {
        state.lastUserFetch = data
    },
    setGearWearCount(state, count) {
        state.gearwearCount = count
    },
    setCountry(state, country) {
        state.country = country
    },
    setExpectedCurrency(state, currency) {
        state.expectedCurrency = currency
    },
    setArchiveDownloadDays(state, days) {
        state.archiveDownloadDays = days
    },
    setAiHumours(state, data) {
        state.aiHumours = data
    },
    setUserRecipe(state, recipe) {
        state.user.recipes[recipe.id] = recipe
    },
    deleteUserRecipe(state, recipe) {
        delete state.user.recipes[recipe.id]
    },
    setBeta(state, value) {
        state.beta = value
    }
}

export const actions = {
    async nuxtServerInit({commit, dispatch, state}, {req}) {
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
                const baseTitle = s.replace(/([A-Z])/g, " $1").trim()
                const mapTitle = baseTitle.replace("Satellite3 D", "Satellite 3D").replace("Winter3 D", "Winter 3D")
                return {text: mapTitle, value: core.StravaMapStyle[s]}
            })
            commit("setMapStyles", mapStyles)

            // Set free / PRO plan details.
            commit("setPlanDetails", settings.plans)

            // Set fitness level enum.
            commit("setFitnessLevel", core.StravaFitnessLevel)

            // Set the FTP weeks default.
            commit("setFtpWeeks", settings.strava.ftp.weeks)

            // Set GDPR archive days interval.
            commit("setArchiveDownloadDays", settings.gdpr.requestDays)

            // Set AI generative humours.
            commit("setAiHumours", settings.openai.humours)

            // Beta environment?
            if (settings.beta.enabled) {
                commit("setBeta", true)
            }
        }

        let user = state.user
        let oauth = state.oauth

        if (!user && oauth && oauth.accessToken) {
            await dispatch("assignUser", {req})
        } else {
            let country = (req.headers["cf-ipcountry"] || "us").toLowerCase()
            let currency = "USD"

            if (countryListGbp.includes(country)) {
                currency = "GBP"
            } else if (countryListEur.includes(country)) {
                currency = "EUR"
            }

            commit("setCountry", country)
            commit("setExpectedCurrency", currency)
        }
    },
    async assignUser({commit, state}, {req, res}) {
        const userId = state?.oauth?.userId || null
        let loggedUser

        try {
            if (!userId) {
                return
            }

            if (state?.oauth?.accessToken) {
                this.$axios.setToken(state.oauth.accessToken)
            }

            const urlUser = `/api/users/${userId}`
            const urlRecords = `/api/strava/${userId}/athlete-records`

            await Promise.all([this.$axios.$get(urlUser), this.$axios.$get(urlRecords)])
                .then((res) => {
                    loggedUser = res[0]
                    commit("setUser", loggedUser)

                    let country = (loggedUser.profile.country || req.headers["cf-ipcountry"] || "us").toLowerCase()
                    let currency = "USD"

                    if (countryListGbp.includes(country)) {
                        currency = "GBP"
                    } else if (countryListEur.includes(country)) {
                        currency = "EUR"
                    }

                    // Set the expected PRO currency based on existing user data and country.
                    commit("setExpectedCurrency", currency)

                    // Set athlete records.
                    try {
                        const aRecords = res[1] || {}
                        delete aRecords.id
                        delete aRecords.dateRefreshed
                        commit("setAthleteRecords", Object.keys(aRecords).length > 0 ? aRecords : null)
                    } catch (recordsEx) {
                        logger.error("nuxtServerInit.assignUser", `User ${userId}`, "Failed to assign records", ex)
                    }
                })
                .catch((err) => {
                    throw err
                })
        } catch (ex) {
            if (process.server) {
                const logger = require("anyhow")
                logger.error("nuxtServerInit.assignUser", `User ${userId || "unknown"}`, ex)

                if (!loggedUser) {
                    commit("setUser", null)
                }
            } else {
                console.error(ex)
                const status = ex.response ? ex.response.status : 401
                document.location.href = `/error?status=${encodeURIComponent(status)}&message=${encodeURIComponent(ex.ToString())}`
            }
        }
    }
}
