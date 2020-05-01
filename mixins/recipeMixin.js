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
                time: (value) => {
                    if (!value) return "Invalid time"
                    value = value.replace(":", "")
                    if (isNaN(value)) return "Invalid time"
                    const num = parseFloat(value)
                    if (num < 0 || num > 2359) return "Invalid time"
                    return true
                },
                text: (value) => {
                    return value.length > 0
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

            const fieldText = property.text
            const operatorText = _.find(property.operators, {value: condition.operator}).text
            let valueText = condition.friendlyValue || condition.value

            if (property.suffix) {
                valueText += ` ${property.suffix}`
            }

            return `${fieldText} ${operatorText} ${valueText}`
        },
        // Returns the text for the specified condition.
        conditionPropertyText(condition) {
            return _.find(this.$store.state.recipeProperties, {value: condition.property}).text
        }
    }
}
