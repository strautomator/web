import _ from "lodash"

export default {
    // Share recipe rules used to validate conditions.
    computed: {
        booleanActions() {
            return ["commute", "generateName", "hideHome", "hideStatPace", "hideStatSpeed", "hideStatCalories", "hideStatHeartRate", "hideStatPower"]
        },
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

            if (action.value && !this.booleanActions.includes(action.type)) {
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
        }
    }
}
