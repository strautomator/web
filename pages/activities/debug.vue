<template>
    <v-layout column>
        <v-container fluid>
            <h1>Activity debug</h1>
            <v-card class="mt-6" outlined>
                <v-card-text class="pb-2 pb-md-0">
                    <v-container class="ma-0 pa-0" fluid>
                        <v-row no-gutters>
                            <v-col cols="12" :sm="12" :md="10">
                                <v-text-field v-model="activityId" label="Activity ID or URL" :loading="loading" outlined rounded dense></v-text-field>
                            </v-col>
                            <v-col class="text-center text-md-right mt-1" cols="12" :sm="12" :md="2">
                                <v-btn color="primary" class="mt-n4 mt-md-0" @click="getActivity()" :loading="loading" :disabled="activityId.length < 5" rounded>
                                    <v-icon left>mdi-text-search</v-icon>
                                    Inspect
                                </v-btn>
                            </v-col>
                        </v-row>
                    </v-container>
                    <div v-if="activity === false" class="text-center text-md-left mt-4 mt-md-0 pb-md-4">Enter the activity URL or ID above.</div>
                    <v-alert class="mt-4 mt-md-0" border="top" color="error" v-else-if="syncError">
                        {{ syncError }}
                    </v-alert>
                </v-card-text>
            </v-card>
            <template v-if="activity">
                <v-card class="mt-4" outlined>
                    <v-card-title class="accent text-center text-md-left nobreak">
                        {{ activity.name }}
                    </v-card-title>
                    <v-card-text>
                        <div class="mt-4">
                            <ul class="ml-0 pl-4">
                                <li v-for="(value, key) in activity">
                                    <span class="font-weight-bold">{{ key }}</span> -
                                    {{ friendlyValue(value) }}
                                </li>
                            </ul>
                        </div>
                        <div v-if="garminActivity">
                            <ul class="ml-0 pl-4">
                                <li v-for="(value, key) in garminActivity">
                                    <span class="font-weight-bold">garmin.{{ key }}</span> -
                                    {{ friendlyValue(value) }}
                                </li>
                            </ul>
                        </div>
                    </v-card-text>
                </v-card>
            </template>
        </v-container>
    </v-layout>
</template>

<script>
import _ from "lodash"
import userMixin from "~/mixins/userMixin.js"
import recipeMixin from "~/mixins/recipeMixin.js"

export default {
    authenticated: true,
    mixins: [userMixin, recipeMixin],
    head() {
        return {
            title: "Activity debug"
        }
    },
    data() {
        return {
            loading: false,
            activityId: "",
            activity: false,
            garminActivity: false,
            garminError: null,
            syncError: null
        }
    },
    methods: {
        async getActivity() {
            this.activity = null
            this.garminActivity = null
            this.garminError = null

            if (isNaN(this.activityId)) {
                const arrUrl = this.activityId.replace("https://", "").split("/")

                if (arrUrl.length < 3) {
                    this.syncError = "Invalid activity URL."
                    return
                }

                this.activityId = arrUrl[2]
            }

            if (isNaN(this.activityId)) {
                this.syncError = "Invalid activity ID."
                return
            }

            try {
                this.loading = true
                this.syncError = null

                const activity = await this.$axios.$get(`/api/strava/${this.user.id}/activities/${this.activityId}/details`)
                if (!activity) {
                    this.syncError = "Activity not found."
                    return
                }

                // Polyline string is useless here, so take it out before assigning the activity.
                delete activity.polyline
                this.activity = activity

                if (this.user.isPro && activity.device?.includes("Garmin")) {
                    try {
                        const garminActivity = await this.$axios.$post(`/api/garmin/${this.user.id}/match-activity/${this.activityId}`)
                        if (!garminActivity.notFound) {
                            this.garminActivity = garminActivity
                        }
                    } catch (garminEx) {
                        this.garminError = garminEx.response?.data?.message || garminEx.toString()
                    }
                }
            } catch (ex) {
                if (ex.response?.status == 404 || ex.message?.includes("Not Found")) {
                    this.syncError = "Activity not found."
                } else {
                    this.syncError = ex.response?.data?.error ? ex.response.data.error : ex.toString()
                }
            }

            this.loading = false
        },
        friendlyValue(value) {
            if (_.isArray(value)) {
                return value.join(", ")
            }
            if (_.isObject(value)) {
                const keys = Object.keys(value)
                return keys.map((k) => `${k}: ${value[k]}`).join(", ")
            }

            return value
        }
    }
}
</script>
