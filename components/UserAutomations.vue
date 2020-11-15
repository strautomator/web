<template>
    <div>
        <draggable v-model="recipes" handle=".drag-handle" draggable=".sortablerecipe" v-bind="dragOptions" @change="recipeReordered" @start="dragging = true" @end="dragging = false">
            <transition-group type="transition" :name="!dragging ? 'flip-list' : null">
                <v-card class="mb-5" :class="{sortablerecipe: !recipe.defaultFor}" v-for="recipe in recipes" :key="recipe.id" outlined>
                    <v-hover v-slot:default="{hover}">
                        <n-link :to="'/automations/edit?id=' + recipe.id" :title="recipe.title">
                            <v-card-title class="accent">
                                <v-icon class="ml-n1 mr-2" color="primary" v-if="recipe.defaultFor">{{ getSportIcon(recipe.defaultFor) }}</v-icon>
                                <span class="primary--text">{{ recipe.title }}</span>
                                <v-icon class="ml-2" v-show="hover" small>mdi-pencil-outline</v-icon>
                                <v-spacer />
                                <v-icon class="drag-handle ml-1" title="Hold to reorder this automation recipe" v-if="!recipe.defaultFor">mdi-drag</v-icon>
                            </v-card-title>
                        </n-link>
                    </v-hover>
                    <v-card-text class="white--text pb-1 pb-md-2">
                        <ul class="mt-0 pl-4 condition-list">
                            <li v-if="recipe.defaultFor">Default automation for all "{{ getSportName(recipe.defaultFor) }}" activities</li>
                            <li v-for="(condition, index) in recipe.conditions" :key="`condition-${index}`">
                                {{ conditionSummary(condition) }}
                            </li>
                        </ul>
                        <ul class="mt-1 pl-4 action-list">
                            <li class="font-weight-medium" v-for="(action, index) in recipe.actions" :key="`action-${index}`">
                                {{ actionSummary(action) }}
                            </li>
                        </ul>
                        <div class="mt-2" v-if="recipeStats[recipe.id]">
                            <v-chip class="mb-0 ml-1" disabled outlined small>Executed {{ recipeStats[recipe.id].activities.length }} times, last: {{ recipeStats[recipe.id].dateLastTrigger }}</v-chip>
                        </div>
                    </v-card-text>
                </v-card>
            </transition-group>
        </draggable>
        <div class="mt-5 text-center text-md-left">
            <v-btn v-if="!needsProRecipes" color="primary" to="/automations/edit" title="Create a new automation" rounded nuxt>
                <v-icon left>mdi-plus-circle</v-icon>
                Create new automation
            </v-btn>
            <div v-else>
                <v-alert border="top" color="primary" colored-border>
                    <p>
                        You have reached the limit of {{ $store.state.freePlanDetails.maxRecipes }} automations on your free account.
                        <br v-if="$breakpoint.mdAndUp" />
                        To have unlimited automations and access to all the features, you'll need a PRO account.
                    </p>
                    <v-btn color="primary" to="/billing" title="Subscribe to get a PRO account!" rounded nuxt>
                        <v-icon left>mdi-credit-card</v-icon>
                        Subscribe to PRO
                    </v-btn>
                </v-alert>
            </div>
        </div>
    </div>
</template>

<style>
.action-list {
    list-style-type: disc;
}
.condition-list {
    list-style-type: circle;
}
.drag-handle {
    cursor: move;
}
.drag-ghost {
    opacity: 0.1;
}
</style>

<script>
import _ from "lodash"
import draggable from "vuedraggable"
import userMixin from "~/mixins/userMixin.js"
import recipeMixin from "~/mixins/recipeMixin.js"

export default {
    authenticated: true,
    mixins: [userMixin, recipeMixin],
    components: {draggable},
    data() {
        return {
            hasChanges: false,
            dragging: false,
            recipeStats: {},
            recipes: []
        }
    },
    computed: {
        dragOptions() {
            return {
                animation: 250,
                ghostClass: "drag-ghost"
            }
        }
    },
    async fetch() {
        try {
            const recipeStats = {}
            const arrStats = await this.$axios.$get(`/api/users/${this.user.id}/recipes/stats`)

            for (let stats of arrStats) {
                const recipeId = stats.id.split("-")[1]
                stats.dateLastTrigger = this.$moment(stats.dateLastTrigger).format("ll")
                recipeStats[recipeId] = stats
            }

            this.recipeStats = recipeStats
        } catch (ex) {
            this.$webError("UserAutomations.fetch", ex)
        }
    },
    created() {
        this.delaySaveOrder = _.debounce(this.saveOrder, 3000)
    },
    mounted() {
        this.setOrderedRecipes(_.cloneDeep(Object.values(this.user.recipes)))
    },
    methods: {
        setOrderedRecipes(recipes) {
            if (!recipes) recipes = this.recipes
            this.recipes = _.sortBy(recipes, ["defaultFor", "order", "title"])
        },
        recipeReordered() {
            this.hasChanges = true
            this.delaySaveOrder()
        },
        async saveOrder() {
            if (!this.hasChanges) return
            this.hasChanges = false

            try {
                let index = 0
                let data = {}

                // Create object to update the order of recipes.
                for (let recipe of this.recipes) {
                    index++
                    recipe.order = index
                    data[recipe.id] = index
                    this.$store.commit("setUserRecipe", _.cloneDeep(recipe))
                }

                await this.$axios.$post(`/api/users/${this.user.id}/recipes/order`, data)
            } catch (ex) {
                this.$webError("UserAutomations.saveOrder", ex)
            }
        }
    }
}
</script>
