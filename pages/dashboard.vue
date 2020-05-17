<template>
    <v-layout column>
        <v-container fluid>
            <h1 class="mb-4">Hello {{ user ? user.profile.firstName : "guest" }}!</h1>
            <div v-if="!recipes || recipes.length == 0">
                <create-first />
            </div>
            <div v-else>
                <v-card outlined>
                    <v-card-title class="accent">
                        Processed activities
                    </v-card-title>
                    <v-card-text>
                        <v-simple-table>
                            <thead>
                                <tr>
                                    <th></th>
                                    <th>Activity</th>
                                    <th>Automation(s)</ht>
                                    <th>Updated fields</th>
                                    <th>Strava</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="activity in activities" :key="activity.id">
                                    <td>
                                        <v-icon class="mt-n1 mt-1" small>{{ activity.type == "Ride" ? "mdi-bike" : activity.type == "Run" ? "mdi-run" : "mdi-dumbbell" }}</v-icon>
                                    </td>
                                    <td>
                                        {{ activity.name }}<br />
                                        {{ getDate(activity.dateStart) }}
                                    </td>
                                    <td>
                                        <div v-for="(recipe, index) in Object.values(activity.recipes)" :key="`${activity.id}-recipe${index}`">
                                            {{ recipe.title }}
                                        </div>
                                    </td>
                                    <td>
                                        {{ getUpdatedFields(activity.updatedFields) }}
                                    </td>
                                    <td>
                                        <a :href="`https://www.strava.com/activities/${activity.id}`" :title="`Open activity ${activity.id} on Strava`"><v-icon color="primary" class="mt-n1" small>mdi-open-in-new</v-icon></a>
                                    </td>
                                </tr>
                            </tbody>
                        </v-simple-table>
                    </v-card-text>
                </v-card>
            </div>
        </v-container>
    </v-layout>
</template>

<script>
import moment from "moment"
import CreateFirst from "~/components/recipes/CreateFirst.vue"
import userMixin from "~/mixins/userMixin.js"
import recipeMixin from "~/mixins/recipeMixin.js"

export default {
    authenticated: true,
    mixins: [userMixin, recipeMixin],
    components: {
        CreateFirst
    },
    head() {
        return {
            title: "Dashboard"
        }
    },
    data() {
        return {
            activities: []
        }
    },
    computed: {
        recipes() {
            return Object.values(this.user.recipes)
        }
    },
    async fetch() {
        try {
            this.$axios.setToken(this.$store.state.oauth.accessToken)
            this.activities = await this.$axios.$get(`/api/users/${this.user.id}/activities`)
        } catch (ex) {
            this.$webError("Dashboard.fetch", ex)
        }
    },
    methods: {
        getDate(date) {
            return moment(date).format("lll")
        },
        getUpdatedFields(fields) {
            const arr = Object.keys(fields)
            arr.sort()
            return arr.join(", ")
        }
    }
}
</script>
