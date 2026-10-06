<template>
    <v-layout column>
        <v-container fluid>
            <h1>Recent activities</h1>
            <div>Want to try out your automations or debug your recent Strava activities?</div>
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
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-if="recentActivities.length == 0">
                        <td :colspan="$breakpoint.mdAndUp ? 5 : 2" class="pt-4 pb-2 pl-8">No recent activities found.</td>
                    </tr>
                    <tr v-for="activity in recentActivities" :key="activity.id">
                        <td width="1">
                            <v-icon>{{ getSportIcon(activity.sportType) }}</v-icon>
                        </td>
                        <td>
                            <div class="mt-2 mb-2">
                                <template v-if="!$breakpoint.mdAndUp">
                                    <div class="font-weight-bold">{{ activity.name }}</div>

                                    <div class="mt-2 float-right">
                                        <v-btn color="primary" :title="`Debug the activity ${activity.id}`" @click="debugActivity(activity.id)" icon small outlined>
                                            <v-icon class="mr-md-1">mdi-bug-outline</v-icon>
                                        </v-btn>
                                        <v-btn color="primary" class="ml-2" :title="`Try automations on activity ${activity.id}`" @click="syncActivity(activity.id)" rounded small>
                                            <v-icon class="mr-md-1">mdi-playlist-play</v-icon>
                                        </v-btn>
                                    </div>

                                    <div class="caption">
                                        {{ getDate(activity.dateStart).format("lll") }}
                                        <br />
                                        <template v-if="activity.distance">{{ activity.distance }} {{ user.profile.units == "imperial" ? "mi" : "km" }}</template>
                                        <template v-else-if="activity.hrAvg">{{ activity.hrAvg }} bpm</template>
                                    </div>
                                </template>
                                <template v-else>
                                    {{ activity.name }}
                                    <br />
                                    {{ getDate(activity.dateStart).format("lll") }}
                                </template>
                            </div>
                        </td>
                        <template v-if="$breakpoint.mdAndUp">
                            <td>
                                {{ activity.distance }}
                                {{ user.profile.units == "imperial" ? "mi" : "km" }}
                            </td>
                            <td>
                                {{ getDuration(activity.totalTime) }}
                            </td>
                            <td class="text-right">
                                <v-btn color="primary" :title="`Debug the activity ${activity.id}`" @click="debugActivity(activity.id)" small rounded outlined>
                                    <v-icon class="mr-md-1">mdi-bug-outline</v-icon>
                                    Debug
                                </v-btn>
                                <v-btn color="primary" class="ml-2" :title="`Try automations on activity ${activity.id}`" @click="syncActivity(activity.id)" small rounded>
                                    <v-icon class="mr-md-1">mdi-playlist-play</v-icon>
                                    Process
                                </v-btn>
                            </td>
                        </template>
                    </tr>
                    <tr>
                        <td :colspan="$breakpoint.mdAndUp ? 5 : 2" class="pt-4 pb-4 pb-md-2">
                            <v-row no-gutters>
                                <v-col :cols="$breakpoint.mdAndUp ? 8 : 12" no-gutters>
                                    <div class="caption ml-4 mb-1">Another activity?</div>
                                    <div>
                                        <v-text-field v-model="activityId" label="ID or URL" outlined rounded dense></v-text-field>
                                    </div>
                                </v-col>
                                <v-col class="text-center text-md-right mt-n4 mt-md-0" :cols="$breakpoint.mdAndUp ? 4 : 12" no-gutters>
                                    <v-btn color="primary" class="mt-md-6" title="Debug the activity specified" :disabled="activityId.length < 5" @click="debugActivity()" rounded outlined>
                                        <v-icon class="mr-md-1">mdi-bug-outline</v-icon>
                                        Debug
                                    </v-btn>
                                    <v-btn color="primary" class="mt-md-6 ml-2" title="Process the activity specified" :disabled="activityId.length < 5" @click="syncActivity()" rounded>
                                        <v-icon class="mr-md-1">mdi-playlist-play</v-icon>
                                        Process
                                    </v-btn>
                                </v-col>
                            </v-row>
                        </td>
                    </tr>
                </tbody>
            </v-simple-table>

            <div class="mt-4" v-if="recipes.length == 0">
                <create-first />
            </div>
            <v-card class="mt-4" outlined>
                <v-card-text>
                    <div class="text-center text-md-left">
                        <div>Want to execute your current automations on many Strava activities at once?</div>
                        <v-btn color="primary" class="mt-4" to="/activities/batchsync" rounded>
                            <v-icon left>mdi-animation-play</v-icon>
                            Proceed to batch processing
                        </v-btn>
                    </div>
                </v-card-text>
            </v-card>
        </v-container>
    </v-layout>
</template>

<script>
import _ from "lodash"
import userMixin from "~/mixins/userMixin.js"
import stravaMixin from "~/mixins/stravaMixin.js"
import CreateFirst from "~/components/recipes/CreateFirst.vue"

export default {
    authenticated: true,
    components: {CreateFirst},
    mixins: [userMixin, stravaMixin],
    head() {
        return {
            title: "Recent activities"
        }
    },
    data() {
        return {
            loading: true,
            recentActivities: [],
            activityId: ""
        }
    },
    computed: {
        recipes() {
            return Object.values(this.user.recipes)
        }
    },
    async fetch() {
        try {
            this.loading = true
            this.recentActivities = await this.$axios.$get(`/api/strava/${this.user.id}/activities/recent`)
        } catch (ex) {
            this.$webError(this, "ActivitiesRecent.fetch", ex)
        } finally {
            this.loading = false
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
        parseActivityId() {
            if (isNaN(this.activityId)) {
                const arrUrl = this.activityId.replace("https://", "").split("/")
                if (arrUrl.length < 3) {
                    return
                }

                this.activityId = arrUrl[2]
            }

            return this.activityId
        },
        syncActivity(id) {
            if (!id) {
                id = this.parseActivityId()
            }
            this.$router.push({path: `/activities/sync?id=${id}`})
        },
        debugActivity(id) {
            if (!id) {
                id = this.parseActivityId()
            }
            this.$router.push({path: `/activities/debug?id=${id}`})
        }
    }
}
</script>
