<template>
    <v-layout column>
        <v-container fluid>
            <h1>Automations</h1>
            <div v-if="!recipes || recipes.length == 0">
                <create-first />
            </div>
            <div v-else>
                <user-automations />
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
            title: "Automations"
        }
    },
    async asyncData({error, store, $axios}) {
        try {
            $axios.setToken(store.state.oauth.accessToken)
            const user = await $axios.$get(`${store.state.apiUrl}users/${store.state.oauth.user.id}`)

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
