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
                        Recent activities
                    </v-card-title>
                    <v-card-text>
                        <div class="mt-4" v-if="!activities">
                            <p>
                                <v-progress-circular class="mr-1 mt-n1" size="16" width="2" indeterminate></v-progress-circular>
                                Loading statistics...
                            </p>
                        </div>
                        <div class="mt-4" v-else-if="activities.length == 0">
                            <p>
                                <v-icon color="secondary" class="mr-1">mdi-alert-circle-outline</v-icon>
                                None of your activities were processed by Strautomator yet.
                            </p>
                            <p>
                                Maybe you want to double check your
                                <n-link to="/automations" title="Automations" nuxt router>automations</n-link>?
                            </p>
                        </div>
                        <v-simple-table :class="{'mt-2': !$breakpoint.mdAndUp}" v-else>
                            <thead v-if="$breakpoint.mdAndUp">
                                <tr>
                                    <th></th>
                                    <th>Activity</th>
                                    <th>Automation(s)</th>
                                    <th>Updated fields</th>
                                    <th>Strava</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="activity in activities" :key="activity.id">
                                    <td v-if="$breakpoint.mdAndUp">
                                        <v-icon>{{ getSportIcon(activity.type) }}</v-icon>
                                    </td>
                                    <td :class="{'pl-0 pr-0 pt-2 pb-2': !$breakpoint.mdAndUp}">
                                        <template v-if="!$breakpoint.mdAndUp">
                                            <v-icon class="mt-n1 mr-1" small>{{ getSportIcon(activity.type) }}</v-icon>
                                            <span class="float-right ml-2">{{ getDate(activity.dateStart).format("L") }}</span>
                                            <a :href="`https://www.strava.com/activities/${activity.id}`" :title="`Open activity ${activity.id} on Strava`" target="strava">{{ activity.name }}</a>
                                            <ul>
                                                <li v-for="[id, recipe] in Object.entries(activity.recipes)" :key="`${activity.id}-m-${id}`">
                                                    <span :class="{'font-italic grey--text': !user.recipes[id]}">{{ recipe.title }}</span>
                                                </li>
                                            </ul>
                                        </template>
                                        <template v-else>
                                            {{ activity.name }}
                                            <br />
                                            {{ getDate(activity.dateStart).format("lll") }}
                                        </template>
                                    </td>
                                    <td v-if="$breakpoint.mdAndUp">
                                        <div v-for="[id, recipe] in Object.entries(activity.recipes)" :key="`${activity.id}-d-${id}`">
                                            <span :class="{'font-italic grey--text': !user.recipes[id]}">{{ recipe.title }}</span>
                                        </div>
                                    </td>
                                    <td v-if="$breakpoint.mdAndUp">
                                        {{ getUpdatedFields(activity.updatedFields) }}
                                    </td>
                                    <td v-if="$breakpoint.mdAndUp">
                                        <a :href="`https://www.strava.com/activities/${activity.id}`" :title="`Open activity ${activity.id} on Strava`" target="strava"><v-icon color="primary" class="mt-n1">mdi-open-in-new</v-icon></a>
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
    authenticated:    true,
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
            activities: null
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
            this.activities = await this.$axios.$get(`/api/strava/activities/processed`)
        } catch (ex) {
            this.$webError("Dashboard.fetch", ex)
        }
    },
    methods: {
        getDate(date) {
            return moment(date)
        },
        getUpdatedFields(fields) {
            const arr = Object.keys(fields)
            arr.sort()
            return arr.join(", ")
        }
    }
}
</script>
