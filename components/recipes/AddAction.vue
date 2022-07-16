<template>
    <v-card>
        <v-toolbar color="primary">
            <v-toolbar-title>Action</v-toolbar-title>
            <v-spacer></v-spacer>
            <v-toolbar-items>
                <v-btn icon @click="cancel">
                    <v-icon>mdi-close</v-icon>
                </v-btn>
            </v-toolbar-items>
        </v-toolbar>
        <v-card-title class="headline">Do the following...</v-card-title>
        <v-card-text>
            <v-form v-model="valid" ref="form">
                <v-container class="ma-0 pa-0" fluid>
                    <v-row no-gutters>
                        <v-col cols="12">
                            <v-select label="Select an action..." v-model="selectedAction" :items="recipeActions" dense outlined rounded return-object></v-select>
                            <div v-if="selectedAction.value == 'gear'">
                                <v-select label="Select a gear..." v-model="selectedGear" item-value="id" item-text="name" :items="gears" dense outlined rounded return-object></v-select>
                            </div>
                            <div v-else-if="selectedAction.value == 'sportType'">
                                <v-select label="Select a sport..." v-model="selectedSportType" item-value="value" item-text="text" :items="sportTypes" dense outlined rounded return-object></v-select>
                            </div>
                            <div v-else-if="selectedAction.value == 'workoutType'">
                                <v-select label="Select a workout type..." v-model="selectedWorkoutType" item-value="value" item-text="text" :items="workoutTypes" dense outlined rounded return-object></v-select>
                            </div>
                            <div v-else-if="selectedAction.value == 'mapStyle'">
                                <v-select label="Select a map style..." v-model="selectedMapStyle" item-value="value" item-text="text" :items="mapStyles" dense outlined rounded return-object></v-select>
                            </div>
                            <div v-else-if="actionIsDescription">
                                <v-textarea label="Notes..." v-model="valueInput" height="160" :rules="[recipeRules.required]" :maxlength="$store.state.recipeMaxLength.actionValue" dense outlined no-resize></v-textarea>
                            </div>
                            <div v-else-if="selectedAction.value && !booleanActions.includes(selectedAction.value)">
                                <v-text-field v-model="valueInput" :label="selectedAction.text" :rules="actionRules" :maxlength="$store.state.recipeMaxLength.actionValue" dense outlined rounded></v-text-field>
                            </div>
                            <div class="action-activity-tags" v-if="actionIsText">
                                <h3 class="mb-2">Activity tags</h3>
                                <v-chip @click="addTag('counter')" small>Counter</v-chip>
                                <v-chip @click="addTag('distance')" small>Distance</v-chip>
                                <v-chip @click="addTag('speedAvg')" small>Avg speed</v-chip>
                                <v-chip @click="addTag('speedMax')" small>Max speed</v-chip>
                                <v-chip @click="addTag('cadenceAvg')" small>Avg cadence</v-chip>
                                <v-chip @click="addTag('wattsAvg')" small>Avg watts</v-chip>
                                <v-chip @click="addTag('wattsWeighted')" small>Weighted watts</v-chip>
                                <v-chip @click="addTag('wattsMax')" small>Max watts</v-chip>
                                <v-chip @click="addTag('hrAvg')" small>Avg HR</v-chip>
                                <v-chip @click="addTag('hrMax')" small>Max HR</v-chip>
                                <v-chip @click="addTag('calories')" small>Calories</v-chip>
                                <v-chip @click="addTag('relativeEffort')" small>Relative effort</v-chip>
                                <v-chip @click="addTag('perceivedExertion')" small>Perceived Exertion</v-chip>
                                <v-chip @click="addTag('tss')" small>TSS</v-chip>
                                <v-chip @click="addTag('elevationGain')" small>Elevation gain</v-chip>
                                <v-chip @click="addTag('elevationMax')" small>Max elevation</v-chip>
                                <v-chip @click="addTag('totalTime')" small>Total time</v-chip>
                                <v-chip @click="addTag('movingTime')" small>Moving time</v-chip>
                                <v-chip @click="addTag('lapCount')" small>Lap count</v-chip>
                                <v-chip @click="addTag('lapDistance')" small>Lap distance</v-chip>
                                <v-chip @click="addTag('lapTime')" small>Lap time</v-chip>
                                <v-chip @click="addTag('device')" small>Device</v-chip>
                                <h3 class="mt-3 mb-2">Weather tags</h3>
                                <v-chip @click="addTag('weather.icon')" small>Icon</v-chip>
                                <v-chip @click="addTag('weather.summary')" small>Summary</v-chip>
                                <v-chip @click="addTag('weather.temperature')" small>Temp. (real)</v-chip>
                                <v-chip @click="addTag('weather.feelsLike')" small>Temp. (feels like)</v-chip>
                                <v-chip @click="addTag('weather.humidity')" small>Humidity</v-chip>
                                <v-chip @click="addTag('weather.pressure')" small>Pressure</v-chip>
                                <v-chip @click="addTag('weather.windSpeed')" small>Wind speed</v-chip>
                                <v-chip @click="addTag('weather.windDirection')" small>Wind direction</v-chip>
                                <v-chip @click="addTag('weather.precipitation')" small>Precipitation</v-chip>
                            </div>
                            <div class="text-center mb-2 mt-n2" v-if="selectedAction.value == 'generateName'">
                                You can try some auto-generated names
                                <a href="/activities/fortune" title="Activity fortune" target="activityFortune">here</a>.
                            </div>
                        </v-col>
                    </v-row>
                    <v-row no-gutters>
                        <v-col class="mt-4 text-center" cols="12">
                            <v-btn color="primary" @click="save" title="Save this action" :disabled="!selectedAction.value" rounded>
                                <v-icon left>mdi-check</v-icon>
                                Save action
                            </v-btn>
                        </v-col>
                    </v-row>
                </v-container>
            </v-form>
        </v-card-text>
    </v-card>
</template>

<style>
.action-activity-tags .v-chip {
    margin: 1px 2px 10px -1px;
}
</style>

<script>
import _ from "lodash"
import userMixin from "~/mixins/userMixin.js"
import recipeMixin from "~/mixins/recipeMixin.js"
import stravaMixin from "~/mixins/stravaMixin.js"

export default {
    mixins: [userMixin, recipeMixin, stravaMixin],
    props: ["disabled-actions"],
    data() {
        return this.initialData()
    },
    computed: {
        actionRules() {
            if (this.selectedAction.value == "webhook") {
                return [this.recipeRules.required, this.recipeRules.url]
            }
            return [this.recipeRules.required]
        },
        actionIsDescription() {
            return ["description", "prependDescription", "appendDescription", "privateNote"].includes(this.selectedAction.value)
        },
        actionIsText() {
            return ["name", "prependName", "appendName", "description", "prependDescription", "appendDescription", "privateNote"].includes(this.selectedAction.value)
        }
    },
    watch: {
        disabledActions(arr) {
            this.filterActions(arr)
        }
    },
    methods: {
        initialData(filter) {
            let recipeActions = this.filterActions(this.disabledActions)

            // Get bikes and shoes and create gears list.
            const bikes = _.cloneDeep(this.$store.state.user.profile.bikes)
            for (let bike of bikes) {
                bike.name = `${bike.name} (bike)`
            }
            const shoes = _.cloneDeep(this.$store.state.user.profile.shoes)
            for (let shoe of shoes) {
                shoe.name = `${shoe.name} (shoes)`
            }
            const gears = _.concat([{id: "none", name: "None"}], bikes, shoes)

            // Activity / sport, workout types and map styles.
            const sportTypes = this.$store.state.sportTypes.map((st) => {
                return {value: st, text: this.getSportName(st)}
            })
            const workoutTypes = _.cloneDeep(this.$store.state.workoutTypes)
            const mapStyles = _.cloneDeep(this.$store.state.mapStyles)

            return {
                action: {},
                loading: false,
                valid: true,
                recipeActions: recipeActions,
                selectedAction: {},
                selectedGear: {},
                selectedSportType: {},
                selectedWorkoutType: {},
                selectedMapStyle: {},
                gears: gears,
                sportTypes: sportTypes,
                workoutTypes: workoutTypes,
                mapStyles: mapStyles,
                valueInput: ""
            }
        },
        filterActions(arr) {
            const recipeActions = _.cloneDeep(this.$store.state.recipeActions)
            arr = _.cloneDeep(arr)

            // Make sure we disable related actions that were already set.
            if (arr.includes("name")) {
                arr.push("prependName")
                arr.push("appendName")
            }
            if (arr.includes("prependName")) {
                arr.push("name")
            }
            if (arr.includes("appendName")) {
                arr.push("name")
            }
            if (arr.includes("description")) {
                arr.push("prependDescription")
                arr.push("appendDescription")
            }
            if (arr.includes("prependDescription")) {
                arr.push("description")
            }
            if (arr.includes("appendDescription")) {
                arr.push("description")
            }

            arr = _.uniq(arr)

            // Iterate actions already set for the current automation recipe.
            for (let existingAction of arr) {
                const item = _.find(recipeActions, {value: existingAction})
                item.disabled = true
            }

            // Webhook is enabled only on PRO accounts.
            if (!this.$store.state.user.isPro) {
                const webhook = _.find(recipeActions, {value: "webhook"})
                webhook.disabled = true
                webhook.text += " (PRO only)"
            }

            this.recipeActions = recipeActions
            return recipeActions
        },
        cancel() {
            this.$emit("closed", false)
            const reset = () => Object.assign(this.$data, this.initialData())
            setTimeout(reset, 500)
        },
        save() {
            if (this.$refs.form.validate()) {
                const result = {
                    type: this.selectedAction.value
                }

                if (result.type == "gear") {
                    result.value = this.selectedGear.id
                    result.friendlyValue = this.selectedGear.name
                } else if (result.type == "sportType") {
                    result.value = this.selectedSportType.value
                    result.friendlyValue = this.selectedSportType.text
                } else if (result.type == "workoutType") {
                    result.value = this.selectedWorkoutType.value
                    result.friendlyValue = this.selectedWorkoutType.text
                } else if (result.type == "mapStyle") {
                    result.value = this.selectedMapStyle.value
                    result.friendlyValue = this.selectedMapStyle.text
                } else {
                    result.value = this.valueInput || true
                }

                this.$emit("closed", result)
                Object.assign(this.$data, this.initialData())
            }
        },
        addTag(tag) {
            this.valueInput += "${" + tag + "} "
        }
    }
}
</script>
