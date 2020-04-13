<template>
    <v-card class="m-3" outlined>
        <v-card-title class="accent"> Your automations <v-spacer /> ({{ recipes.length }}) </v-card-title>
        <v-card-text>
            <div class="mt-4" v-for="recipe in recipes" :key="recipe.id">
                <n-link class="headline" :to="'/automations/edit?id=' + recipe.id" :title="recipe.title"><v-icon color="primary" class="mt-n1" small>mdi-file-tree</v-icon> {{ recipe.title }}</n-link>
                <div class="to-the-right" v-if="$vuetify.breakpoint.smAndDown || !isMounted">
                    <div class="conditions">Conditions: {{ recipe.conditions.map((c) => conditionPropertyText(c).toLowerCase()).join(", ") }}</div>
                    <div class="actions">
                        <div v-for="action in recipe.actions">
                            {{ actionSummary(action) }}
                        </div>
                    </div>
                </div>
                <div class="to-the-right" v-else>
                    <div class="conditions">When {{ recipe.conditions.map((c) => conditionSummary(c).toLowerCase()).join(" and ") }}</div>
                    <div class="actions">{{ recipe.actions.map((a) => actionSummary(a)).join(" || ") }}</div>
                </div>
                <v-divider class="mt-2 mb-2"></v-divider>
            </div>
            <div class="mt-5 text-center text-md-left">
                <v-btn color="primary" to="/automations/edit" title="Create a new automation" rounded nuxt>Create new automation</v-btn>
            </div>
        </v-card-text>
    </v-card>
</template>

<style></style>

<script>
import _ from "lodash"
import moment from "moment"
import recipeMixin from "~/mixins/recipeMixin.js"

export default {
    authenticated: true,
    mixins: [recipeMixin],
    data() {
        return {
            isMounted: false,
            user: this.$store.state.oauth.user
        }
    },
    computed: {
        recipes() {
            return Object.values(this.$store.state.oauth.user.recipes)
        }
    },
    mounted() {
        this.isMounted = true
    }
}
</script>
