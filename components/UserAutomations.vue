<template>
    <div>
        <draggable v-model="recipes" handle=".drag-handle" draggable=".sortablerecipe" v-bind="dragOptions" @change="recipeReordered" @start="dragging = true" @end="dragging = false">
            <transition-group type="transition" :name="!dragging ? 'flip-list' : null">
                <v-card class="mb-5" :class="{sortablerecipe: !recipe.defaultFor}" v-for="(recipe, recipeIndex) in recipes" :key="recipe.id" outlined>
                    <v-hover v-slot:default="{hover}">
                        <n-link :to="'/automations/edit?id=' + recipe.id" :title="recipe.title">
                            <v-card-title class="accent">
                                <v-icon class="ml-n1 mr-2" color="primary" v-if="recipe.defaultFor">{{ getSportIcon(recipe.defaultFor) }}</v-icon>
                                <span class="primary--text">{{ recipe.title }}</span>
                                <v-icon class="ml-2" v-show="hover" small>mdi-pencil-outline</v-icon>
                                <v-spacer></v-spacer>
                                <v-icon class="drag-handle ml-1" title="Hold to reorder this automation recipe" v-if="!recipe.defaultFor">mdi-drag</v-icon>
                            </v-card-title>
                        </n-link>
                    </v-hover>
                    <v-card-text class="white--text pb-2">
                        <div class="mb-2" v-if="recipesRemaining < 0 && recipeIndex >= recipesMaxAllowed">
                            <v-chip class="mb-0 ml-1" color="error" outlined small>DISABLED, NEEDS PRO</v-chip>
                        </div>
                        <div class="mb-2" v-else-if="recipe.disabled">
                            <v-chip class="mb-0 ml-1" color="error" outlined small>DISABLED</v-chip>
                        </div>
                        <ul class="mt-0 pl-4 condition-list">
                            <li v-if="recipe.defaultFor">Default automation for all "{{ getSportName(recipe.defaultFor) }}" activities</li>
                            <li v-else-if="recipe.conditions.length > 1 && codeLogicalOperator(recipe) == 'ALL'" class="if-then">If <strong>ALL</strong> these conditions are met:</li>
                            <li v-else-if="recipe.conditions.length > 1 && codeLogicalOperator(recipe) == 'ANY'" class="if-then">If <strong>ANY</strong> of these conditions are met:</li>
                            <li v-else-if="recipe.conditions.length > 2" class="if-then">If these conditions are met:</li>
                            <template v-for="(conditions, property, groupIndex) in recipe.groupedConditions">
                                <v-chip v-if="codeLogicalOperator(recipe) == 'SOME' && groupIndex > 0" class="ml-n1 mt-1 mb-1" small outlined>{{ recipe.op }}</v-chip>
                                <li v-for="(condition, index) in conditions" :key="`${property}-c-${index}`" :class="{or: index > 0 && codeLogicalOperator(recipe) == 'SOME'}">
                                    <span v-if="codeLogicalOperator(recipe) == 'SOME' && index > 0">{{ recipe.samePropertyOp.toLowerCase() }}</span>
                                    {{ conditionSummary(condition) }}
                                </li>
                            </template>
                        </ul>
                        <ul class="mt-2 mb-1 pl-4 action-list">
                            <li v-if="!recipe.defaultFor && recipe.conditions.length > 1" class="if-then">Then execute these actions:</li>
                            <li class="font-weight-medium" v-for="(action, index) in recipe.actions" :key="`action-${index}`">
                                {{ actionSummary(action) }}
                            </li>
                        </ul>
                        <div class="mt-2 mb-2 mb-md-0" v-if="recipeStats[recipe.id] && recipeStats[recipe.id].dateLastTrigger">
                            <v-chip class="mb-0 ml-1" disabled outlined small>Executed {{ recipeStats[recipe.id].activityCount }} time(s), last: {{ recipeStats[recipe.id].dateLastTrigger }}</v-chip>
                            <v-chip class="mb-0 ml-1" v-if="hasCounter(recipe)" disabled outlined small>Counter: {{ recipeStats[recipe.id].counter }}</v-chip>
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
                        You are over the limit of {{ recipesMaxAllowed }} automations on your free account.
                        <br v-if="$breakpoint.mdAndUp" />
                        Only the top {{ recipesMaxAllowed }} will work. If you want to keep using all of them, please upgrade to a PRO account.
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
import draggable from "vuedraggable"
import userMixin from "~/mixins/userMixin.js"
import recipeMixin from "~/mixins/recipeMixin.js"
import stravaMixin from "~/mixins/stravaMixin.js"

export default {
    authenticated: true,
    mixins: [userMixin, recipeMixin, stravaMixin],
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
                if (stats.dateLastTrigger) {
                    stats.dateLastTrigger = this.$dayjs(stats.dateLastTrigger).format("ll")
                }
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
                this.$webError("UserAutomations.saveOrder", ex)
            }
        }
    }
}
</script>
