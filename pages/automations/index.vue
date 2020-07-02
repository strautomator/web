<template>
    <v-layout column>
        <v-container fluid>
            <h1>
                Automations
                <v-badge v-if="recipes.length > 0" color="accent" offset-x="-2" offset-y="1" :content="recipes.length"></v-badge>
                <v-btn v-if="!needsProRecipes" class="float-right mt-3 text-h6 font-weight-bold" color="primary" to="/automations/edit" title="Create a new automation" fab x-small rounded nuxt>+</v-btn>
            </h1>
            <v-snackbar v-if="$route.query.new" v-model="alertNew" class="text-left" color="success" :timeout="3000" bottom>
                New automation "{{ this.user.recipes[$route.query.new].title }}" created!
                <v-icon @click="closeAlert">mdi-close-circle</v-icon>
            </v-snackbar>
            <v-snackbar v-if="$route.query.deleted" v-model="alertDeleted" class="text-left" color="error" :timeout="3000" bottom>
                Automation "{{ $route.query.title }}" deleted!
                <v-icon @click="closeAlert">mdi-close-circle</v-icon>
            </v-snackbar>
            <div v-if="!recipes || recipes.length == 0">
                <create-first />
            </div>
            <div v-else>
                <user-automations />
                <v-alert class="mt-6 text-center text-md-left">
                    Want to test your automations with a specific activity? You can
                    <n-link to="/activities/sync" title="Try your automations" nuxt>try a manual sync.</n-link>
                </v-alert>
            </div>
        </v-container>
    </v-layout>
</template>

<script>
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
    data() {
        return {
            alertNew: false,
            alertDeleted: false
        }
    },
    computed: {
        recipes() {
            return Object.values(this.user.recipes)
        }
    },
    mounted() {
        this.alertNew = this.$route.query.new ? true : false
        this.alertDeleted = this.$route.query.deleted ? true : false
    },
    methods: {
        closeAlert() {
            this.alertNew = false
            this.alertDeleted = false
        }
    }
}
</script>
