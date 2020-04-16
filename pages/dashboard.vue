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
        </v-container>
    </v-layout>
</template>

<script>
import moment from "moment"
import CreateFirst from "~/components/recipes/CreateFirst.vue"
import UserAutomations from "~/components/UserAutomations.vue"
import recipeMixin from "~/mixins/recipeMixin.js"

export default {
    authenticated: true,
    mixins: [recipeMixin],
    components: {
        CreateFirst,
        UserAutomations
    },
    head() {
        return {
            title: "Dashboard"
        }
    },
    async asyncData({error, res, store, $axios}) {
        try {
            $axios.setToken(store.state.oauth.accessToken)
            const user = await $axios.$get(`/api/users/${store.state.oauth.user.id}`)

            return {
                user: user
            }
        } catch (ex) {
            const status = ex.response && ex.response.status ? ex.response.status : 500

            error({
                statusCode: status,
                message: ex.toString()
            })
        }
    },
    computed: {
        recipes() {
            return Object.values(this.user.recipes)
        }
    }
}
</script>
