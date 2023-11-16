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
                            <v-autocomplete v-model="selectedAction" label="Select an action..." :items="recipeActions" @change="actionOnChange" dense outlined rounded return-object></v-autocomplete>
                            <template v-if="selectedAction">
                                <div v-if="selectedAction.value == 'commute'">
                                    <v-select label="Commute tag..." v-model="selectedCommute" item-value="id" item-text="name" :items="commuteFlags" dense outlined rounded return-object></v-select>
                                </div>
                                <div v-else-if="selectedAction.value == 'gear'">
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
                                <div v-else-if="selectedAction.value == 'generateName'">
                                    <v-select label="Select a humour..." v-model="selectedAiHumour" item-value="value" item-text="text" :items="aiHumours" dense outlined rounded return-object></v-select>
                                </div>
                                <div v-else-if="selectedAction.value && !booleanActions.includes(selectedAction.value)">
                                    <Mentionable :keys="['$']" :items="activityTags" offset="1">
                                        <v-textarea
                                            v-model="valueInput"
                                            :css="actionIsDescription ? '' : 'overflow-hidden'"
                                            :height="actionIsDescription ? 160 : 30"
                                            :label="actionIsDescription ? 'Notes...' : selectedAction.text"
                                            :rules="actionRules"
                                            :maxlength="$store.state.recipeMaxLength.actionValue"
                                            @keydown="inputKeyDown($event)"
                                            dense
                                            outlined
                                            rounded
                                            no-resize
                                        ></v-textarea>
                                    </Mentionable>
                                </div>
                                <div v-if="actionIsText" class="mt-n1 text-caption text-center text-md-left">
                                    Type $ to display the available activity tags, then keep typing to search for the desired tag.
                                    <br />
                                    Examples: ${distance} ${speedAvg} ${totalTime}
                                </div>
                                <div class="text-center mb-2 mt-n2" v-if="selectedAction.value == 'generateName'">
                                    You can try some auto-generated names
                                    <a href="/activities/fortune" title="Fortune cookies (aka. ChatGPT name generator)" target="activityFortune">here</a>.
                                </div>
                            </template>
                        </v-col>
                    </v-row>
                    <v-row no-gutters>
                        <v-col class="mt-4 text-center" cols="12">
                            <v-btn color="primary" @click="save" title="Save this action" :disabled="!selectedAction?.value" rounded>
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
    margin: 0 5px 8px 0;
}
</style>

<script>
import {Mentionable} from "vue-mention"
import _ from "lodash"
import userMixin from "~/mixins/userMixin.js"
import recipeMixin from "~/mixins/recipeMixin.js"
import stravaMixin from "~/mixins/stravaMixin.js"

export default {
    components: {Mentionable},
    mixins: [userMixin, recipeMixin, stravaMixin],
    props: ["disabled-actions"],
    data() {
        return this.initialData()
    },
    computed: {
        actionRules() {
            return this.selectedAction?.value == "webhook" ? [this.recipeRules.required, this.recipeRules.url] : [this.recipeRules.required]
        },
        actionIsDescription() {
            return this.selectedAction && ["description", "prependDescription", "appendDescription", "privateNote"].includes(this.selectedAction.value)
        },
        actionIsText() {
            return this.selectedAction && ["name", "prependName", "appendName", "description", "prependDescription", "appendDescription", "privateNote"].includes(this.selectedAction.value)
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

            const commuteFlags = [
                {id: true, name: "Yes"},
                {id: false, name: "No"}
            ]

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

            // Activity / sport, workout types, map styles and AI humours.
            const sportTypes = this.$store.state.sportTypes.map((st) => {
                return {value: st, text: this.getSportName(st)}
            })
            const workoutTypes = _.cloneDeep(this.$store.state.workoutTypes)
            const mapStyles = _.cloneDeep(this.$store.state.mapStyles)
            const aiHumours = _.cloneDeep(this.$store.state.aiHumours).map((h) => {
                return {value: h, text: h.charAt(0).toUpperCase() + h.slice(1)}
            })
            aiHumours.unshift({value: "", text: "Random"})

            // Activity general tags.
            const generalTags = [
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
                {value: "device", label: "Device"}
            ]

            // Activity performance tags.
            const performanceTags = [
                {value: "wattsAvg", label: "Avg watts"},
                {value: "wattsWeighted", label: "Weighted watts"},
                {value: "wattsMax", label: "Max watts"},
                {value: "wattsKg", label: "Watts / kg"},
                {value: "tss", label: "TSS"},
                {value: "hrAvg", label: "Avg HR"},
                {value: "hrMax", label: "Max HR"},
                {value: "calories", label: "Calories"},
                {value: "relativeEffort", label: "Relative effort"},
                {value: "perceivedExertion", label: "Perceived exertion"}
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

            // Music track tags.
            const musicTags = [
                {value: "trackList", label: "Spotify: Full track list"},
                {value: "trackStart", label: "Spotify: track title (start)"},
                {value: "trackEnd", label: "Spotify: track title (end)"},
                {value: "lyricsStart", label: "Spotify: track lyrics (first)", pro: true},
                {value: "lyricsEnd", label: "Spotify: track lyrics (last)", pro: true}
            ]

            // Combine activity tags.
            const activityTags = _.concat(generalTags, performanceTags, lapTags, locationTags, musicTags, weatherTags)
            for (let t of activityTags) {
                t.value = "{" + t.value + "}"
            }

            return {
                action: {},
                loading: false,
                valid: true,
                recipeActions: recipeActions,
                selectedAction: {},
                selectedCommute: {},
                selectedGear: {},
                selectedSportType: {},
                selectedWorkoutType: {},
                selectedMapStyle: {},
                selectedAiHumour: aiHumours[0],
                commuteFlags: commuteFlags,
                gears: gears,
                sportTypes: sportTypes,
                workoutTypes: workoutTypes,
                mapStyles: mapStyles,
                aiHumours: aiHumours,
                showTags: false,
                activityTags: activityTags,
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
        getChipText(tag) {
            return tag.pro && !this.user.isPro ? `${tag.text} - PRO only` : tag.text
        },
        actionOnChange() {
            if (!this.actionIsDescription && this.actionIsText && this.valueInput) {
                this.valueInput = this.valueInput.replace(/(?:\r\n|\r|\n)/g, " ")
            }
        },
        inputKeyDown(e) {
            if (!this.actionIsDescription && e.keyCode == 13) {
                if (e.preventDefault) {
                    e.preventDefault()
                }
                return false
            }
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

                if (result.type == "commute") {
                    result.value = this.selectedCommute.id
                    result.friendlyValue = this.selectedCommute.id ? "yes" : "no"
                } else if (result.type == "gear") {
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
                } else if (result.type == "generateName" && (!this.selectedAiHumour || this.selectedAiHumour.value != "random")) {
                    result.value = this.selectedAiHumour.value
                    result.friendlyValue = this.selectedAiHumour.text
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
