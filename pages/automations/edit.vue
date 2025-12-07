<template>
    <v-layout column>
        <v-container v-if="recipe" fluid>
            <h1>
                {{ recipe.id ? "Edit" : "New" }} automation
                <v-btn v-if="recipe.id || templateId" class="float-right mt-3 text-h6 font-weight-bold" color="primary" :title="asJson ? 'Switch to form' : 'Switch to JSON'" @click="toggleMode()" x-small fab rounded nuxt>
                    <v-icon small>{{ asJson ? "mdi-form-select" : "mdi-code-json" }}</v-icon>
                </v-btn>
            </h1>
            <v-form v-model="valid" class="mb-0" ref="form">
                <v-text-field v-model="recipe.title" :rules="[recipeRules.required]" label="Automation name" :maxlength="$store.state.recipeMaxLength.title" @keyup="checkValid()" outlined rounded></v-text-field>
            </v-form>

            <template v-if="asJson">
                <v-card outlined>
                    <v-card-title>Conditions and actions (JSON)</v-card-title>
                    <v-card-text :class="{'compact-editor': $breakpoint.smAndDown}">
                        <template v-if="asJson">
                            <client-only>
                                <JsonEditorVue v-model="jsonData" class="jse-theme-dark" :validator="validateJson" :indentation="$breakpoint.smAndDown ? 2 : 4" />
                            </client-only>
                            <v-alert color="error" v-if="jsonErrors.length > 0" class="mt-4">
                                <div class="font-weight-bold">JSON validation errors</div>
                                <ul class="ml-n2">
                                    <li v-for="err in jsonErrors">{{ err.message }}.</li>
                                </ul>
                            </v-alert>

                            <div class="text-center text-md-left mt-4">
                                <v-btn color="primary" title="Save this automation" @click="showJsonSpecsDialog" small rounded>
                                    <v-icon left>mdi-help-circle</v-icon>
                                    JSON Help
                                </v-btn>
                            </div>

                            <v-dialog v-model="jsonSpecsDialog" width="640" overlay-opacity="0.95" :fullscreen="$breakpoint.smAndDown">
                                <v-card>
                                    <v-toolbar color="primary">
                                        <v-toolbar-title>Automation JSON Help</v-toolbar-title>
                                        <v-spacer></v-spacer>
                                        <v-toolbar-items>
                                            <v-btn icon @click.stop="hideJsonSpecsDialog">
                                                <v-icon>mdi-close</v-icon>
                                            </v-btn>
                                        </v-toolbar-items>
                                    </v-toolbar>
                                    <v-card-text>
                                        <div class="mt-4">
                                            <p>The following rules apply to the automation JSON source:</p>
                                            <ul class="ml-n2">
                                                <li>Must have "defaultFor" or "conditions", but not both.</li>
                                                <li>Conditions must have the following fields: "property", "operator" and "value".</li>
                                                <li>Actions must have the following fields: "type" and "value".</li>
                                                <li>A "friendlyValue" can be added to conditions and actions to describe what it does.</li>
                                            </ul>
                                            <p class="mt-2">Below you'll find a list of all available condition properties and actions.</p>
                                            <v-autocomplete v-model="jsonSpecsItem" label="Condition properties and action types" :items="recipePropertiesActions" item-text="value" dense outlined rounded return-object></v-autocomplete>

                                            <v-alert color="accent" v-if="jsonSpecsItem" class="mt-n2">
                                                <div v-if="jsonSpecsItem.value == 'defaultFor'" class="subtitle-1 font-weight-bold">
                                                    {{ jsonSpecsItem.text }}
                                                </div>
                                                <div v-else-if="jsonSpecsItem.operators">
                                                    <div class="subtitle-1">
                                                        Property:
                                                        <span class="font-weight-bold">{{ jsonSpecsItem.text }}</span>
                                                    </div>
                                                    <div class="subtitle-1">
                                                        Value type:
                                                        <span class="font-weight-bold">{{ jsonSpecsItem.type }}</span>
                                                        <span v-if="jsonSpecsItem.type == 'time'">(HH:MM)</span>
                                                        <span v-else-if="jsonSpecsItem.type == 'location'">(lat, lon)</span>
                                                    </div>
                                                    <div class="mt-1 mb-1">Operators:</div>
                                                    <ul class="ml-n2">
                                                        <li v-for="o in jsonSpecsItem.operators">
                                                            <span class="font-weight-bold">{{ o.value }}</span> - {{ o.text }}
                                                        </li>
                                                    </ul>
                                                </div>
                                                <div class="subtitle-1" v-else>
                                                    Action: <span class="font-weight-bold">{{ jsonSpecsItem.text }}</span>
                                                </div>
                                                <v-select
                                                    v-if="jsonSpecsItem.value == 'defaultFor' || jsonSpecsItem.type == 'sportType'"
                                                    label="List of sport types"
                                                    class="mt-4 mb-n4"
                                                    :items="$store.state.sportTypes"
                                                    dense
                                                    outlined
                                                    rounded
                                                ></v-select>
                                            </v-alert>
                                            <p>Further technical details can be found directly on <a href="https://github.com/strautomator/core/blob/master/src/recipes/lists.ts" target="github">GitHub</a>.</p>
                                        </div>
                                    </v-card-text>
                                </v-card>
                            </v-dialog>
                        </template>
                    </v-card-text>
                </v-card>
            </template>
            <template v-else>
                <v-card outlined>
                    <v-card-title>Conditions {{ recipe.disabled ? "(disabled)" : "" }}</v-card-title>
                    <v-card-text>
                        <div class="mb-3" v-if="recipe.defaultFor">
                            <v-container class="ma-0 pa-0 d-flex align-start" fluid>
                                <div class="mr-2">
                                    <v-icon color="removal" v-if="deleteItemSelected != recipe.defaultFor" @click="confirmDelete(recipe.defaultFor)">mdi-minus-circle-outline</v-icon>
                                    <v-icon v-if="deleteItemSelected == recipe.defaultFor" color="grey" @click="cancelDelete">mdi-cancel</v-icon>
                                </div>
                                <div class="mr-2" v-if="deleteItemSelected == recipe.defaultFor">
                                    <v-btn color="removal" @click="deleteCondition({defaultFor: recipe.defaultFor})" rounded x-small>Delete</v-btn>
                                </div>
                                <div>
                                    <span class="font-weight-bold">Default automation for all "{{ getSportName(recipe.defaultFor) }}" activities</span>
                                </div>
                            </v-container>
                        </div>
                        <template v-else-if="groupedConditions">
                            <div v-if="recipe.conditions.length > 1" class="mt-n1 mb-2">
                                <div v-if="codeLogicalOperator(recipe) == 'ALL'" class="if-then">If <strong>ALL</strong> these conditions are met:</div>
                                <div v-else-if="codeLogicalOperator(recipe) == 'ANY'" class="if-then">If <strong>ANY</strong> of these conditions are met:</div>
                                <div v-else-if="recipe.conditions.length > 2" class="if-then">If these conditions are met:</div>
                            </div>
                            <template v-for="(conditions, property, groupIndex) in groupedConditions">
                                <v-chip v-if="codeLogicalOperator(recipe) == 'SOME' && groupIndex > 0" class="ml-7 mt-n1 mb-2" small outlined>{{ recipe.op }}</v-chip>
                                <div class="mb-3" v-for="(condition, index) in conditions" :key="`${property}-c-${index}`">
                                    <v-container class="ma-0 pa-0 d-flex align-start" fluid>
                                        <div class="mr-2">
                                            <v-icon color="removal" v-if="deleteItemSelected != condition" @click="confirmDelete(condition)">mdi-minus-circle-outline</v-icon>
                                            <v-icon v-if="deleteItemSelected == condition" color="grey" @click="cancelDelete">mdi-cancel</v-icon>
                                        </div>
                                        <div class="mr-2" v-if="deleteItemSelected == condition">
                                            <v-btn color="removal" @click="deleteCondition(condition)" rounded x-small>Delete</v-btn>
                                        </div>
                                        <div>
                                            <span v-if="codeLogicalOperator(recipe) == 'SOME' && index > 0">{{ recipe.samePropertyOp.toString().toLowerCase() }}</span>
                                            <span>{{ conditionSummary(condition) }}</span>
                                        </div>
                                    </v-container>
                                </div>
                            </template>
                        </template>
                        <v-alert class="mt-3 mb-2 text-body-2" color="accent" dense v-if="needsDelay(recipe)">Some of these conditions might work best if the "Delayed processing" is enabled on your Account.</v-alert>
                        <div>
                            <v-btn class="ml-n3 mt-2" color="primary" title="Add a new condition" :disabled="!!recipe.defaultFor" @click.stop="showConditionDialog" rounded text small>
                                <v-icon class="mr-2">mdi-plus-circle</v-icon>
                                Add new condition
                            </v-btn>
                        </div>
                        <v-dialog v-model="conditionDialog" width="640" overlay-opacity="0.95" :fullscreen="$breakpoint.smAndDown" persistent>
                            <add-condition @closed="setCondition" />
                        </v-dialog>
                    </v-card-text>
                </v-card>

                <v-card class="mt-4" outlined>
                    <v-card-title>Actions {{ recipe.disabled ? "(disabled)" : "" }}</v-card-title>
                    <v-card-text>
                        <div class="mb-3" v-for="(action, index) in recipe.actions" :key="`action-${index}`">
                            <v-container class="ma-0 pa-0 d-flex align-start" fluid>
                                <div class="mr-2">
                                    <v-icon color="removal" v-if="deleteItemSelected != action" @click="confirmDelete(action)">mdi-minus-circle-outline</v-icon>
                                    <v-icon v-if="deleteItemSelected == action" color="grey" @click="cancelDelete">mdi-cancel</v-icon>
                                </div>
                                <div class="mr-2" v-if="deleteItemSelected == action">
                                    <v-btn color="removal" @click="deleteAction(action)" rounded x-small>Delete</v-btn>
                                </div>
                                <div>
                                    <span>{{ actionSummary(action) }}</span>
                                </div>
                            </v-container>
                        </div>
                        <div class="mb-3" v-if="recipe.killSwitch">
                            <v-container class="ma-0 pa-0 d-flex align-start" fluid>
                                <div class="mr-2">
                                    <v-icon color="accent">mdi-stop-circle-outline</v-icon>
                                </div>
                                <span>Stop executing further automations</span>
                            </v-container>
                        </div>
                        <div>
                            <v-btn class="ml-n3 mt-2" color="primary" title="Add a new action" @click.stop="showActionDialog" rounded text small>
                                <v-icon class="mr-2">mdi-plus-circle</v-icon>
                                Add new action
                            </v-btn>
                        </div>
                        <v-dialog v-model="actionDialog" width="640" overlay-opacity="0.95" :fullscreen="$breakpoint.smAndDown" persistent>
                            <add-action :disabled-actions="disabledActions" @closed="setAction" />
                        </v-dialog>
                    </v-card-text>
                </v-card>
            </template>

            <v-card v-if="!recipe.defaultFor && recipe.conditions.length > 1" class="mt-4" outlined>
                <v-card-title>Logical operators</v-card-title>
                <v-card-text>
                    <div v-if="recipe.conditions.length > 2">
                        <div>Within conditions of the same type.</div>
                        <v-radio-group v-model="recipe.samePropertyOp" class="mt-0 mb-0" row>
                            <v-radio label="AND" value="AND"></v-radio>
                            <v-radio label="OR" value="OR"></v-radio>
                        </v-radio-group>
                        <div>Between conditions of different types.</div>
                        <v-radio-group v-model="recipe.op" class="mt-0 mb-n4" row>
                            <v-radio label="AND" value="AND"></v-radio>
                            <v-radio label="OR" value="OR"></v-radio>
                        </v-radio-group>
                    </div>
                    <div v-else>
                        <div>Between any conditions.</div>
                        <v-radio-group v-model="recipe.op" class="mt-0 mb-n4" row>
                            <v-radio label="AND" value="AND"></v-radio>
                            <v-radio label="OR" value="OR"></v-radio>
                        </v-radio-group>
                    </div>
                </v-card-text>
            </v-card>

            <v-card v-if="recipe.id && hasCounter" class="mt-4" outlined>
                <v-card-title>Counter</v-card-title>
                <v-card-text class="mb-0 pb-0">
                    <div>You can customize which data should be used to increment the ${counter} tag.</div>
                    <v-row class="mt-6" no-gutters>
                        <v-col :cols="$breakpoint.mdAndUp ? 4 : 12" class="mr-md-4">
                            <v-select v-model="recipe.counterProp" label="Activity metadata" class="flex-shrink" :items="counterProps" dense outlined rounded></v-select>
                        </v-col>
                        <v-col v-if="requiredCounterCondition" :cols="$breakpoint.mdAndUp ? 4 : 12" class="mr-md-4">
                            <v-text-field v-model="recipe.counterCondition" :label="requiredCounterCondition.label" class="flex-shrink" dense outlined rounded></v-text-field>
                        </v-col>
                        <v-col :cols="$breakpoint.mdAndUp ? 2 : 12">
                            <v-text-field v-model="recipeStats.counter" type="number" label="Current value" min="0" max="999999" dense outlined rounded></v-text-field>
                        </v-col>
                    </v-row>
                    <template v-if="user.preferences.dateResetCounter">
                        <div class="mt-1">By default counters will auto reset every year on {{ $dayjs(user.preferences.dateResetCounter).format("MMM DD") }}, if you prefer you can disable it.</div>
                        <div class="mt-1 text-caption">This setting affects only this counter!</div>
                        <div class="mt-1 ml-n1">
                            <v-checkbox v-model="recipe.counterNoReset" label="Please do not it reset yearly" title="Disable the counter auto reset" dense />
                        </div>
                    </template>
                </v-card-text>
            </v-card>
            <div class="mt-6">
                <v-switch class="ma-0 pa-0" title="Automation kill switch" v-model="recipe.killSwitch" label="Stop executing further automations"></v-switch>
            </div>
            <div class="mt-n1">
                <v-switch class="ma-0 pa-0" title="Automation status" v-model="recipe.disabled" label="Disable this automation"></v-switch>
            </div>
            <v-alert v-if="sharedRecipe">
                This automation is based on a template shared by <a target="strava" :href="'https://www.strava.com/athletes/' + sharedRecipe.userId">{{ sharedRecipe.userDisplayName }}</a>
            </v-alert>
            <div class="text-center text-md-left mt-2">
                <v-btn color="primary" title="Save this automation" :disabled="!valid" @click="save" rounded>
                    <v-icon left>mdi-content-save</v-icon>
                    Save automation
                </v-btn>
                <br v-if="!$breakpoint.mdAndUp" />
                <v-btn color="primary" title="Duplicate this automation" class="mt-4 mt-md-0 ml-md-2" v-if="recipe.id" :disabled="!valid" @click="duplicate" rounded outlined>
                    <v-icon left>mdi-content-duplicate</v-icon>
                    Duplicate
                </v-btn>
                <br v-if="!$breakpoint.mdAndUp" />
                <v-btn color="primary" title="Share this automation" class="mt-4 mt-md-0 ml-md-2" v-if="recipe.id && user.isPro" :disabled="!valid" @click="shareRecipe(recipe)" rounded outlined>
                    <v-icon left>mdi-share-variant</v-icon>
                    Share
                </v-btn>
                <br v-if="!$breakpoint.mdAndUp" />
                <v-btn color="removal" title="Delete this automation" class="mt-4 mt-md-0 ml-md-2" v-if="recipe.id" @click.stop="showDeleteDialog" rounded outlined>
                    <v-icon left>mdi-delete</v-icon>
                    Delete automation
                </v-btn>
            </div>
            <v-dialog v-model="deleteDialog" width="440" overlay-opacity="0.95">
                <v-card>
                    <v-toolbar color="removal">
                        <v-toolbar-title>Delete automation</v-toolbar-title>
                        <v-spacer></v-spacer>
                        <v-toolbar-items>
                            <v-btn icon @click.stop="hideDeleteDialog">
                                <v-icon>mdi-close</v-icon>
                            </v-btn>
                        </v-toolbar-items>
                    </v-toolbar>
                    <v-card-text>
                        <h3 class="mt-4">{{ recipe.title }}</h3>
                        <p class="mt-2">Are you sure you want to delete this automation?</p>
                        <div class="text-right">
                            <v-spacer></v-spacer>
                            <v-btn class="mr-2" color="grey" title="Cancel, do not delete" @click.stop="hideDeleteDialog" text rounded>
                                <v-icon left>mdi-cancel</v-icon>
                                Cancel
                            </v-btn>
                            <v-btn color="removal" title="Confirm and delete automation" @click="deleteRecipe" rounded>
                                <v-icon left>mdi-check</v-icon>
                                Delete
                            </v-btn>
                        </div>
                    </v-card-text>
                </v-card>
            </v-dialog>
        </v-container>
    </v-layout>
</template>

<script>
import _ from "lodash"
import AddCondition from "~/components/recipes/AddCondition.vue"
import AddAction from "~/components/recipes/AddAction.vue"
import userMixin from "~/mixins/userMixin.js"
import recipeMixin from "~/mixins/recipeMixin.js"
import stravaMixin from "~/mixins/stravaMixin.js"

export default {
    authenticated: true,
    components: {AddCondition, AddAction},
    mixins: [userMixin, recipeMixin, stravaMixin],
    head() {
        return {
            title: this.$route.query.id ? "Edit automation" : "New automation"
        }
    },
    data() {
        const counterProps = [
            {text: "Execution count", value: null},
            {text: "Distance", value: "distance"},
            {text: "Elevation gain", value: "elevationGain"},
            {text: "Lap count", value: "lapCount"},
            {text: "Specific segment completion count", value: "segmentCounts"},
            {text: "Segment PR count", value: "prSegments"}
        ]
        const counterPropsWithCondition = ["segmentCounts"]
        return {
            recipe: null,
            recipeStats: {counter: 0},
            recipePropertiesActions: [],
            counterProps: counterProps,
            counterPropsWithCondition,
            currentCounter: 0,
            valid: false,
            disabledActions: [],
            actionDialog: false,
            conditionDialog: false,
            deleteItemSelected: false,
            deleteDialog: false,
            hasChanges: false,
            asJson: false,
            jsonSpecsDialog: false,
            jsonSpecsItem: null,
            jsonData: null,
            jsonErrors: [],
            isNew: false,
            templateId: false,
            sharedRecipe: null
        }
    },
    computed: {
        overMaxRecipes() {
            if (!this.user) return false
            return !this.user.isPro && Object.keys(this.user.recipes).length > this.$store.state.freePlanDetails.maxRecipes
        },
        hasCounter() {
            if (!this.recipe) return false
            return _.find(this.recipe.actions, (a) => _.isString(a.value) && a.value.includes("${counter}"))
        },
        changedCounter() {
            return this.recipeStats.counter != this.currentCounter
        },
        groupedConditions() {
            if (!this.recipe || !this.recipe.conditions || this.recipe.conditions.length == 0) return null
            return _.groupBy(this.recipe.conditions, "property")
        },
        requiredCounterCondition() {
            if (!this.recipe || !this.recipe.counterProp) return null
            const requiresCounterCondition = this.counterPropsWithCondition.includes(this.recipe.counterProp)
            if (!requiresCounterCondition) return null

            switch (this.recipe.counterProp) {
                case "segmentCounts":
                    return {label: "Segment ID"}
                default:
                    return null
            }
        }
    },
    watch: {
        sharedRecipe: function (newVal) {
            if (newVal) {
                const recipe = _.cloneDeep(_.pick(newVal, ["conditions", "defaultFor", "actions", "op", "samePropertyOp", "title"]))
                recipe.sharedRecipeId = newVal.id

                this.recipe = recipe
                this.valid = false
                this.isNew = true
            }
        },
        requiredCounterCondition: function (newVal) {
            if (!newVal) {
                delete this.recipe.counterCondition
            }
        }
    },
    async fetch() {
        if (this.$route.query?.template?.substring(0, 1) == "s") {
            try {
                const sharedRecipe = await this.$axios.$get(`/api/shared-recipes/${this.user.id}/${this.$route.query.template}`)
                this.sharedRecipe = sharedRecipe
            } catch (ex) {
                this.$webError(this, "AutomationEdit.fetch", "Could not fetch the shared recipe template")
            }

            return
        }

        if (!this.$route.query.id || !this.$store.state.user.recipes[this.$route.query.id]) {
            return
        }

        try {
            const recipeStats = await this.$axios.$get(`/api/users/${this.user.id}/recipes/stats/${this.$route.query.id}`)

            if (recipeStats) {
                this.recipeStats = recipeStats
                this.currentCounter = recipeStats.counter || 0
            } else {
                this.currentCounter = 0
            }
        } catch (ex) {
            this.$webError(this, "AutomationEdit.fetch", ex)
        }
    },
    mounted() {
        let valid, isNew, templateId
        let recipe = {conditions: [], actions: []}

        if (this.$route.query?.id) {
            recipe = _.cloneDeep(this.$store.state.user.recipes[this.$route.query.id])
            valid = true
            isNew = false
        } else if (this.$route.query?.template) {
            templateId = this.$route.query.template
            if (templateId?.substring(0, 1) != "s") {
                recipe = _.cloneDeep(this.$store.state.user.recipes[this.$route.query.template])
                recipe.title += " (copy)"
                delete recipe.id
                valid = false
                isNew = true
            }
        } else {
            valid = false
            isNew = true
        }

        // Invalid recipe?
        if (!recipe) {
            return this.$webError(this, "AutomationEdit.data", {status: 404, title: "Automation not found", message: `We could not find an automation recipe with ID ${this.$route.query.id}`})
        }

        // Make sure default logical operators and counter prop are set, and the counter has a decimal if using custom data.
        if (!recipe.op) recipe.op = "AND"
        if (!recipe.samePropertyOp) recipe.samePropertyOp = recipe.op
        if (!recipe.counterProp) recipe.counterProp = null
        else if (this.currentCounter) this.currentCounter = this.currentCounter.toFixed(1)

        // List of conditions and actions for the help dialog.
        const recipeProperties = _.cloneDeep(this.$store.state.recipeProperties)
        recipeProperties.forEach((p) => (p.value = `Property: ${p.value}`))
        const recipeActions = _.cloneDeep(this.$store.state.recipeActions)
        recipeActions.forEach((a) => (a.value = `Action: ${a.value}`))
        const recipePropertiesActions = _.concat([{value: "defaultFor", text: "Default automation for specific sport types"}], recipeProperties, recipeActions)

        this.recipe = recipe
        this.valid = valid
        this.isNew = isNew
        this.recipePropertiesActions = recipePropertiesActions
    },
    beforeRouteLeave(to, from, next) {
        if (this.hasChanges || this.changedCounter) {
            const answer = window.confirm("You have unsaved changes on this automation. Sure you want to leave?")

            if (answer) {
                next()
            } else {
                next(false)
            }
        } else {
            next()
        }
    },
    methods: {
        toggleMode() {
            this.updateJson()
            this.asJson = !this.asJson
        },
        updateJson() {
            try {
                if (this.asJson) {
                    const jsonData = _.isString(this.jsonData) ? JSON.parse(this.jsonData) : this.jsonData
                    const currentDefaultFor = this.recipe.defaultFor ? JSON.stringify(this.recipe.defaultFor, null, 0).replace(/ /, "") : null
                    const currentConditions = this.recipe.conditions ? JSON.stringify(this.recipe.conditions, null, 0).replace(/ /, "") : null
                    const currentActions = JSON.stringify(this.recipe.actions, null, 0).replace(/ /, "")
                    const currentData = `{"${currentDefaultFor ? "defaultFor" : "conditions"}":${currentDefaultFor || currentConditions},"actions":${currentActions}}`
                    this.hasChanges = currentData != JSON.stringify(jsonData, null, 0).replace(/ /, "")

                    if (this.jsonErrors.length == 0) {
                        if (jsonData.defaultFor) {
                            this.recipe.defaultFor = jsonData.defaultFor
                        } else {
                            this.recipe.conditions = jsonData.conditions
                        }
                        this.recipe.actions = jsonData.actions
                    }
                } else {
                    const jsonData = {}
                    if (this.recipe.defaultFor) {
                        jsonData.defaultFor = _.cloneDeep(this.recipe.defaultFor)
                    } else {
                        jsonData.conditions = _.cloneDeep(this.recipe.conditions)
                    }
                    jsonData.actions = _.cloneDeep(this.recipe.actions)
                    this.jsonData = jsonData
                    this.jsonErrors = []
                }
            } catch (ex) {
                this.jsonErrors.push({message: ex.toString()})
            }
        },
        validateJson(data) {
            const vErrors = []

            try {
                const jsonData = data

                if (!jsonData.defaultFor && (!jsonData.conditions || jsonData.conditions.length == 0)) {
                    vErrors.push({message: `A "defaultFor" or "conditions" list is mandatory`, path: []})
                } else if (jsonData.defaultFor && jsonData.conditions?.length > 0) {
                    vErrors.push({message: `Automation cannot have "defaultFor" and "conditions", please use just one`, path: []})
                }

                if (jsonData.conditions?.length > 0) {
                    for (let i = 0; i < jsonData.conditions.length; i++) {
                        const c = jsonData.conditions[i]
                        const path = ["conditions", i]
                        if (!c.property) {
                            vErrors.push({message: `Condition ${i} is missing the "property"`, path: path})
                        } else if (!_.find(this.$store.state.recipeProperties, {value: c.property})) {
                            vErrors.push({message: `Condition ${i} has an invalid "property"`, path: path})
                        }
                        if (!c.operator) {
                            vErrors.push({message: `Condition ${i} is missing an "operator"`, path: path})
                        }
                    }
                }

                if (!jsonData.actions) {
                    vErrors.push({message: `Missing the "actions" list`, path: []})
                } else if (jsonData.actions.length == 0) {
                    vErrors.push({message: `You must define at least 1 action`, path: ["actions"]})
                } else {
                    for (let i = 0; i < jsonData.actions.length; i++) {
                        const a = jsonData.actions[i]
                        if (!a.type) {
                            vErrors.push({message: `Action ${i} is missing the "property" type`, path: ["actions", i]})
                        }
                    }
                }
            } catch (ex) {
                vErrors.push(ex.toString())
            }

            this.jsonErrors = vErrors
            this.valid = vErrors.length == 0

            return vErrors
        },
        async save() {
            try {
                if (this.asJson) {
                    this.updateJson()
                    this.recipe.asJson = true
                } else {
                    delete this.recipe.asJson
                }

                this.hasChanges = false

                if (this.$refs.form.validate()) {
                    if (this.changedCounter) {
                        this.setCounter()
                    }

                    // Remove unecessary props.
                    if (this.recipe.defaultFor == null) {
                        delete this.recipe.defaultFor
                    }
                    if (!this.recipe.disabled) {
                        delete this.recipe.disabled
                    }
                    if (!this.recipe.counterProp) {
                        delete this.recipe.counterProp
                    }
                    if (!this.recipe.counterNoReset) {
                        delete this.recipe.counterNoReset
                    }

                    const url = `/api/users/${this.user.id}/recipes`
                    const recipeData = await this.$axios.$post(url, this.recipe)
                    const queryField = this.isNew ? "new" : "updated"

                    this.$store.commit("setUserRecipe", recipeData)
                    this.$router.push({path: `/automations?${queryField}=${recipeData.id}`})
                }
            } catch (ex) {
                if (ex.response?.status == 400 && ex.response?.data?.message) {
                    this.jsonErrors = [{message: ex.response.data.message}]
                } else {
                    this.$webError(this, "AutomationEdit.save", ex)
                }
            }
        },
        async duplicate() {
            try {
                document.location.href = `/automations/edit?template=${this.recipe.id}`
            } catch (ex) {
                this.$webError(this, "AutomationEdit.duplicate", ex)
            }
        },
        async setCounter() {
            try {
                this.currentCounter = this.recipeStats.counter

                const url = `/api/users/${this.user.id}/recipes/stats/${this.recipe.id}`
                const body = {id: this.recipe.id, counter: parseFloat(this.currentCounter)}
                await this.$axios.$post(url, body)
            } catch (ex) {
                this.$webError(this, "AutomationEdit.setCounter", ex)
            }
        },
        checkValid() {
            const hasConditions = this.recipe.defaultFor || this.recipe.conditions.length > 0
            this.valid = hasConditions && this.recipe.actions.length > 0 && this.jsonErrors.length == 0
        },
        needsDelay(recipe) {
            const conditions = recipe.conditions.map((c) => c.property)
            return !this.user.preferences.delayedProcessing && _.intersection(["gear", "description"], conditions).length > 0
        },
        showJsonSpecsDialog() {
            this.jsonSpecsDialog = true
        },
        hideJsonSpecsDialog() {
            this.jsonSpecsDialog = false
        },
        showActionDialog() {
            this.disabledActions = _.map(this.recipe.actions, "type").filter((t) => !t.includes("GearComponent"))
            this.conditionDialog = false
            this.actionDialog = true
        },
        showConditionDialog() {
            this.actionDialog = false
            this.conditionDialog = true
        },
        setAction(value) {
            if (value) {
                this.recipe.actions.push(value)
                this.hasChanges = true
            }

            // Reorder actions alphabetically.
            this.recipe.actions = _.sortBy(this.recipe.actions, (a) => _.find(this.$store.state.recipeActions, {value: a.type})?.text)

            this.checkValid()
            this.actionDialog = false
        },
        setCondition(value) {
            if (value) {
                if (value.defaultFor) {
                    this.recipe.defaultFor = value.defaultFor
                } else {
                    this.recipe.conditions.push(value)
                }

                this.hasChanges = true
            }

            this.checkValid()
            this.conditionDialog = false
        },
        deleteAction(action) {
            this.recipe.actions.splice(this.recipe.actions.indexOf(action), 1)
            this.checkValid()
            this.deleteItemSelected = false
            this.hasChanges = true
        },
        deleteCondition(condition) {
            if (condition.defaultFor) {
                this.recipe.defaultFor = null
            } else {
                this.recipe.conditions.splice(this.recipe.conditions.indexOf(condition), 1)
            }

            this.checkValid()
            this.deleteItemSelected = false
            this.hasChanges = true
        },
        confirmDelete(obj) {
            this.deleteItemSelected = obj
        },
        cancelDelete() {
            this.deleteItemSelected = false
        },
        showDeleteDialog() {
            this.deleteDialog = true
        },
        hideDeleteDialog() {
            this.deleteDialog = false
        },
        async deleteRecipe() {
            const recipeId = this.recipe.id
            const recipeTitle = this.recipe.title

            this.hasChanges = false

            try {
                this.$axios.$delete(`/api/users/${this.user.id}/recipes/${this.recipe.id}`)
            } catch (ex) {
                this.$webError(this, "AutomationEdit.deleteRecipe", ex)
            }

            this.deleteDialog = false

            this.$store.commit("deleteUserRecipe", this.recipe)
            this.$router.push({path: `/automations?deleted=${recipeId}&title=${recipeTitle}`})
        },
        async fromShared() {}
    }
}
</script>
