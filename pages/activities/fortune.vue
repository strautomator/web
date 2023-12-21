<template>
    <v-layout column>
        <v-container fluid>
            <h1>Activity fortune</h1>
            <div>Try out Strautomator's generated activity names, powered by ChatGPT and Gemini!</div>
            <v-card class="mt-6" outlined>
                <v-card-text class="pb-2 pb-md-0">
                    <v-container class="ma-0 pa-0" fluid>
                        <v-row no-gutters>
                            <v-col cols="12" :sm="12" :md="4">
                                <v-text-field v-model="activityId" label="Activity ID or URL" :loading="loading" outlined rounded dense></v-text-field>
                            </v-col>
                            <v-col cols="12" :sm="12" :md="3">
                                <v-select label="Humour" v-model="selectedAiHumour" class="ml-md-2 mt-n2 mt-md-0" item-value="value" item-text="text" :items="aiHumours" dense outlined rounded return-object></v-select>
                            </v-col>
                            <v-col cols="12" :sm="12" :md="3">
                                <v-select label="Provider" v-model="selectedAiProvider" class="ml-md-2 mt-n2 mt-md-0" item-value="value" item-text="text" :items="aiProviders" dense outlined rounded return-object></v-select>
                            </v-col>
                            <v-col class="text-center text-md-right mt-1" cols="12" :sm="12" :md="2">
                                <v-btn color="primary" class="mt-n4 mt-md-0" @click="getActivity()" :loading="loading" rounded>
                                    <v-icon left>mdi-lightbulb</v-icon>
                                    Try it!
                                </v-btn>
                            </v-col>
                        </v-row>
                    </v-container>
                    <div class="d-flex" :class="{'flex-column': !$breakpoint.mdAndUp}">
                        <div class="flex-grow-1"></div>
                        <div class="flex-grow-0 flex-shrink-1" :class="{'flex-column': !$breakpoint.mdAndUp}"></div>
                        <div class="flex-grow-0 flex-shrink-1" :class="{'flex-column': !$breakpoint.mdAndUp}"></div>
                        <div class="flex-grow-0 text-center text-md-right"></div>
                    </div>
                    <div v-if="activity === false" class="text-center text-md-left mt-4 mt-md-0 pb-md-4">Enter the activity URL or ID above, or leave blank to pick a recently processed activity.</div>

                    <v-alert class="mt-4 mt-md-0" border="top" color="error" v-else-if="syncError">
                        {{ syncError }}
                    </v-alert>
                </v-card-text>
            </v-card>
            <template v-if="activityName">
                <v-card class="mt-4" outlined>
                    <v-card-title class="accent text-center text-md-left nobreak">
                        {{ activityName }}
                    </v-card-title>
                    <v-card-text>
                        <div class="mt-4 poem">{{ activityDescription }}</div>
                        <div class="mt-4">
                            Original activity: <a :href="'https://strava.com/activities/' + activity.id" target="strava">{{ activity.name }}</a>
                        </div>
                    </v-card-text>
                </v-card>
                <v-alert v-if="!user.isPro" class="mt-2" border="top" color="primary" colored-border>
                    <p>
                        Activity poems auto generated with AI are available to PRO users only.
                        <br v-if="$breakpoint.mdAndUp" />
                        Free accounts will still be able to use AI to generate activity names.
                    </p>
                    <v-btn color="primary" to="/billing" title="Subscribe to get a PRO account!" rounded nuxt>
                        <v-icon left>mdi-credit-card</v-icon>
                        Subscribe to PRO
                    </v-btn>
                </v-alert>
            </template>
            <div class="text-caption mt-2" v-if="activity">If you want to have AI generated names and poems set on your Strava activities, please use the actions "Generate the activity name" or "Generate a poem" on your automation(s).</div>
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
            activity: false,
            activityName: null,
            activityDescription: null,
            activityId: "",
            aiHumours: aiHumours,
            selectedAiHumour: aiHumours[0],
            aiProviders: [
                {value: "openai", text: "ChatGPT"},
                {value: "gemini", text: "Gemini"}
            ],
            selectedAiProvider: "openai",
            syncError: null
        }
    },
    methods: {
        async getActivity() {
            this.activityName = null
            this.activityDescription = null
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

                const body = {activity: this.activity, humour: this.selectedAiHumour.value, provider: this.selectedAiProvider.value}
                const timestamp = Math.round(new Date().valueOf() / 1000)
                const result = await this.$axios.$post(`/api/strava/${this.user.id}/activity-ai-generate`, body)

                this.activityName = result.name.response
                this.activityDescription = result.description.response
                this.loading = false
            } catch (ex) {
                this.syncError = ex.response && ex.response.data.message ? ex.response.data.message : ex.toString()
                this.loading = false
            }
        }
    }
}
</script>
