<template>
    <v-layout column>
        <v-container fluid>
            <h1>Activity fortune</h1>
            <div>Try out Strautomator's auto generated activity names, just like fortune cookies!</div>
            <v-card class="mt-6" outlined>
                <v-card-text class="pb-2 pb-md-0">
                    <div class="d-flex" :class="{'flex-column': !$breakpoint.mdAndUp}">
                        <div class="flex-grow-1">
                            <v-text-field v-model="activityId" label="Activity ID or URL" :loading="loading" outlined rounded dense></v-text-field>
                        </div>
                        <div class="flex-grow-0" :class="{'flex-column': !$breakpoint.mdAndUp}">
                            <v-select label="Humour" v-model="selectedAiHumour" class="ml-md-4 mt-n2 mt-md-0" item-value="value" item-text="text" :items="aiHumours" dense outlined rounded return-object></v-select>
                        </div>
                        <div class="flex-grow-0 text-center text-md-right">
                            <v-btn color="primary" class="ml-md-4 mt-n4 mt-md-0" @click="getActivity()" :loading="loading" rounded>
                                <v-icon left>mdi-lightbulb</v-icon>
                                Try it out
                            </v-btn>
                        </div>
                    </div>
                    <div v-if="activity === false" class="text-center text-md-left mt-4 mt-md-0 pb-md-4">Enter the activity URL or ID above, or leave blank to pick a recently processed activity.</div>

                    <v-alert class="mt-4 mt-md-0" border="top" color="error" v-else-if="syncError">
                        {{ syncError }}
                    </v-alert>
                </v-card-text>
            </v-card>
            <v-card class="mt-4" v-if="activityName" outlined>
                <v-card-title class="accent text-center text-md-left nobreak">
                    {{ activityName }}
                </v-card-title>
                <v-card-text>
                    <ul class="mt-2 ml-n3">
                        <li>Original name: {{ activity.name }}</li>
                        <li>Date: {{ $dayjs(activity.dateStart).format("lll") }}</li>
                        <li v-if="activity.distance">Distance: {{ activity.distance }} {{ user.profile.units == "imperial" ? "mi" : "km" }}</li>
                        <li v-if="activity.speedAvg">Speed: {{ activity.speedAvg }} {{ user.profile.units == "imperial" ? "mph" : "kph" }}</li>
                    </ul>
                    <div class="mt-4">
                        Prompt sent to ChatGPT:
                        <div class="body-2 font-italic">{{ prompt }}</div>
                    </div>
                </v-card-text>
            </v-card>
            <div class="text-caption mt-2" v-if="activity">
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
        const aiHumours = _.cloneDeep(this.$store.state.aiHumours).map((h) => {
            return {value: h, text: h.charAt(0).toUpperCase() + h.slice(1)}
        })
        aiHumours.unshift({value: "", text: "Random"})

        return {
            loading: false,
            prompt: null,
            activity: false,
            activityName: null,
            activityId: "",
            aiHumours: aiHumours,
            selectedAiHumour: aiHumours[0],
            syncError: null
        }
    },
    methods: {
        async getActivity() {
            this.activityName = null
            this.activity = null

            if (this.activityId.trim() == "") {
                const activities = await this.$axios.$get(`/api/strava/${this.user.id}/activities/processed?limit=10`)

                if (activities.length > 0) {
                    this.activityId = _.sample(activities).id
                } else {
                    this.syncError = "No processed activities found, please enter a activity ID or URL."
                    return
                }
            } else if (isNaN(this.activityId)) {
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
                this.activity = await this.$axios.$get(`/api/strava/${this.user.id}/activities/${this.activityId}/details`)

                if (this.activity) {
                    await this.getFortune()
                } else {
                    this.syncError = "Activity not available."
                }
            } catch (ex) {
                if (ex.response?.status == 404 || ex.message?.includes("Not Found")) {
                    this.syncError = "Activity not found."
                } else {
                    this.syncError = ex.response?.data?.error ? ex.response.data.error : ex.toString()
                }

                this.loading = false
            }
        },
        async getFortune() {
            try {
                this.loading = true
                this.syncError = null
                this.activity.humour = this.selectedAiHumour.value

                const timestamp = Math.round(new Date().valueOf() / 1000)
                const result = await this.$axios.$post(`/api/strava/${this.user.id}/activity-generate-name?ts=${timestamp}`, this.activity)

                this.activityName = result.response
                this.prompt = result.prompt
                this.loading = false
            } catch (ex) {
                this.syncError = ex.response && ex.response.data.message ? ex.response.data.message : ex.toString()
                this.loading = false
            }
        }
    }
}
</script>
