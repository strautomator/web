<template>
    <div>
        <draggable v-model="recipes" handle=".drag-handle" draggable=".sortablerecipe" v-bind="dragOptions" @change="recipeReordered" @start="dragging = true" @end="dragging = false">
            <transition-group type="transition" :name="!dragging ? 'flip-list' : null">
                <v-card class="mb-5" :class="{sortablerecipe: !recipe.defaultFor}" v-for="(recipe, recipeIndex) in recipes" :key="recipe.id" outlined>
                    <v-hover v-slot:default="{hover}">
                        <n-link :to="'/automations/edit?id=' + recipe.id" :title="recipe.title">
                            <v-card-title class="accent">
                                <span>{{ recipe.title }}</span>
                                <v-icon class="ml-2" color="secondary" v-if="$route.query.new == recipe.id">mdi-new-box</v-icon>
                                <v-icon class="ml-2" v-show="hover" small>mdi-pencil-outline</v-icon>
                                <v-spacer></v-spacer>
                                <v-chip class="mr-2" color="removal" title="This automation is disabled" v-if="isRecipeDisabled(recipe, recipeIndex)" small>DISABLED</v-chip>
                                <v-icon class="drag-handle ml-1" title="Hold to reorder this automation recipe" v-if="!recipe.defaultFor">mdi-drag</v-icon>
                            </v-card-title>
                        </n-link>
                    </v-hover>
                    <v-card-text class="white--text pb-2">
                        <conditions-actions-list :recipe="recipe" />
                        <div class="mt-2 mb-2" v-if="recipe.killSwitch">
                            <v-chip class="mb-0 ml-1" color="removal" title="Stop processing further automations if this one is triggered" outlined small>STOP HERE</v-chip>
                        </div>
                        <v-btn v-if="user.isPro" class="font-weight-bold float-right mr-n1" color="primary" title="Share this automation" @click="shareRecipe(recipe)" small icon rounded nuxt>
                            <v-icon small>mdi-share-variant</v-icon>
                        </v-btn>
                        <div class="mt-2 mb-2 mb-md-0" v-if="recipeStats[recipe.id] && recipeStats[recipe.id].dateLastTrigger">
                            <v-chip class="mb-0 ml-1" disabled outlined small>Executed {{ recipeStats[recipe.id].activityCount }}+ times, last: {{ recipeStats[recipe.id].dateLastTrigger }}</v-chip>
                            <v-chip class="mb-0 ml-1 mt-1 mt-md-0" v-if="hasCounter(recipe)" disabled outlined small>Counter: {{ recipe.counterProp ? recipe.counterProp : "" }} {{ recipeStats[recipe.id].counter }}</v-chip>
                        </div>
                        <div v-else>
                            <v-chip class="mb-0 ml-1" disabled outlined small>Never executed before</v-chip>
                        </div>
                    </v-card-text>
                </v-card>
            </transition-group>
        </draggable>
        <div class="mt-5 text-center text-md-left">
            <v-btn v-if="recipesRemaining > 0" color="primary" to="/automations/edit" title="Create a new automation" rounded nuxt>
                <v-icon left>mdi-plus-circle</v-icon>
                Create new automation
            </v-btn>
            <div v-else-if="recipesRemaining == 0">
                <v-alert border="top" color="primary" colored-border>
                    <p>
                        You have reached the limit of {{ recipesMaxAllowed }} automations on your free account.
                        <br v-if="$breakpoint.mdAndUp" />
                        To have unlimited automations and access to all the features, you'll need a PRO account.
                    </p>
                    <v-btn color="primary" to="/billing" title="Subscribe to get a PRO account!" rounded nuxt>
                        <v-icon left>mdi-credit-card</v-icon>
                        Subscribe to PRO
                    </v-btn>
                </v-alert>
            </div>
            <div v-else-if="recipesRemaining < 0">
                <v-alert border="top" color="error" colored-border>
                    <p>
                        You are over the limit of {{ recipesMaxAllowed }} automations on the free account.
                        <br v-if="$breakpoint.mdAndUp" />
                        Only the top {{ recipesMaxAllowed }} automations will work. If you want to keep using all of them, please upgrade to PRO.
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
li.if-then {
    list-style-type: none;
    opacity: 0.4;
}
.action-list {
    list-style-type: disc;
}
.condition-list {
    list-style-type: circle;
}
.condition-list li.or {
    list-style-type: none;
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
import ConditionsActionsList from "~/components/recipes/ConditionsActionsList.vue"
import draggable from "vuedraggable"
import userMixin from "~/mixins/userMixin.js"
import recipeMixin from "~/mixins/recipeMixin.js"
import stravaMixin from "~/mixins/stravaMixin.js"

export default {
    authenticated: true,
    mixins: [userMixin, recipeMixin, stravaMixin],
    components: {ConditionsActionsList, draggable},
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
                if (stats.dateLastTrigger) {
                    stats.dateLastTrigger = this.$dayjs(stats.dateLastTrigger).format("ll")
                }
                recipeStats[recipeId] = stats
            }

            this.recipeStats = recipeStats
        } catch (ex) {
            this.$webError(this, "UserAutomations.fetch", ex)
        }
    },
    created() {
        this.delaySaveOrder = _.debounce(this.saveOrder, 3000)
    },
    mounted() {
        this.setOrderedRecipes(_.cloneDeep(Object.values(this.user.recipes)))
    },
    methods: {
        isRecipeDisabled(recipe, index) {
            return (this.recipesRemaining < 0 && index >= this.recipesMaxAllowed) || recipe.disabled
        },
        hasCounter(recipe) {
            return this.recipeStats[recipe.id] && this.recipeStats[recipe.id].counter > 0 && _.find(recipe.actions, (a) => _.isString(a.value) && a.value.includes("${counter}"))
        },
        setOrderedRecipes(recipes) {
            if (!recipes) recipes = this.recipes
            for (let r of recipes) {
                const conditions = _.sortBy(r.conditions, "property")
                r.groupedConditions = _.groupBy(conditions, "property")
            }
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
                this.$webError(this, "UserAutomations.saveOrder", ex)
            }
        }
    }
}
</script>
