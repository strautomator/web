<template>
    <v-layout column>
        <v-container fluid>
            <h1 class="mb-4">
                Hi {{ user ? user.profile.firstName : "guest" }}!
                <v-btn elevation="1" class="float-right mt-3 text-h6 font-weight-bold" color="primary" to="/dashboard/charts" title="View charts" x-small fab rounded nuxt>
                    <v-icon small>mdi-poll</v-icon>
                </v-btn>
            </h1>
            <v-alert color="error" border="top" v-if="stravaStatus" class="mb-4">
                <div class="font-weight-bold">Strava status: {{ stravaStatus }}</div>
                <div>
                    Please note that some of the automations might fail to run during this incident. For more information please check
                    <a class="secondary--text" href="https://status.strava.com" title="Strava API status">status.strava.com.</a>
                </div>
            </v-alert>
            <div v-if="!recipes || recipes.length == 0">
                <create-first />
            </div>
            <div v-else>
                <v-card outlined>
                    <v-card-title class="accent">
                        Last automated activities
                    </v-card-title>
                    <v-card-text class="pl-0 pr-0">
                        <div class="mt-4 pl-4 pr-4" v-if="!activities">
                            <p>
                                <v-progress-circular class="mr-1 mt-n1" size="16" width="2" indeterminate></v-progress-circular>
                                Loading statistics...
                            </p>
                        </div>
                        <div class="mt-4 pl-4 pr-4" v-else-if="activities.length == 0">
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
                                    <th>Original activity</th>
                                    <th>Automation(s)</th>
                                    <th>Updated fields</th>
                                    <th>Strava</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="activity in activities" :key="activity.id">
                                    <td class="text-center" v-if="$breakpoint.mdAndUp">
                                        <v-icon>{{ getSportIcon(activity.type) }}</v-icon>
                                    </td>
                                    <td class="pt-2 pb-2">
                                        <template v-if="!$breakpoint.mdAndUp">
                                            <v-icon class="mt-n1 mr-1" small>{{ getSportIcon(activity.type) }}</v-icon>
                                            <span class="float-right ml-2">{{ getDate(activity).format("ll") }}</span>
                                            <a :href="`https://www.strava.com/activities/${activity.id}`" :title="`Open activity ${activity.id} on Strava`" target="strava">{{ activity.name }}</a>
                                            <ul>
                                                <li v-for="[id, recipe] in Object.entries(activity.recipes)" :key="`${activity.id}-m-${id}`">
                                                    <span :class="{'text-decoration-line-through grey--text': !user.recipes[id]}">{{ recipe.title }}</span>
                                                </li>
                                            </ul>
                                        </template>
                                        <template v-else>
                                            {{ activity.name }}
                                            <br />
                                            {{ getDate(activity).format("lll") }}
                                        </template>
                                    </td>
                                    <td v-if="$breakpoint.mdAndUp">
                                        <div v-for="[id, recipe] in Object.entries(activity.recipes)" :key="`${activity.id}-d-${id}`">
                                            <span :class="{'text-decoration-line-through grey--text': !user.recipes[id]}">{{ recipe.title }}</span>
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
                        <div class="caption mt-5 ml-5">
                            Please note that the list above does not show activities that were not updated by Strautomator.
                        </div>
                    </v-card-text>
                </v-card>
                <v-alert class="mt-4 text-center text-md-left">
                    Missing something?
                    <br v-if="!$breakpoint.mdAndUp" />
                    <n-link to="/activities/sync" title="Try your automations" nuxt>Try a manual sync</n-link>
                    to test your automations.
                </v-alert>
                <v-alert class="mt-4 text-center text-md-left">
                    Want your Strava activities on your device's calendar?
                    <n-link to="/calendar" title="Calendar subscription" nuxt>Subscribe</n-link>
                    to your iCalendar now.
                </v-alert>
            </div>
        </v-container>
    </v-layout>
</template>

<script>
import _ from "lodash"
import CreateFirst from "~/components/recipes/CreateFirst.vue"
import userMixin from "~/mixins/userMixin.js"
import recipeMixin from "~/mixins/recipeMixin.js"
import stravaMixin from "~/mixins/stravaMixin.js"

export default {
    authenticated: true,
    components: {CreateFirst},
    mixins: [userMixin, recipeMixin, stravaMixin],
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
            this.activities = await this.$axios.$get(`/api/strava/activities/processed?limit=10`)
        } catch (ex) {
            this.$webError("Dashboard.fetch", ex)
        }
    },
    mounted() {
        this.getStravaStatus()
    },
    methods: {
        getDate(activity) {
            const aDate = this.$moment(activity.dateStart)

            // Always display local activity times!
            if (activity.utcStartOffset) {
                aDate.utcOffset(activity.utcStartOffset)
            }

            return aDate
        },
        getUpdatedFields(fields) {
            const arr = Object.keys(fields)
            arr.sort()
            return arr.join(", ")
        }
    }
}
</script>
