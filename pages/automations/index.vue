<template>
    <v-layout column>
        <v-container fluid>
            <h1>
                Automations
                <v-badge v-if="recipes.length > 0" color="primary" offset-x="-2" offset-y="1" :content="recipes.length"></v-badge>
                <v-btn v-if="!needsPro" class="float-right mt-2" color="primary" to="/automations/edit" title="Create a new automation" fab x-small rounded nuxt>
                    <v-icon>mdi-plus-circle</v-icon>
                </v-btn>
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
