<template>
    <v-layout column>
        <v-container fluid>
            <h1>{{ selectedRecipe ? "Shared Automation" : "Shared Automations" }}</h1>
            <v-snackbar v-if="$route.query.new" v-model="alertNew" class="text-left" color="success" :timeout="5000" rounded bottom>
                Shared automation "{{ $route.query.new }}" created!
                <template v-slot:action="{attrs}">
                    <v-icon v-bind="attrs" @click="closeAlert">mdi-close-circle</v-icon>
                </template>
            </v-snackbar>
            <v-snackbar v-if="$route.query.deleted" v-model="alertDeleted" class="text-left" color="error" :timeout="5000" rounded bottom>
                Shared automation "{{ $route.query.title }}" deleted!
                <template v-slot:action="{attrs}">
                    <v-icon v-bind="attrs" @click="closeAlert">mdi-close-circle</v-icon>
                </template>
            </v-snackbar>
            <v-snackbar v-model="urlCopied" class="text-left" color="success" :timeout="5000" rounded bottom>
                Copied shared automation URL to the clipboard.
                <template v-slot:action="{attrs}">
                    <v-icon v-bind="attrs" @click="closeAlert">mdi-close-circle</v-icon>
                </template>
            </v-snackbar>
            <div v-if="loading">
                <v-progress-circular class="mr-1 mt-n1" size="16" width="2" indeterminate></v-progress-circular>
                Loading shared automation(s), please wait...
            </div>
            <div v-else-if="notFound">A shared automation with ID {{ $route.query.id }} could not be found. Please double check the URL again, or ask the automation's owner for the correct link.</div>
            <div v-else-if="selectedRecipe">
                <v-card class="mb-5" outlined>
                    <v-card-title class="accent">
                        <span>{{ selectedRecipe.title }}</span>
                    </v-card-title>
                    <v-card-text class="white--text pb-2">
                        <div class="ml-4 mb-2 mt-2">ID: {{ selectedRecipe.id }}</div>
                        <conditions-actions-list :recipe="selectedRecipe" />
                    </v-card-text>
                </v-card>
                <p>If you trust the owner of this recipe and the details above, you can create a new automation based on this one.</p>
                <div class="mt-3 text-center text-md-left">
                    <v-btn color="primary" title="Create a new automation based on this" :to="'/automations/edit?template=' + selectedRecipe.id" rounded nuxt>
                        <v-icon left>mdi-content-copy</v-icon>
                        Use this automation
                    </v-btn>
                </div>
            </div>
            <div v-else-if="sharedRecipes.length == 0">
                <p>You have no shared automations.</p>
                <p>To share an automation with other users, please use the <v-icon color="primary" small>mdi-share-variant</v-icon> icon on the bottom right of the automation card.</p>
                <div class="text-center text-md-left">
                    <v-btn class="mr-2" color="primary" title="Go back to the automations list" to="/automations" small rounded>
                        <v-icon left>mdi-arrow-left</v-icon>
                        Back to my automations
                    </v-btn>
                </div>
            </div>
            <div v-else>
                <v-card class="mb-5" v-for="(recipe, recipeIndex) in sharedRecipes" :key="recipe.id" outlined>
                    <v-card-title class="accent">
                        <span>{{ recipe.title }}</span>
                    </v-card-title>
                    <v-card-text class="white--text pb-2">
                        <div class="ml-4 mb-2 mt-2">ID: {{ recipe.id }}</div>
                        <conditions-actions-list :recipe="recipe" />
                        <div class="mt-3 mb-2">
                            <v-btn color="primary" title="Copy URL for sharing" @click="copyURL(recipe)" small rounded nuxt>
                                <v-icon left>mdi-content-copy</v-icon>
                                Copy URL
                            </v-btn>
                            <v-btn color="removal" title="Delete this shared automation" class="ml-2" @click.stop="showDeleteDialog(recipe)" small rounded outlined>
                                <v-icon left>mdi-delete</v-icon>
                                Delete
                            </v-btn>
                        </div>
                    </v-card-text>
                </v-card>
            </div>

            <v-dialog v-if="selectedRecipe" v-model="deleteDialog" width="440" overlay-opacity="0.95">
                <v-card>
                    <v-toolbar color="removal">
                        <v-toolbar-title>Delete shared automation</v-toolbar-title>
                        <v-spacer></v-spacer>
                        <v-toolbar-items>
                            <v-btn icon @click.stop="hideDeleteDialog">
                                <v-icon>mdi-close</v-icon>
                            </v-btn>
                        </v-toolbar-items>
                    </v-toolbar>
                    <v-card-text>
                        <h3 class="mt-4">{{ selectedRecipe.title }}</h3>
                        <p class="mt-2">Are you sure you want to delete this shared automation? Users won't be able to copy it, but existing user automations based on this one won't be affected.</p>
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
import ConditionsActionsList from "~/components/recipes/ConditionsActionsList.vue"
import userMixin from "~/mixins/userMixin.js"
import recipeMixin from "~/mixins/recipeMixin.js"

export default {
    authenticated: true,
    mixins: [userMixin, recipeMixin],
    components: {ConditionsActionsList},
    head() {
        return {
            title: "Automations"
        }
    },
    data() {
        return {
            alertNew: false,
            alertUpdated: false,
            alertDeleted: false,
            deleteDialog: false,
            selectedRecipe: null,
            deletingRecipe: null,
            urlCopied: false,
            notFound: false,
            loading: false,
            sharedRecipes: []
        }
    },
    async fetch() {
        this.loading = true

        try {
            let sharedRecipes

            if (this.$route.query.id) {
                const sharedRecipe = await this.$axios.$get(`/api/shared-recipes/${this.user.id}/${this.$route.query.id}`)
                if (sharedRecipe?.id) {
                    this.selectedRecipe = sharedRecipe
                    sharedRecipes = [sharedRecipe]
                } else {
                    this.notFound = true
                }
            } else {
                sharedRecipes = await this.$axios.$get(`/api/shared-recipes/${this.user.id}`)
            }

            this.setOrderedRecipes(sharedRecipes)
        } catch (ex) {
            this.$webError(this, "SharedAutomations.fetch", ex)
        }

        this.loading = false
    },
    mounted() {
        this.alertNew = this.$route.query.new ? true : false
        this.alertDeleted = this.$route.query.deleted ? true : false
    },
    methods: {
        setOrderedRecipes(recipes) {
            for (let r of recipes) {
                const conditions = _.sortBy(r.conditions, "property")
                r.groupedConditions = _.groupBy(conditions, "property")
            }
            this.sharedRecipes = _.sortBy(recipes, ["defaultFor", "order", "title"])
        },
        closeAlert() {
            this.alertNew = false
            this.alertDeleted = false
            this.urlCopied = false
        },
        async copyURL(recipe) {
            const targetPath = `/automations/shared?id=${recipe.id}`
            try {
                await navigator.clipboard.writeText(`${location.origin}${targetPath}`)
                this.urlCopied = true
            } catch ($e) {
                this.$router.push({path: targetPath})
            }
        },
        showDeleteDialog(recipe) {
            this.deletingRecipe = recipe
            this.deleteDialog = true
        },
        hideDeleteDialog() {
            this.deleteDialog = false
            this.deletingRecipe = null
        },
        async deleteRecipe() {
            const recipeId = this.deletingRecipe.id

            try {
                this.$axios.$delete(`/api/shared-recipes/${this.user.id}/${recipeId}`)
            } catch (ex) {
                this.$webError(this, "SharedAutomations.deleteRecipe", ex)
            }

            this.deleteDialog = false
            this.deletingRecipe = null
            this.$router.push({path: `/automations/shared?deleted=${recipeId}`})
        }
    }
}
</script>
