import _ from "lodash"

export default {
    // Share recipe rules used to validate conditions.
    computed: {
        recipeRules() {
            return {
                required: (value) => {
                    if (!value || value.trim().length < 1) return `Field is required`
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
                    if (!value) return "Invalid time"
                    value = value.replace(":", "")
                    if (isNaN(value)) return "Invalid time"
                    const num = parseFloat(value)
                    if (num < 0 || num > 2359) return "Invalid time"
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

            if (action.value && action.type != "commute") {
                return `${actionType}: ${valueText}`
            } else {
                return `${actionType}`
            }
        },
        // Returns the text for the specified action.
        actionText(action) {
            return _.find(this.$store.state.recipeActions, {value: action.type}).text
        },
        // Returns a condition summary.
        conditionSummary(condition) {
            const property = _.find(this.$store.state.recipeProperties, {value: condition.property})

            // Invalid or deprecated property!
            if (!property) {
                return `!!! ERROR !!! Invalid property: ${condition.property}`
            }

            let fieldText = property.text
            let operatorText = _.find(property.operators, {value: condition.operator}).text
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
        // Returns the material icon for the specified sport type.
        getSportIcon(sportType) {
            if (sportType == "Ride" || sportType == "VirtualRide") return "mdi-bike"
            if (sportType == "Run" || sportType == "VirtualRun") return "mdi-run"
            if (sportType == "Walk") return "mdi-walk"
            if (sportType == "Golf") return "mdi-golf"
            if (sportType == "Skateboard") return "mdi-skateboard"
            if (sportType == "Snowboard") return "mdi-snowboard"
            if (sportType == "Swim") return "mdi-swim"
            if (sportType == "Yoga") return "mdi-yoga"
            if (sportType == "Sail") return "mdi-sail-boat"
            if (sportType == "IceSkate") return "mdi-skate"
            if (sportType == "CrossFit" || sportType == "WeightTraining") return "mdi-weight-lifter"
            if (sportType.indexOf("Ski") > 0) return "mdi-ski"
            return "mdi-dumbbell"
        },
        // Convert sport type enum to readable text (with spaces).
        getSportName(enumValue) {
            return enumValue.replace(/([A-Z])/g, " $1").trim()
        }
    }
}
