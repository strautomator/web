<template>
    <div>
        <v-card class="mb-5" v-for="recipe in recipes" :key="recipe.id" outlined>
            <v-hover v-slot:default="{hover}">
                <n-link :to="'/automations/edit?id=' + recipe.id" :title="recipe.title">
                    <v-card-title class="accent">
                        <span class="primary--text">{{ recipe.title }}</span>
                        <v-spacer />
                        <v-icon v-show="hover" small>mdi-pencil-outline</v-icon>
                    </v-card-title>
                </n-link>
            </v-hover>
            <v-card-text>
                <ul class="mt-0 pl-4">
                    <li v-for="condition in recipe.conditions">
                        {{ conditionSummary(condition) }}
                    </li>
                </ul>
                <ul class="mt-0 pl-4">
                    <li class="font-weight-medium white--text" v-for="action in recipe.actions">
                        {{ actionSummary(action) }}
                    </li>
                </ul>
            </v-card-text>
        </v-card>
        <div class="mt-5 text-center text-md-left">
            <v-btn color="primary" to="/automations/edit" title="Create a new automation" rounded nuxt>Create new automation</v-btn>
        </div>
    </div>
</template>

<style></style>

<script>
import _ from "lodash"
import moment from "moment"
import userMixin from "~/mixins/userMixin.js"
import recipeMixin from "~/mixins/recipeMixin.js"

export default {
    authenticated: true,
    mixins: [userMixin, recipeMixin],
    computed: {
        recipes() {
            return Object.values(this.user.recipes)
        }
    }
}
</script>
