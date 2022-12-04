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
                            <div v-if="actionIsText">
                                <v-btn v-if="!showTags" class="mb-4" title="View activity and weather tags" @click="showTags = true" rounded x-small>
                                    <v-icon>mdi-chevron-down</v-icon>
                                    View available tags
                                </v-btn>
                                <v-tabs v-if="showTags" height="36" background-color="accent" :fixed-tabs="!$breakpoint.mdAndUp" v-model="tabTags">
                                    <v-tab>Activity tags</v-tab>
                                    <v-tab>Weather tags</v-tab>
                                    <v-tab>Music tags</v-tab>
                                </v-tabs>
                                <v-tabs-items class="action-activity-tags" v-model="tabTags">
                                    <v-tab-item class="pt-4">
                                        <template v-for="aTags in activityTags">
                                            <h3>{{ aTags.title }} stats</h3>
                                            <v-card class="grey darken-4 pl-2 pt-2 mb-4" outlined>
                                                <v-chip v-for="tag in aTags.tags" @click="addTag(tag.key)" :key="'tag-' + tag.key" small>{{ tag.text }}</v-chip>
                                            </v-card>
                                        </template>
                                    </v-tab-item>
                                    <v-tab-item class="pt-4">
                                        <template v-for="wTags in weatherTags">
                                            <h3>{{ wTags.title }} of activity</h3>
                                            <v-card class="grey darken-4 pl-2 pt-2 mb-4" outlined>
                                                <v-chip v-for="tag in wTags.tags" @click="addTag('weather.' + wTags.title.toLowerCase() + '.' + tag.key)" :key="'tag-' + tag.key" small>{{ tag.text }}</v-chip>
                                            </v-card>
                                        </template>
                                    </v-tab-item>
                                    <v-tab-item class="pt-4">
                                        <template v-if="!user.spotify">
                                            <div class="ml-2 mr-2 mb-2">
                                                To use music tags, you need to link your Spotify
                                                <n-link to="/account?spotify=link" title="My account" nuxt>account</n-link> first.
                                            </div>
                                        </template>
                                        <template v-for="mTags in musicTags" v-else>
                                            <h3>{{ mTags.title }}</h3>
                                            <v-card class="grey darken-4 pl-2 pt-2 mb-4" outlined>
                                                <v-chip v-for="tag in mTags.tags" @click="addTag(mTags.source + '.' + tag.key)" :key="'tag-' + tag.key" small>{{ tag.text }}</v-chip>
                                            </v-card>
                                        </template>
                                    </v-tab-item>
                                </v-tabs-items>
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
    margin: 0 5px 8px 0;
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

            // Activity general tags.
            const activityGeneralTags = [
                {key: "counter", text: "Counter"},
                {key: "distance", text: "Distance"},
                {key: "speedAvg", text: "Avg speed"},
                {key: "speedMax", text: "Max speed"},
                {key: "paceAvg", text: "Avg pace"},
                {key: "paceMax", text: "Max pace"},
                {key: "cadenceAvg", text: "Avg cadence"},
                {key: "elevationGain", text: "Elevation gain"},
                {key: "elevationMax", text: "Max elevation"},
                {key: "totalTime", text: "Total time"},
                {key: "movingTime", text: "Moving time"},
                {key: "device", text: "Device"}
            ]

            // Activity performance tags.
            const activityPerfTags = [
                {key: "wattsAvg", text: "Avg watts"},
                {key: "wattsWeighted", text: "Weighted watts"},
                {key: "wattsMax", text: "Max watts"},
                {key: "wattsKg", text: "Watts / kg"},
                {key: "tss", text: "TSS"},
                {key: "hrAvg", text: "Avg HR"},
                {key: "hrMax", text: "Max HR"},
                {key: "calories", text: "Calories"},
                {key: "relativeEffort", text: "Relative efftort"},
                {key: "perceivedExertion", text: "Perceived exertion"}
            ]

            // Activity lap tags.
            const activityLapTags = [
                {key: "lapCount", text: "Lap count"},
                {key: "lapDistance", text: "Lap distance"},
                {key: "lapTime", text: "Lap time"}
            ]

            // Combine activity tags.
            const mapActivityTags = [
                {title: "General", tags: activityGeneralTags},
                {title: "Performance", tags: activityPerfTags},
                {title: "Lap", tags: activityLapTags}
            ]

            // Weather tags.
            const weatherTags = [
                {key: "icon", text: "Icon"},
                {key: "summary", text: "Summary"},
                {key: "temperature", text: "Temp. (real)"},
                {key: "feelsLike", text: "Temp. (feels like)"},
                {key: "humidity", text: "Humidity"},
                {key: "pressure", text: "Pressure"},
                {key: "windSpeed", text: "Wind speed"},
                {key: "windDirection", text: "Wind direction"},
                {key: "precipitation", text: "Precipitation"}
            ]

            // Combine weather tags.
            const mapWeatherTags = [
                {title: "Start", tags: weatherTags},
                {title: "End", tags: weatherTags}
            ]

            // Music track tags.
            const trackTags = [
                {key: "trackStart", text: "Starting track"},
                {key: "trackEnd", text: "Last played track"},
                {key: "trackList", text: "Full track list"}
            ]

            // Combine music tags.
            const mapMusicTags = [{title: "Spotify", source: "spotify", tags: trackTags}]

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
                showTags: false,
                tabTags: null,
                activityTags: mapActivityTags,
                weatherTags: mapWeatherTags,
                musicTags: mapMusicTags,
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
