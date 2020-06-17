<template>
    <v-layout column>
        <v-container v-if="recipe" fluid>
            <h1>{{ recipe.id ? "Edit" : "New" }} automation</h1>
            <v-form v-model="valid" ref="form">
                <v-text-field v-model="recipe.title" :rules="[recipeRules.required]" label="Automation name" :maxlength="$store.state.recipeMaxLength.title" outlined rounded></v-text-field>
            </v-form>
            <v-card outlined>
                <v-card-title>Conditions</v-card-title>
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
                        <div class="mb-3" v-for="condition in recipe.conditions">
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
                        <v-btn class="ml-n3 mt-2" color="primary" :disabled="!!recipe.defaultFor || isMaxConditions()" @click.stop="showConditionDialog" text small>
                            <v-icon class="mr-2">mdi-plus-circle</v-icon>
                            Add new condition {{ isMaxConditions() ? " (max 3)" : "" }}
                        </v-btn>
                    </div>
                    <v-dialog v-model="conditionDialog" max-width="640" overlay-opacity="0.94" :fullscreen="$breakpoint.smAndDown" persistent>
                        <add-condition @closed="setCondition" />
                    </v-dialog>
                </v-card-text>
            </v-card>
            <v-card class="mt-4" outlined>
                <v-card-title>Actions</v-card-title>
                <v-card-text>
                    <div class="mb-3" v-for="action in recipe.actions">
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
                    <div>
                        <v-btn class="ml-n3 mt-2" color="primary" @click.stop="showActionDialog" text small><v-icon class="mr-2">mdi-plus-circle</v-icon> Add new action</v-btn>
                    </div>
                    <v-dialog v-model="actionDialog" max-width="640" overlay-opacity="0.94" :fullscreen="$breakpoint.smAndDown" persistent>
                        <add-action :disabled-actions="disabledActions" @closed="setAction" />
                    </v-dialog>
                </v-card-text>
            </v-card>
            <div class="text-center text-md-left mt-4">
                <v-btn color="primary" :disabled="!valid || overMaxRecipes" @click="save" rounded>
                    <v-icon left>mdi-content-save</v-icon>
                    Save automation
                </v-btn>
                <div class="pa-2" v-if="!$breakpoint.mdAndUp"></div>
                <v-btn color="removal" v-if="recipe.id" :class="{'ml-3': $breakpoint.mdAndUp}" :disabled="!valid" @click.stop="showDeleteDialog" rounded outlined>
                    <v-icon left>mdi-delete</v-icon>
                    Delete
                </v-btn>
            </div>
            <v-alert color="error" class="mt-5" v-if="overMaxRecipes">
                <p>
                    You are over the limit of {{ $store.state.freePlanDetails.maxRecipes }} automations on free accounts. Please delete some of your automations, down to a maximum of {{ $store.state.freePlanDetails.maxRecipes }}, before editing
                    existing automations.
                </p>
            </v-alert>
            <v-dialog v-model="deleteDialog" max-width="440" overlay-opacity="0.94">
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
                        <p class="mt-2">
                            Are you sure you want to delete this automation?
                        </p>
                        <div class="text-right">
                            <v-spacer></v-spacer>
                            <v-btn class="mr-1" color="grey" title="Confirm and delete recipe" @click.stop="hideDeleteDialog" text rounded>Cancel</v-btn>
                            <v-btn color="removal" title="Confirm and delete recipe" @click="deleteRecipe" rounded>Delete</v-btn>
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

export default {
    authenticated: true,
    components: {
        AddCondition,
        AddAction
    },
    mixins: [userMixin, recipeMixin],
    head() {
        return {
            title: "Automation"
        }
    },
    data() {
        let recipe, valid

        if (this.$route.query && this.$route.query.id) {
            recipe = this.$store.state.user.recipes[this.$route.query.id]
            valid = true
        } else {
            recipe = {conditions: [], actions: []}
            valid = false
        }

        // Invalid recipe?
        if (!recipe) {
            return this.$webError("UserAutomations.data", {status: 404, title: "Automation not found", message: `We could not find an automation recipe with ID ${this.$route.query.id}`})
        }

        return {
            recipe: _.cloneDeep(recipe),
            valid: valid,
            disabledActions: [],
            actionDialog: false,
            conditionDialog: false,
            deleteItemSelected: false,
            deleteDialog: false
        }
    },
    computed: {
        overMaxRecipes() {
            if (!this.user) return false
            return !this.user.isPro && Object.keys(this.user.recipes).length > this.$store.state.freePlanDetails.maxRecipes
        }
    },
    methods: {
        async save() {
            try {
                if (this.$refs.form.validate()) {
                    if (this.recipe.defaultFor == null) {
                        delete this.recipe.defaultFor
                    }

                    const user = this.$store.state.user
                    const url = `/api/users/${user.id}/recipes`
                    const recipeData = await this.$axios.$post(url, this.recipe)

                    this.$store.commit("addUserRecipe", recipeData)
                    this.$router.push({
                        path: `/automations?new=${recipeData.id}`
                    })
                }
            } catch (ex) {
                this.$webError("AutomationEdit.save", ex)
            }
        },
        checkValid() {
            const hasConditions = this.recipe.defaultFor || this.recipe.conditions.length > 0
            this.valid = hasConditions && this.recipe.actions.length > 0
        },
        isMaxConditions() {
            return !this.user.isPro && this.recipe.conditions.length >= this.$store.state.freePlanDetails.maxConditions
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
            }

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
            }

            this.checkValid()
            this.conditionDialog = false
        },
        deleteAction(action) {
            _.remove(this.recipe.actions, action)
            this.checkValid()
            this.deleteItemSelected = false
        },
        deleteCondition(condition) {
            if (condition.defaultFor) {
                this.recipe.defaultFor = null
            } else {
                _.remove(this.recipe.conditions, condition)
            }

            this.checkValid()
            this.deleteItemSelected = false
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
                const userId = this.$store.state.user.id
                this.$axios.$delete(`/api/users/${userId}/recipes/${this.recipe.id}`)
            } catch (ex) {
                this.$webError("AutomationEdit.deleteRecipe", ex)
            }

            this.deleteDialog = false

            this.$store.commit("deleteUserRecipe", this.recipe)
            this.$router.push({
                path: `/automations?deleted=${recipeId}&title=${recipeTitle}`
            })
        }
    }
}
</script>
