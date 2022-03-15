<template>
    <v-layout column>
        <v-container v-if="recipe" fluid>
            <h1>{{ recipe.id ? "Edit" : "New" }} automation</h1>
            <v-form v-model="valid" class="mb-0" ref="form">
                <v-text-field v-model="recipe.title" :rules="[recipeRules.required]" label="Automation name" :maxlength="$store.state.recipeMaxLength.title" outlined rounded></v-text-field>
            </v-form>
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
                    <template v-else-if="recipe.conditions && recipe.conditions.length > 0">
                        <div class="mb-3" v-for="(condition, index) in recipe.conditions" :key="`condition-${index}`">
                            <v-container class="ma-0 pa-0 d-flex align-start" fluid>
                                <div class="mr-2">
                                    <v-icon color="removal" v-if="deleteItemSelected != condition" @click="confirmDelete(condition)">mdi-minus-circle-outline</v-icon>
                                    <v-icon v-if="deleteItemSelected == condition" color="grey" @click="cancelDelete">mdi-cancel</v-icon>
                                </div>
                                <div class="mr-2" v-if="deleteItemSelected == condition">
                                    <v-btn color="removal" @click="deleteCondition(condition)" rounded x-small>Delete</v-btn>
                                </div>
                                <div>
                                    <span>{{ conditionSummary(condition) }}</span>
                                </div>
                            </v-container>
                        </div>
                    </template>
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
            <v-card class="mt-4" v-if="hasCounter" outlined>
                <v-card-text class="mb-0 pb-0">
                    <div>This automation is using a counter on the name or description. If you wish to override the current counter value, simply update it below.</div>
                    <div class="mt-4 d-flex">
                        <v-text-field v-model="recipeStats.counter" class="recipe-stats-counter" type="number" label="Counter" min="0" max="9999" dense outlined rounded></v-text-field>
                        <v-btn color="primary" class="ml-2 mt-1" title="Set new counter" :disabled="!changedCounter" @click="setCounter" outlined rounded>
                            <v-icon left>mdi-check-bold</v-icon>
                            Set
                        </v-btn>
                    </div>
                </v-card-text>
            </v-card>
            <div class="mt-6">
                <v-switch class="ma-0 pa-0" title="Automation kill switch" v-model="recipe.killSwitch" label="Stop executing further automations"></v-switch>
            </div>
            <div class="mt-n1">
                <v-switch class="ma-0 pa-0" title="Automation status" v-model="recipe.disabled" label="Disable this automation"></v-switch>
            </div>
            <div class="text-center text-md-left mt-2">
                <v-btn color="primary" :disabled="!valid" @click="save" rounded>
                    <v-icon left>mdi-content-save</v-icon>
                    Save automation
                </v-btn>
                <div class="pa-2" v-if="!$breakpoint.mdAndUp"></div>
                <v-btn color="removal" v-if="recipe.id" :class="{'ml-3': $breakpoint.mdAndUp}" :disabled="!valid" @click.stop="showDeleteDialog" rounded outlined>
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
                            <v-btn class="mr-1" color="grey" title="Cancel and do not delete" @click.stop="hideDeleteDialog" text rounded>
                                <v-icon left>mdi-cancel</v-icon>
                                Cancel
                            </v-btn>
                            <v-btn color="removal" title="Confirm and delete recipe" @click="deleteRecipe" rounded>
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

<style>
.recipe-stats-counter {
    max-width: 100px;
}
</style>

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
            title: "Automation"
        }
    },
    data() {
        let recipe, valid, isNew

        if (this.$route.query && this.$route.query.id) {
            recipe = this.$store.state.user.recipes[this.$route.query.id]
            valid = true
            isNew = false
        } else {
            recipe = {conditions: [], actions: []}
            valid = false
            isNew = true
        }

        // Invalid recipe?
        if (!recipe) {
            return this.$webError("UserAutomations.data", {status: 404, title: "Automation not found", message: `We could not find an automation recipe with ID ${this.$route.query.id}`})
        }

        return {
            recipe: _.cloneDeep(recipe),
            recipeStats: {counter: 0},
            currentCounter: 0,
            valid: valid,
            disabledActions: [],
            actionDialog: false,
            conditionDialog: false,
            deleteItemSelected: false,
            deleteDialog: false,
            hasChanges: false,
            isNew: isNew
        }
    },
    computed: {
        overMaxRecipes() {
            if (!this.user) return false
            return !this.user.isPro && Object.keys(this.user.recipes).length > this.$store.state.freePlanDetails.maxRecipes
        },
        hasCounter() {
            if (!this.recipe) return false
            return _.find(this.recipe.actions, (a) => _.isString(a.value) && a.value.indexOf("${counter}") >= 0)
        },
        changedCounter() {
            return this.recipeStats.counter != this.currentCounter
        }
    },
    async fetch() {
        if (!this.$route.query.id || !this.$store.state.user.recipes[this.$route.query.id]) return

        try {
            const recipeStats = await this.$axios.$get(`/api/users/${this.user.id}/recipes/stats/${this.$route.query.id}`)

            if (recipeStats) {
                this.recipeStats = recipeStats
                this.currentCounter = recipeStats.counter
            }
        } catch (ex) {
            this.$webError("UserAutomations.fetch", ex)
        }
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
        async save() {
            try {
                this.hasChanges = false

                if (this.$refs.form.validate()) {
                    if (this.changedCounter) {
                        this.setCounter()
                    }

                    if (this.recipe.defaultFor == null) {
                        delete this.recipe.defaultFor
                    }

                    if (!this.recipe.disabled) {
                        delete this.recipe.disabled
                    }

                    const url = `/api/users/${this.user.id}/recipes`
                    const recipeData = await this.$axios.$post(url, this.recipe)
                    const queryField = this.isNew ? "new" : "updated"

                    this.$store.commit("setUserRecipe", recipeData)
                    this.$router.push({path: `/automations?${queryField}=${recipeData.id}`})
                }
            } catch (ex) {
                this.$webError("AutomationEdit.save", ex)
            }
        },
        async setCounter() {
            try {
                this.currentCounter = this.recipeStats.counter

                const url = `/api/users/${this.user.id}/recipes/stats/${this.recipe.id}`
                const body = {id: this.recipe.id, counter: this.recipeStats.counter}
                await this.$axios.$post(url, body)
            } catch (ex) {
                this.$webError("AutomationEdit.setCounter", ex)
            }
        },
        checkValid() {
            const hasConditions = this.recipe.defaultFor || this.recipe.conditions.length > 0
            this.valid = hasConditions && this.recipe.actions.length > 0
        },
        showActionDialog() {
            this.disabledActions = _.map(this.recipe.actions, "type")
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
            this.recipe.actions = _.sortBy(this.recipe.actions, (a) => _.find(this.$store.state.recipeActions, {value: a.type}).text)

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
            _.remove(this.recipe.actions, action)
            this.checkValid()
            this.deleteItemSelected = false
            this.hasChanges = true
        },
        deleteCondition(condition) {
            if (condition.defaultFor) {
                this.recipe.defaultFor = null
            } else {
                _.remove(this.recipe.conditions, condition)
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

            try {
                this.$axios.$delete(`/api/users/${this.user.id}/recipes/${this.recipe.id}`)
            } catch (ex) {
                this.$webError("AutomationEdit.deleteRecipe", ex)
            }

            this.deleteDialog = false

            this.$store.commit("deleteUserRecipe", this.recipe)
            this.$router.push({path: `/automations?deleted=${recipeId}&title=${recipeTitle}`})
        }
    }
}
</script>
