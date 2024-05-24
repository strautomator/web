import _ from "lodash"

export default {
    data() {
        // Activity general tags.
        const generalTags = [
            {value: "icon", label: "Activity icon"},
            {value: "name", label: "Activity name"},
            {value: "description", label: "Activity description"},
            {value: "sportType", label: "Sport type"},
            {value: "counter", label: "Counter"},
            {value: "distance", label: "Distance"},
            {value: "speedAvg", label: "Avg speed"},
            {value: "speedMax", label: "Max speed"},
            {value: "paceAvg", label: "Avg pace"},
            {value: "paceMax", label: "Max pace"},
            {value: "cadenceAvg", label: "Avg cadence (RPM)"},
            {value: "cadenceSpm", label: "Avg cadence (SPM)"},
            {value: "elevationGain", label: "Elevation gain"},
            {value: "elevationMax", label: "Max elevation"},
            {value: "climbingRatio", label: "Climbing ratio"},
            {value: "totalTime", label: "Total time"},
            {value: "movingTime", label: "Moving time"},
            {value: "co2Saved", label: "CO2 saved"},
            {value: "weekday", label: "Weekday"},
            {value: "weekOfYear", label: "Week of year"},
            {value: "device", label: "Device"},
            {value: "aiName", label: "AI provider for activity name"},
            {value: "aiDescription", label: "AI provider for activity description"}
        ]

        // Activity performance tags.
        const performanceTags = [
            {value: "wattsAvg", label: "Avg power"},
            {value: "wattsWeighted", label: "Normalized power"},
            {value: "wattsMax", label: "Max power"},
            {value: "wattsKg", label: "Watts / kg"},
            {value: "tss", label: "TSS"},
            {value: "hrAvg", label: "Avg HR"},
            {value: "hrMax", label: "Max HR"},
            {value: "calories", label: "Calories"},
            {value: "relativeEffort", label: "Relative effort"},
            {value: "perceivedExertion", label: "Perceived exertion"}
        ]

        // Garmin tags.
        const garminTags = [
            {value: "garmin.tss", label: "Garmin: TSS"},
            {value: "garmin.trainingLoad", label: "Garmin: Training load"},
            {value: "garmin.aerobicTrainingEffect", label: "Garmin: Aerobic t. effect"},
            {value: "garmin.anaerobicTrainingEffect", label: "Garmin: Anaerobic t. effect"},
            {value: "garmin.pedalTorqueEffect", label: "Garmin: Torque effectiveness"},
            {value: "garmin.pedalSmoothness", label: "Garmin: Pedal smoothness"},
            {value: "garmin.pedalBalance", label: "Garmin: Pedal balance"},
            {value: "garmin.sportProfile", label: "Garmin: Sport profile"},
            {value: "garmin.workoutName", label: "Garmin: Workout name"}
        ]

        // Activity lap tags.
        const lapTags = [
            {value: "lapCount", label: "Lap count"},
            {value: "lapDistance", label: "Lap distance"},
            {value: "lapTime", label: "Lap time"}
        ]

        // Activity location tags.
        const locationTags = []
        const locationBaseTags = [
            {value: "country", label: "Country name"},
            {value: "countryFlag", label: "Country flag"},
            {value: "city", label: "City", pro: true}
        ]
        for (let t of locationBaseTags) {
            locationTags.push({
                value: `${t.value}Start`,
                label: `${t.label} (start)`
            })
            locationTags.push({
                value: `${t.value}End`,
                label: `${t.label} (end)`
            })
        }

        // Music track tags.
        const musicTags = [
            {value: "spotify.trackList", label: "Spotify: Full track list"},
            {value: "spotify.trackStart", label: "Spotify: Track title (start)"},
            {value: "spotify.trackEnd", label: "Spotify: Track title (end)"},
            {value: "spotify.lyricsStart", label: "Spotify: Track lyrics (first)", pro: true},
            {value: "spotify.lyricsEnd", label: "Spotify: Track lyrics (last)", pro: true}
        ]

        // Weather tags.
        const weatherTags = []
        const weatherBaseTags = [
            {value: "icon", label: "Icon"},
            {value: "summary", label: "Summary"},
            {value: "temperature", label: "Temp. (real)"},
            {value: "feelsLike", label: "Temp. (feels like)"},
            {value: "humidity", label: "Humidity"},
            {value: "pressure", label: "Pressure"},
            {value: "windSpeed", label: "Wind speed"},
            {value: "windGust", label: "Wind gust"},
            {value: "windDirection", label: "Wind direction"},
            {value: "precipitation", label: "Precipitation"},
            {value: "airDensity", label: "Air density"},
            {value: "aqi", label: "AQI (0 to 5)"},
            {value: "aqiIcon", label: "AQI Icon"}
        ]
        for (let t of weatherBaseTags) {
            locationTags.push({
                value: `weather.start.${t.value}`,
                label: `${t.label} (start)`
            })
            locationTags.push({
                value: `weather.end.${t.value}`,
                label: `${t.label} (end)`
            })
        }

        // Combine main and extra activity tags.
        const mainActivityTags = _.concat(generalTags, performanceTags, lapTags, locationTags)
        for (let t of mainActivityTags) {
            t.value = "{" + t.value + "}"
        }
        const extraActivityTags = _.concat(garminTags, musicTags, weatherTags)
        for (let t of extraActivityTags) {
            t.value = "{" + t.value + "}"
        }

        return {
            mainActivityTags: mainActivityTags,
            extraActivityTags: extraActivityTags
        }
    },
    computed: {
        booleanActions() {
            return ["generateName", "hideHome", "hideStatPace", "hideStatSpeed", "hideStatCalories", "hideStatHeartRate", "hideStatPower"]
        },
        recipeRules() {
            return {
                required: (value) => {
                    if (!value || value.toString().trim().length < 1) return `Field is required`
                    return true
                },
                number: (value) => {
                    if (isNaN(value)) return "Invalid number"
                    const num = parseFloat(value)
                    if (num <= 0) return "Must be higher than zero"
                    return true
                },
                anyNumber: (value) => {
                    if (isNaN(value)) return "Invalid number"
                    if (/^-?\d*\.?\d*$/.test(value)) return true
                    return "Invalid number"
                },
                time: (value) => {
                    if (!value || value.length < 4) return "Invalid time"
                    const arrValue = value.split(":")
                    if (arrValue.length != 2) return "Invalid time"
                    if (isNaN(arrValue[0]) || isNaN(arrValue[1])) return "Invalid time"
                    const arrTime = arrValue.map((v) => parseInt(v))
                    if (arrTime[0] < 0 || arrTime[0] > 23 || arrTime[1] < 0 || arrTime[1] > 59) return "Invalid time"
                    return true
                },
                timer: (value) => {
                    if (!value || value.length < 4) return "Invalid timer"
                    const arrValue = value.split(":")
                    if (arrValue.length != 2) return "Invalid timer"
                    if (isNaN(arrValue[0]) || isNaN(arrValue[1])) return "Invalid timer"
                    const arrTime = arrValue.map((v) => parseInt(v))
                    if (arrTime[0] < 0 || arrTime[1] < 0 || arrTime[1] > 59) return "Invalid timer"
                    return true
                },
                text: (value) => {
                    if (value.length > 0) return true
                    return "Empty text"
                },
                url: (value) => {
                    if (!value) return "Empty URL"
                    if (/(http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/.test(value)) return true
                    return "Invalid URL"
                }
            }
        }
    },
    methods: {
        // Returns an action summary.
        actionSummary(action) {
            const actionType = _.find(this.$store.state.recipeActions, {value: action.type}).text
            const valueText = action.friendlyValue || action.value
            const isBoolean = this.booleanActions.includes(action.type)

            if (isBoolean) {
                if (action.value != true) {
                    return `${actionType} (${valueText})`
                }

                return `${actionType}`
            } else {
                return `${actionType}: ${valueText}`
            }
        },
        // Returns the text for the specified action.
        actionText(action) {
            return _.find(this.$store.state.recipeActions, {value: action.type}).text
        },
        // Returns a condition summary.
        conditionSummary(condition) {
            const property = _.find(this.$store.state.recipeProperties, {value: condition.property})
            if (!property) {
                return `!!! ERROR !!! Invalid property: ${condition.property}`
            }

            if (!property.operators) {
                return property.text
            }

            const operator = _.find(property.operators, {value: condition.operator})
            if (!operator) {
                return `!!! ERROR !!! Invalid condition operator: ${condition.operator}`
            }

            let fieldText = property.text
            let operatorText = operator.text
            let valueText = condition.friendlyValue || condition.value

            // Has a suffix?
            const suffix = this.$store.state.user.profile.units == "imperial" ? property.impSuffix || property.suffix : property.suffix
            if (suffix) {
                valueText += ` ${suffix}`
            }

            // Boolean do not need the "is" text.
            if (property.type == "boolean") {
                return `${fieldText}: ${valueText}`
            }

            return `${fieldText} ${operatorText} ${valueText}`
        },
        // Returns the text for the specified condition.
        conditionPropertyText(condition) {
            return _.find(this.$store.state.recipeProperties, {value: condition.property}).text
        },
        // Returns the code for the recipe logical operators (ALL, ANY or SOME).
        codeLogicalOperator(recipe) {
            if (recipe.op == "AND" && (recipe.samePropertyOp == "AND" || recipe.conditions.length < 3)) return "ALL"
            if (recipe.op == "OR" && (recipe.samePropertyOp == "OR" || recipe.conditions.length < 3)) return "ANY"
            return "SOME"
        }
    }
}
