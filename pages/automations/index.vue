<template>
    <v-layout column>
        <v-container fluid>
            <h1>
                Automations
                <v-badge v-if="recipes.length > 0" color="accent" offset-x="-2" offset-y="1" :content="recipes.length"></v-badge>
                <v-btn v-if="!needsProRecipes" class="float-right mt-3 ml-4 text-h6 font-weight-bold" color="primary" to="/automations/edit" title="Create a new automation" fab x-small rounded nuxt>+</v-btn>
                <v-btn class="float-right mt-3 text-h6 font-weight-bold" color="primary" to="/dashboard/charts" title="View charts" x-small fab rounded nuxt>
                    <v-icon small>mdi-poll</v-icon>
                </v-btn>
            </h1>
            <v-snackbar v-if="$route.query.new" v-model="alertNew" class="text-left" color="success" :timeout="5000" rounded bottom>
                New automation "{{ this.user.recipes[$route.query.new].title }}" created!
                <template v-slot:action="{attrs}">
                    <v-icon v-bind="attrs" @click="closeAlert">mdi-close-circle</v-icon>
                </template>
            </v-snackbar>
            <v-snackbar v-if="$route.query.deleted" v-model="alertDeleted" class="text-left" color="error" :timeout="5000" rounded bottom>
                Automation "{{ $route.query.title }}" deleted!
                <template v-slot:action="{attrs}">
                    <v-icon v-bind="attrs" @click="closeAlert">mdi-close-circle</v-icon>
                </template>
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
    components: {CreateFirst, UserAutomations},
    mixins: [userMixin, recipeMixin],
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
