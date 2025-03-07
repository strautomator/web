<template>
    <v-layout column>
        <v-container fluid>
            <h1>
                Automations
                <v-btn v-if="recipesRemaining > 0" class="float-right mt-3 ml-3 text-h6 font-weight-bold" color="primary" to="/automations/edit" title="Create a new automation" fab x-small rounded nuxt>+</v-btn>
                <v-btn class="float-right mt-3 text-h6 font-weight-bold" color="primary" to="/automations/history" title="Go to automation history" x-small fab rounded nuxt>
                    <v-icon small>mdi-history</v-icon>
                </v-btn>
            </h1>
            <v-snackbar v-if="$route.query.new" v-model="alertNew" class="text-left" color="success" :timeout="5000" rounded bottom>
                New automation "{{ this.user.recipes[$route.query.new]?.title || "" }}" created!
                <template v-slot:action="{attrs}">
                    <v-icon v-bind="attrs" @click="closeAlert">mdi-close-circle</v-icon>
                </template>
            </v-snackbar>
            <v-snackbar v-if="$route.query.updated" v-model="alertUpdated" class="text-left" color="success" :timeout="5000" rounded bottom>
                Automation "{{ this.user.recipes[$route.query.updated]?.title || "" }}" updated!
                <template v-slot:action="{attrs}">
                    <v-icon v-bind="attrs" @click="closeAlert">mdi-close-circle</v-icon>
                </template>
            </v-snackbar>
            <v-snackbar v-if="$route.query.deleted" v-model="alertDeleted" class="text-left" color="error" :timeout="5000" rounded bottom>
                Automation "{{ $route.query?.title || "" }}" deleted!
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
                    <div>
                        Want to check what Strautomator has updated for you in the past?
                        <br v-if="!$breakpoint.mdAndUp" />
                        Go to the <n-link to="/automations/history" title="Automation history" nuxt>automation history.</n-link>
                    </div>
                    <div class="mt-2 mt-md-0">
                        Want to test your automations with an activity?
                        <br v-if="!$breakpoint.mdAndUp" />
                        Try a <n-link to="/activities/sync" title="Manual automation trigger" nuxt>manual sync.</n-link>
                    </div>
                    <div class="mt-2 mt-md-0" v-if="user.isPro">
                        Want to see your shared automations?
                        <br v-if="!$breakpoint.mdAndUp" />
                        You can <n-link to="/automations/shared" title="Your shared automations" nuxt>Check them here.</n-link>
                    </div>
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
