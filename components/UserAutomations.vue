<template>
    <div>
        <v-card class="mb-5" v-for="recipe in recipes" :key="recipe.id" outlined>
            <v-hover v-slot:default="{hover}">
                <n-link :to="'/automations/edit?id=' + recipe.id" :title="recipe.title">
                    <v-card-title class="accent">
                        <v-icon class="ml-n1 mr-2" color="primary" v-if="recipe.defaultFor">{{ getSportIcon(recipe.defaultFor) }}</v-icon>
                        <span class="primary--text">{{ recipe.title }}</span>
                        <v-spacer />
                        <v-icon v-show="hover" small>mdi-pencil-outline</v-icon>
                    </v-card-title>
                </n-link>
            </v-hover>
            <v-card-text class="white--text">
                <ul class="mt-0 pl-4 condition-list">
                    <li v-if="recipe.defaultFor">Default automation for all "{{ getSportName(recipe.defaultFor) }}" activities</li>
                    <li v-for="condition in recipe.conditions">
                        {{ conditionSummary(condition) }}
                    </li>
                </ul>
                <ul class="mt-1 pl-4 action-list">
                    <li class="font-weight-medium" v-for="action in recipe.actions">
                        {{ actionSummary(action) }}
                    </li>
                </ul>
                <div class="mt-3" v-if="recipeStats[recipe.id]">
                    <v-chip class="mb-0 ml-1" disabled outlined small> Executed {{ recipeStats[recipe.id].activities.length }} time(s), last on {{ recipeStats[recipe.id].dateLastTrigger }} </v-chip>
                </div>
            </v-card-text>
        </v-card>
        <div class="mt-5 text-center text-md-left">
            <v-btn v-if="!needsPro()" color="primary" to="/automations/edit" title="Create a new automation" rounded nuxt>
                <v-icon left>mdi-plus-circle</v-icon>
                Create new automation
            </v-btn>
            <div v-else>
                <v-alert border="top" color="primary" colored-border>
                    <p>
                        You have reached the limit of {{ $store.state.freePlanDetails.maxRecipes }}
                        automations on your free account. To have unlimited automations and access to all the features, you'll need a PRO account.
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
</style>

<script>
import _ from "lodash"
import moment from "moment"
import userMixin from "~/mixins/userMixin.js"
import recipeMixin from "~/mixins/recipeMixin.js"

export default {
    authenticated: true,
    mixins: [userMixin, recipeMixin],
    data() {
        return {
            recipeStats: {}
        }
    },
    computed: {
        recipes() {
            const recipes = _.sortBy(Object.values(this.user.recipes), ["defaultFor"])
            return recipes
        }
    },
    async fetch() {
        try {
            const timestamp = new Date().valueOf()
            this.$axios.setToken(this.$store.state.oauth.accessToken)

            // Fetch new user data once every 60 seconds...
            if (!this.$store.state.lastUserFetch || this.$store.state.lastUserFetch < timestamp - 60000) {
                const user = await this.$axios.$get(`/api/users/${this.user.id}`)
                this.$store.commit("setLastUserFetch", new Date().valueOf())
                this.$store.commit("setUser", user)
            }

            // Get recipe stats.
            const recipeStats = {}
            const arrStats = await this.$axios.$get(`/api/users/${this.user.id}/recipes/stats`)
            for (let stats of arrStats) {
                const recipeId = stats.id.split("-")[1]
                stats.dateLastTrigger = moment(stats.dateLastTrigger).format("lll")
                recipeStats[recipeId] = stats
            }

            this.recipeStats = recipeStats
        } catch (ex) {
            this.$webError("UserAutomations.fetch", ex)
        }
    }
}
</script>
