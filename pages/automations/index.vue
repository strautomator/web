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
            title: "Automations"
        }
    },
    computed: {
        recipes() {
            return Object.values(this.user.recipes)
        }
    }
}
</script>
