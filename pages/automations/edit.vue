<template>
    <v-layout column>
        <v-container fluid>
            <h1>{{ recipe.id ? "Edit" : "New" }} automation</h1>
            <v-form v-model="valid" ref="form">
                <v-text-field v-model="recipe.title" :rules="[recipeRules.required]" label="Automation name" :maxlength="$store.state.recipeMaxLength.title" outlined rounded></v-text-field>
            </v-form>
            <v-card outlined>
                <v-card-title>Conditions</v-card-title>
                <v-card-text>
                    <div class="mb-3" v-for="condition in recipe.conditions">
                        <v-container class="ma-0 pa-0 d-flex align-start" fluid>
                            <div class="mr-2">
                                <v-icon color="red lighten-1" v-if="deleteItemSelected != condition" @click="confirmDelete(condition)">mdi-minus-circle-outline</v-icon>
                                <v-icon v-if="deleteItemSelected == condition" color="red" @click="deleteCondition(condition)">mdi-minus-circle</v-icon>
                                <v-icon v-if="deleteItemSelected == condition" color="grey" @click="cancelDelete">mdi-cancel</v-icon>
                            </div>
                            <div>
                                <span>{{ conditionSummary(condition) }}</span>
                            </div>
                        </v-container>
                    </div>
                    <div>
                        <v-btn class="ml-n3 mt-2" color="primary" @click.stop="showConditionDialog" text small><v-icon class="mr-2">mdi-plus-circle</v-icon> Add new condition</v-btn>
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
                                <v-icon color="red lighten-1" v-if="deleteItemSelected != action" @click="confirmDelete(action)">mdi-minus-circle-outline</v-icon>
                                <v-icon v-if="deleteItemSelected == action" color="red" @click="deleteAction(action)">mdi-minus-circle</v-icon>
                                <v-icon v-if="deleteItemSelected == action" color="grey" @click="cancelDelete">mdi-cancel</v-icon>
                            </div>
                            <div>
                                <span class="ml-1">{{ actionSummary(action) }}</span>
                            </div>
                        </v-container>
                    </div>
                    <div>
                        <v-btn class="ml-n3 mt-2" color="primary" @click.stop="showActionDialog" text small><v-icon class="mr-2">mdi-plus-circle</v-icon> Add new action</v-btn>
                    </div>
                    <v-dialog v-model="actionDialog" max-width="640" overlay-opacity="0.94" :fullscreen="$breakpoint.smAndDown" persistent>
                        <add-action :disabled-actions="usedActions" @closed="setAction" />
                    </v-dialog>
                </v-card-text>
            </v-card>
            <div class="text-center text-md-left mt-4">
                <v-btn color="primary" :disabled="!valid" @click="save" rounded>Save automation</v-btn>
                <v-btn class="ml-1" color="red" v-if="recipe.id" :disabled="!valid" @click.stop="showDeleteDialog" rounded outlined>Delete</v-btn>
            </div>
        </v-container>
        <v-dialog v-model="deleteDialog" max-width="440" overlay-opacity="0.94">
            <v-card>
                <v-toolbar color="red darken-4">
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
                        <v-btn color="red" title="Confirm and delete recipe" @click="deleteRecipe" rounded>Delete</v-btn>
                    </div>
                </v-card-text>
            </v-card>
        </v-dialog>
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

        return {
            recipe: _.cloneDeep(recipe),
            valid: valid,
            usedActions: [],
            actionDialog: false,
            conditionDialog: false,
            deleteItemSelected: false,
            deleteDialog: false
        }
    },
    methods: {
        async save() {
            try {
                if (this.$refs.form.validate()) {
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
            this.valid = this.recipe.conditions.length > 0 && this.recipe.actions.length > 0
        },
        showActionDialog() {
            this.usedActions = _.map(this.recipe.actions, "type")
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
                this.recipe.conditions.push(value)
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
            _.remove(this.recipe.conditions, condition)
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
            try {
                const userId = this.$store.state.user.id
                this.$axios.$delete(`/api/users/${userId}/recipes/${this.recipe.id}`)
            } catch (ex) {
                this.$webError("AutomationEdit.deleteRecipe", ex)
            }

            this.deleteDialog = false

            this.$store.commit("deleteUserRecipe", this.recipe)
            this.$router.push({
                path: "/automations"
            })
        }
    }
}
</script>
