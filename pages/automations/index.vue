<template>
    <v-layout column>
        <v-container fluid>
            <h1>
                My Automations
                <v-btn v-if="recipesRemaining > 0" class="float-right mt-3 ml-3 text-h6 font-weight-bold" color="primary" to="/automations/edit" title="Create a new automation" fab x-small rounded nuxt>+</v-btn>
                <v-btn class="float-right mt-3 text-h6 font-weight-bold" color="primary" to="/automations/history" title="Go to automation history" x-small fab rounded nuxt>
                    <v-icon small>mdi-history</v-icon>
                </v-btn>
            </h1>
            <v-snackbar v-if="$route.query.new" v-model="alertNew" class="text-left" color="success" :timeout="5000" rounded bottom>
                New automation "{{ this.user.recipes[$route.query.new].title }}" created!
                <template v-slot:action="{attrs}">
                    <v-icon v-bind="attrs" @click="closeAlert">mdi-close-circle</v-icon>
                </template>
            </v-snackbar>
            <v-snackbar v-if="$route.query.updated" v-model="alertUpdated" class="text-left" color="success" :timeout="5000" rounded bottom>
                Automation "{{ this.user.recipes[$route.query.updated].title }}" updated!
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
                    Want to test your automations with a specific activity?
                    <br v-if="!$breakpoint.mdAndUp" />
                    Try a <n-link to="/activities/sync" title="Manual automation trigger" nuxt>manual sync.</n-link>
                    <br />
                    Want to check what Strautomator has updated in the past?
                    <br v-if="!$breakpoint.mdAndUp" />
                    Go to the <n-link to="/automations/history" title="Automation history" nuxt>automation history.</n-link>
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
            alertUpdated: false,
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
        this.alertUpdated = this.$route.query.updated ? true : false
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
