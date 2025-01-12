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
                            <v-autocomplete v-model="selectedAction" label="Select an action" :items="recipeActions" @change="actionOnChange" dense outlined rounded return-object></v-autocomplete>
                            <template v-if="selectedAction">
                                <div v-if="selectedAction.value == 'commute'">
                                    <v-select label="Commute tag" v-model="selectedCommute" item-value="id" item-text="name" :items="commuteFlags" dense outlined rounded return-object></v-select>
                                </div>
                                <div v-else-if="selectedAction.value == 'gear'">
                                    <v-select label="Select a gear" v-model="selectedGear" item-value="id" item-text="name" :items="gears" dense outlined rounded return-object></v-select>
                                </div>
                                <div v-else-if="selectedAction.value?.includes('GearComponent')">
                                    <v-select label="Select a component" v-model="selectedGearComponent" item-value="id" item-text="name" :items="gearComponents" dense outlined rounded return-object></v-select>
                                </div>
                                <div v-else-if="selectedAction.value == 'sportType'">
                                    <v-select label="Select a sport" v-model="selectedSportType" item-value="value" item-text="text" :items="sportTypes" dense outlined rounded return-object></v-select>
                                </div>
                                <div v-else-if="selectedAction.value == 'workoutType'">
                                    <v-select label="Select a workout type" v-model="selectedWorkoutType" item-value="value" item-text="text" :items="workoutTypes" dense outlined rounded return-object></v-select>
                                </div>
                                <div v-else-if="selectedAction.value == 'mapStyle'">
                                    <v-select label="Select a map style" v-model="selectedMapStyle" item-value="value" item-text="text" :items="mapStyles" dense outlined rounded return-object></v-select>
                                </div>
                                <div v-else-if="actionIsAI">
                                    <v-select label="Select a humour" v-model="selectedAiHumour" item-value="value" item-text="text" :items="aiHumours" dense outlined rounded return-object></v-select>
                                    <v-textarea
                                        v-if="selectedAiHumour.value == 'custom'"
                                        v-model="valueInput"
                                        height="100"
                                        label="Custom AI prompt"
                                        :maxlength="$store.state.recipeMaxLength.actionValue"
                                        @keydown="inputKeyDown($event)"
                                        dense
                                        outlined
                                        rounded
                                        no-resize
                                    ></v-textarea>
                                </div>
                                <div v-else-if="selectedAction.value == 'webhook'">
                                    <div>
                                        <v-select label="HTTP method" v-model="webhookMethod" :items="['POST', 'GET']" dense outlined rounded></v-select>
                                    </div>
                                    <div>
                                        <v-text-field label="Webhook URL" placeholder="https://" v-model="webhookUrl" :rules="webhookActionRules" dense outlined rounded></v-text-field>
                                    </div>
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
                                    Example: ${distance} ${speedAvg} ${totalTime}
                                </div>
                                <div class="text-center mb-2 mt-n2" v-if="actionIsAI">
                                    You can test and try some AI features
                                    <a href="/activities/fortune" title="Fortune cookies (aka. AI name and poem generator)" target="activityFortune">here</a>.
                                </div>
                            </template>
                        </v-col>
                    </v-row>
                    <v-row no-gutters>
                        <v-col class="mt-4 text-center" cols="12">
                            <v-btn color="primary" @click="save" title="Save this action" :loading="loading" :disabled="!selectedAction?.value" rounded>
                                <v-icon left>mdi-check</v-icon>
                                Save action
                            </v-btn>
                        </v-col>
                    </v-row>
                    <v-row v-if="actionIsText" no-gutters>
                        <v-col class="text-center mt-4" cols="12">
                            <v-btn v-if="!showTags" @click="showTags = true" title="View all available tags" rounded x-small>
                                <v-icon left>mdi-chevron-down</v-icon>
                                View all tags
                            </v-btn>
                            <v-card v-else>
                                <v-card-text class="pa-0 ma-0">
                                    <h4 class="mb-1">Available tags</h4>
                                    <div style="max-height: 140px" class="overflow-y-auto">
                                        <v-chip
                                            v-for="tag in activityTags"
                                            :key="tag.value"
                                            @click="addTag(tag.value)"
                                            :title="getChipText(tag)"
                                            :tooltip="getChipText(tag)"
                                            :small="$breakpoint.mdAndUp"
                                            :x-small="!$breakpoint.mdAndUp"
                                            class="ml-1 mr-1 mb-1"
                                            >{{ tag.value.substring(1, tag.value.length - 1) }}</v-chip
                                        >
                                    </div>
                                </v-card-text>
                            </v-card>
                        </v-col>
                    </v-row>
                </v-container>
            </v-form>
        </v-card-text>
    </v-card>
</template>

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
        activityTags() {
            return this.mainActivityTags ? _.concat(this.mainActivityTags, this.extraActivityTags) : []
        },
        actionRules() {
            return this.selectedAction?.value != "webhook" ? [this.recipeRules.required] : []
        },
        webhookActionRules() {
            return this.selectedAction?.value == "webhook" ? [this.recipeRules.required, this.recipeRules.url] : []
        },
        actionIsDescription() {
            return this.selectedAction && ["description", "prependDescription", "appendDescription", "privateNote"].includes(this.selectedAction.value)
        },
        actionIsText() {
            return this.selectedAction && ["name", "prependName", "appendName", "description", "prependDescription", "appendDescription", "privateNote", "prependPrivateNote", "appendPrivateNote"].includes(this.selectedAction.value)
        },
        actionIsAI() {
            return this.selectedAction && ["generateName", "generateDescription", "generateInsights"].includes(this.selectedAction.value)
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

            // GearWear components.
            const gearComponents = []
            for (let g of Object.values(this.$store.state.gearwear)) {
                g.components?.forEach((c) => gearComponents.push({id: `${g.id}: ${c.name}`, name: `${g.name} - ${c.name}`}))
            }
            if (gearComponents.length == 0) {
                _.find(recipeActions, {value: "enableGearComponent"}).disabled = true
                _.find(recipeActions, {value: "disableGearComponent"}).disabled = true
            }

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
            aiHumours.push({value: "custom", text: `Use a custom prompt${!this.$store.state.user.isPro ? " (PRO only)" : ""}`, disabled: !this.$store.state.user.isPro})

            return {
                action: {},
                loading: false,
                valid: true,
                recipeActions: recipeActions,
                selectedAction: {},
                selectedCommute: commuteFlags[0],
                selectedGear: {},
                selectedGearComponent: {},
                selectedSportType: {},
                selectedWorkoutType: {},
                selectedMapStyle: {},
                selectedAiHumour: aiHumours[0],
                webhookMethod: "POST",
                webhookUrl: "",
                commuteFlags: commuteFlags,
                gears: gears,
                gearComponents: gearComponents,
                sportTypes: sportTypes,
                workoutTypes: workoutTypes,
                mapStyles: mapStyles,
                aiHumours: aiHumours,
                showTags: false,
                valueInput: ""
            }
        },
        filterActions(arr) {
            const recipeActions = _.cloneDeep(this.$store.state.recipeActions)
            arr = _.cloneDeep(arr)

            // Make sure we disable related actions that were already set.
            if (arr.includes("name")) {
                arr.push("generateName")
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
                arr.push("generateDescription")
                arr.push("prependDescription")
                arr.push("appendDescription")
            }
            if (arr.includes("prependDescription")) {
                arr.push("description")
            }
            if (arr.includes("appendDescription")) {
                arr.push("description")
            }
            if (arr.includes("privateNote")) {
                arr.push("prependPrivateNote")
                arr.push("appendPrivateNote")
            }
            if (arr.includes("prependPrivateNote")) {
                arr.push("privateNote")
            }
            if (arr.includes("appendPrivateNote")) {
                arr.push("privateNote")
            }

            arr = _.uniq(arr)

            // Iterate actions already set for the current automation recipe.
            for (let existingAction of arr) {
                const item = _.find(recipeActions, {value: existingAction})
                if (item) item.disabled = true
            }

            // Some actions are enabled only on PRO accounts.
            if (!this.$store.state.user.isPro) {
                const proText = " (PRO only)"
                const webhook = _.find(recipeActions, {value: "webhook"})
                webhook.disabled = true
                webhook.text += proText
                const generateDescription = _.find(recipeActions, {value: "generateDescription"})
                generateDescription.disabled = true
                generateDescription.text += proText
                const generateInsights = _.find(recipeActions, {value: "generateInsights"})
                generateInsights.disabled = true
                generateInsights.text += proText
            }

            this.recipeActions = recipeActions
            return recipeActions
        },
        getChipText(tag) {
            return tag.pro && !this.user.isPro ? `${tag.text || tag.label} - PRO only` : tag.text || tag.label
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
        async save() {
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
                } else if (result.type.includes("GearComponent")) {
                    result.value = this.selectedGearComponent.id
                    result.friendlyValue = this.selectedGearComponent.name
                } else if (result.type == "sportType") {
                    result.value = this.selectedSportType.value
                    result.friendlyValue = this.selectedSportType.text
                } else if (result.type == "workoutType") {
                    result.value = this.selectedWorkoutType.value
                    result.friendlyValue = this.selectedWorkoutType.text
                } else if (result.type == "mapStyle") {
                    result.value = this.selectedMapStyle.value
                    result.friendlyValue = this.selectedMapStyle.text
                } else if (result.type == "webhook") {
                    const webhookValue = `${this.webhookMethod} ${this.webhookUrl}`
                    result.value = webhookValue
                    result.friendlyValue = webhookValue
                } else if (this.actionIsAI && (!this.selectedAiHumour || this.selectedAiHumour.value != "random")) {
                    if (this.selectedAiHumour.value == "custom") {
                        this.loading = true
                        try {
                            const promptResult = await this.$axios.$post(`/api/ai/${this.user.id}/validate-prompt`, {prompt: this.valueInput.trim()})
                            if (promptResult.failed) {
                                this.valueInput = `Prompt failed moderation: ${promptResult.failed}`
                                return
                            }
                        } catch (aiEx) {
                            this.valueInput = `Prompt failed moderation: ${aiEx.toString()}`
                            return
                        } finally {
                            this.loading = false
                        }

                        result.value = "custom" + promptResult.prompt
                        result.friendlyValue = "custom prompt: " + promptResult.prompt
                    } else {
                        result.value = this.selectedAiHumour.value
                        result.friendlyValue = this.selectedAiHumour.text
                    }
                } else {
                    result.value = this.valueInput || true
                }

                this.$emit("closed", result)
                Object.assign(this.$data, this.initialData())
            }
        },
        addTag(tag) {
            this.valueInput += "$" + tag
        }
    }
}
</script>
