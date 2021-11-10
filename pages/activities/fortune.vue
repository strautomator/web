<template>
    <v-layout column>
        <v-container fluid>
            <h1>Activity fortune</h1>
            <div>Try out Strautomator's auto generaed activity names. Just like fortune cookies.</div>
            <v-card class="mt-6" outlined>
                <v-card-text>
                    <div class="d-flex" :class="{'flex-column': !$breakpoint.mdAndUp}">
                        <div class="flex-grow-1">
                            <v-text-field v-model="activityId" label="Activity ID or URL" outlined rounded dense></v-text-field>
                        </div>
                        <div class="flex-grow-0 text-center text-md-right">
                            <v-btn color="primary" class="ml-md-4 mt-n4 mt-md-0" @click="getActivity()" rounded>
                                <v-icon left>mdi-lightbulb</v-icon>
                                Try it out
                            </v-btn>
                        </div>
                    </div>
                    <div v-if="loading" class="text-center text-md-left mt-4 mt-md-0">
                        <v-progress-circular class="mr-1 mt-n1" size="16" width="2" indeterminate></v-progress-circular>
                        Processing activity ID {{ activityId }}...
                    </div>
                    <v-alert class="mt-4" border="top" color="error" v-if="syncError">
                        {{ syncError }}
                    </v-alert>
                    <div v-else-if="activity">
                        <v-alert class="mt-4 mt-md-0 text-center text-h6 text-md-h4" border="top" color="accent">
                            {{ activityName }}
                            <div class="mt-2 text-center">
                                <v-btn color="primary" title="Get a new activity name" @click="getFortune()" small rounded outlined>Refresh</v-btn>
                            </div>
                        </v-alert>
                    </div>
                </v-card-text>
            </v-card>
            <div class="text-caption mt-2">
                Please note that this form will <strong>not</strong> update your activity.
                <br />
                If you want to have the name of your activities updated, use the "Auto generate the activity name" action on your automation(s).
            </div>
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
            title: "Activity fortune"
        }
    },
    data() {
        return {
            loading: false,
            syncError: null,
            activity: null,
            activityName: null,
            activityId: ""
        }
    },
    methods: {
        async getActivity() {
            if (isNaN(this.activityId)) {
                const arrUrl = this.activityId.replace("https://", "").split("/")

                if (arrUrl.length < 3) {
                    this.activity = null
                    this.syncError = "Invalid activity URL"
                    return
                }

                this.activityId = arrUrl[2]
            }

            try {
                this.loading = true
                this.syncError = null
                this.activityName = null
                this.activity = null
                this.activity = await this.$axios.$get(`/api/strava/activities/${this.activityId}/details`)

                if (this.activity) {
                    await this.getFortune()
                } else {
                    this.syncError = "Activity not available"
                }
            } catch (ex) {
                if (ex.response && ex.response.status == 404) {
                    this.syncError = "Activity not found."
                } else {
                    this.syncError = ex.response && ex.response.data.error ? ex.response.data.error : ex.toString()
                }

                this.loading = false
            }
        },
        async getFortune() {
            try {
                this.loading = true
                this.syncError = null

                const timestamp = Math.round(new Date().valueOf() / 1000)
                const result = await this.$axios.$post(`/api/strava/activity-fortune?ts=${timestamp}`, this.activity)

                this.activityName = result.name
                this.loading = false
            } catch (ex) {
                this.syncError = ex.response && ex.response.data.message ? ex.response.data.message : ex.toString()
                this.loading = false
            }
        }
    }
}
</script>
