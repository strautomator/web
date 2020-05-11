<template>
    <v-layout column>
        <v-container fluid>
            <h1 class="mb-4">Hello {{ user ? user.profile.firstName : "guest" }}!</h1>
            <div v-if="!recipes || recipes.length == 0">
                <create-first />
            </div>
            <div v-else>
                <p>Our dashboard is not quite ready yet, so meanwhile you can manage your <n-link to="/automations" title="Manage your automations" router nuxt>automations</n-link>...</p>
                <p class="mt-5 hidden-md-and-up">
                    Use the bottom bar to navigate on the app.
                </p>
            </div>
            <div v-if="!user.isPro">
                Feeling generous? Want to support this service? Then consider
                <n-link to="/donate" title="Donate now!" nuxt>donating</n-link>!
            </div>
        </v-container>
    </v-layout>
</template>

<script>
import moment from "moment"
import CreateFirst from "~/components/recipes/CreateFirst.vue"
import UserAutomations from "~/components/UserAutomations.vue"
import userMixin from "~/mixins/userMixin.js"
import recipeMixin from "~/mixins/recipeMixin.js"

export default {
    authenticated: true,
    mixins: [userMixin, recipeMixin],
    components: {
        CreateFirst,
        UserAutomations
    },
    head() {
        return {
            title: "Dashboard"
        }
    },
    computed: {
        recipes() {
            return Object.values(this.user.recipes)
        }
    }
}
</script>
