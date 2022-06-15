<template>
    <v-layout column>
        <v-container fluid>
            <h1>Activity sync</h1>
            <template v-if="recipes.length == 0">
                <create-first />
            </template>
            <template v-else-if="processedActivity === false">
                <div>Want to try out your automations with one of your recent Strava activities?</div>
                <div class="mt-4" v-if="loading">
                    <v-progress-circular class="mr-1 mt-n1" size="16" width="2" indeterminate></v-progress-circular>
                    Loading recent activities from Strava...
                </div>
                <v-simple-table class="mt-4" v-else>
                    <thead v-if="$breakpoint.mdAndUp && recentActivities.length > 0">
                        <tr>
                            <th></th>
                            <th>Activity</th>
                            <th>Distance</th>
                            <th>Total Time</th>
                            <th class="text-right">Sync</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-if="recentActivities.length == 0">
                            <td :colspan="$breakpoint.mdAndUp ? 5 : 4" class="pt-4 pb-2 pl-10">No recent activities found.</td>
                        </tr>
                        <tr v-for="activity in recentActivities" :key="activity.id">
                            <td>
                                <v-icon>{{ getSportIcon(activity.sportType) }}</v-icon>
                            </td>
                            <td>
                                <div class="mt-2 mb-2">
                                    <template v-if="!$breakpoint.mdAndUp">
                                        {{ activity.name }}

                                        <div class="caption">
                                            {{ getDate(activity.dateStart).format("ll") }}
                                            {{ activity.distance }}
                                            {{ user.profile.units == "imperial" ? "mi" : "km" }}
                                        </div>
                                    </template>
                                    <template v-else>
                                        {{ activity.name }}
                                        <br />
                                        {{ getDate(activity.dateStart).format("lll") }}
                                    </template>
                                </div>
                            </td>
                            <td v-if="$breakpoint.mdAndUp">
                                {{ activity.distance }}
                                {{ user.profile.units == "imperial" ? "mi" : "km" }}
                            </td>
                            <td v-if="$breakpoint.mdAndUp">
                                {{ getDuration(activity.totalTime) }}
                            </td>
                            <td class="text-right">
                                <v-btn color="primary" :title="`Try automations on activity ${activity.id}`" @click="syncActivity(activity.id)" icon>
                                    <v-icon>mdi-play-circle</v-icon>
                                </v-btn>
                            </td>
                        </tr>
                        <tr>
                            <td :colspan="$breakpoint.mdAndUp ? 4 : 2" class="pt-4">
                                <div class="caption ml-6 mb-1">Older activity? Enter its ID below.</div>
                                <div>
                                    <v-text-field v-model="activityId" label="Activity ID or URL" outlined rounded dense></v-text-field>
                                </div>
                            </td>
                            <td class="text-right">
                                <v-btn color="primary" class="mt-4" :disabled="activityId.length < 5" :title="`Enter the activity ID or URL`" @click="syncActivity()" icon>
                                    <v-icon>mdi-play-circle</v-icon>
                                </v-btn>
                            </td>
                        </tr>
                    </tbody>
                </v-simple-table>
                <v-alert class="mt-4 text-caption text-center text-md-left" border="top">Please note that weather tags can't be added to activities that happened more than a week ago.</v-alert>
            </template>
            <template v-else>
                <div v-if="loading">
                    <v-progress-circular class="mr-1 mt-n1" size="16" width="2" indeterminate></v-progress-circular>
                    Processing activity ID {{ activityId }}...
                </div>
                <div v-else>
                    <v-alert border="top" color="error" v-if="syncError">
                        {{ syncError }}
                    </v-alert>
                    <v-card v-else outlined>
                        <v-card-title class="accent"> Activity {{ activityId }} </v-card-title>
                        <v-card-text>
                            <div class="mt-4" v-if="!processedActivity || recipeKeys.length == 0">No automations were triggered for this activity.</div>
                            <div class="mt-4" v-else>
                                <v-alert color="error" v-if="processedActivity.error" class="mt-4 mb-4">
                                    <div class="font-weight-bold">Sync error!</div>
                                    <div>
                                        {{ processedActivity.error }}
                                    </div>
                                </v-alert>
                                <div class="font-weight-bold">Name: {{ processedActivity.name }}</div>
                                <div>Date: {{ getDate(processedActivity.dateStart).format("lll") }}</div>
                                <div class="mt-4">Updated fields:</div>
                                <ul class="mt-1 pl-4 action-list">
                                    <li class="font-weight-medium" v-for="(field, index) in updatedFieldsKeys" :key="`ufield-${index}`">
                                        <span class="text-capitalize">{{ field }}:</span>
                                        {{ processedActivity.updatedFields[field] }}
                                    </li>
                                </ul>
                                <div class="mt-4">Triggered automations:</div>
                                <ul class="mt-1 pl-4 action-list">
                                    <li class="font-weight-medium" v-for="recipeId in recipeKeys" :key="recipeId">
                                        <n-link :to="'/automations/edit?id=' + recipeId" :title="processedActivity.recipes[recipeId].title">
                                            {{ processedActivity.recipes[recipeId].title }}
                                        </n-link>
                                    </li>
                                </ul>
                            </div>
                        </v-card-text>
                    </v-card>
                    <div class="mt-6 text-center text-md-left">
                        Want to try with another activity?
                        <br v-if="!$breakpoint.mdAndUp" />
                        <v-btn color="primary" class="mt-4 mt-md-0 ml-md-1" @click="tryAgain" small rounded outlined>Try again</v-btn>
                    </div>

                    <ads-panel />
                </div>
            </template>
        </v-container>
    </v-layout>
</template>

<script>
import _ from "lodash"
import userMixin from "~/mixins/userMixin.js"
import recipeMixin from "~/mixins/recipeMixin.js"
import stravaMixin from "~/mixins/stravaMixin.js"
import AdsPanel from "~/components/AdsPanel.vue"
import CreateFirst from "~/components/recipes/CreateFirst.vue"

export default {
    authenticated: true,
    components: {AdsPanel, CreateFirst},
    mixins: [userMixin, recipeMixin, stravaMixin],
    head() {
        return {
            title: "Activity sync"
        }
    },
    data() {
        return {
            loading: true,
            activityId: "",
            recentActivities: [],
            processedActivity: false,
            syncError: null
        }
    },
    computed: {
        recipes() {
            return Object.values(this.user.recipes)
        },
        recipeKeys() {
            if (!this.processedActivity || !this.processedActivity.recipes) {
                return []
            }

            return Object.keys(this.processedActivity.recipes)
        },
        updatedFieldsKeys() {
            if (!this.processedActivity || !this.processedActivity.updatedFields) {
                return []
            }

            return Object.keys(this.processedActivity.updatedFields)
        }
    },
    async fetch() {
        try {
            this.loading = true
            this.recentActivities = await this.$axios.$get(`/api/strava/${this.user.id}/activities/recent`)
            this.loading = false
        } catch (ex) {
            this.loading = false
            this.$webError("ActivitiesSync.fetch", ex)
        }
    },
    methods: {
        getDate(date) {
            return this.$dayjs(date)
        },
        getDuration(seconds) {
            const duration = this.$dayjs.duration(seconds, "seconds")
            let hours = duration.hours()
            let minutes = duration.minutes()
            if (hours < 10) hours = `0${hours}`
            if (minutes < 10) minutes = `0${minutes}`
            return `${hours}:${minutes}`
        },
        async syncActivity(id) {
            if (!id) {
                if (isNaN(this.activityId)) {
                    const arrUrl = this.activityId.replace("https://", "").split("/")

                    if (arrUrl.length < 3) {
                        this.processedActivity = null
                        this.syncError = "Invalid activity URL"
                        return
                    }

                    this.activityId = arrUrl[2]
                }

                id = this.activityId
            }

            try {
                this.syncError = null
                this.activityId = id
                this.processedActivity = null
                this.loading = true

                const processedActivity = await this.$axios.$get(`/api/strava/${this.user.id}/process-activity/${id}`)
                this.processedActivity = processedActivity
                this.loading = false
            } catch (ex) {
                this.processedActivity = null
                this.syncError = ex.response && ex.response.data.message ? ex.response.data.message : ex.toString()
                this.loading = false
            }
        },
        tryAgain() {
            this.processedActivity = false
            this.syncError = null
            this.activityId = ""
        }
    }
}
</script>
