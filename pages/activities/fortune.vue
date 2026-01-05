<template>
    <v-layout column>
        <v-container fluid>
            <h1>Activity fortune</h1>
            <template v-if="!user || user.preferences?.privacyMode">
                <div>
                    The AI features are disabled when Privacy Mode is enabled. If you wish to test it, please disable the Privacy Mode on your
                    <n-link to="/account" title="My Account" nuxt>account preferences</n-link>.
                </div>
            </template>
            <template v-else>
                <div>Try out Strautomator's generated activity names and descriptions, powered by AI!</div>
                <v-card class="mt-6" outlined>
                    <v-card-text class="pb-2 pb-md-0">
                        <v-container class="ma-0 pa-0" fluid>
                            <v-row no-gutters>
                                <v-col cols="12" :sm="12" :md="4">
                                    <v-text-field v-model="activityId" label="Activity ID or URL" :loading="loading" outlined rounded dense></v-text-field>
                                </v-col>
                                <v-col cols="12" :sm="12" :md="3">
                                    <v-select label="Provider" v-model="selectedAiProvider" class="ml-md-2 mt-n2 mt-md-0" item-value="value" item-text="text" :items="aiProviders" :disabled="loading" dense outlined rounded return-object></v-select>
                                </v-col>
                                <v-col cols="12" :sm="12" :md="3">
                                    <v-select label="Humour" v-model="selectedAiHumour" class="ml-md-2 mt-n2 mt-md-0" item-value="value" item-text="text" :items="aiHumours" :disabled="loading" dense outlined rounded return-object></v-select>
                                </v-col>
                                <v-col class="text-center text-md-right mt-1" cols="12" :sm="12" :md="2">
                                    <v-btn color="primary" class="mt-n4 mt-md-0" @click="getActivity()" :disabled="loading" rounded>
                                        <v-icon left>mdi-lightbulb</v-icon>
                                        Try it!
                                    </v-btn>
                                </v-col>
                            </v-row>
                            <v-row v-if="selectedAiHumour.value == 'custom'" no-gutters>
                                <v-col cols="12" class="pt-0 pb-0">
                                    <v-text-field v-model="customPrompt" label="Custom prompt" outlined rounded dense></v-text-field>
                                </v-col>
                            </v-row>
                        </v-container>
                        <v-alert class="mt-4 mt-md-0" border="top" color="error" v-if="syncError">
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
                <div class="text-caption mt-2" v-if="activity">
                    AI features are available via the "Generate the activity name" and "Generate a poem" automation actions. PRO users also have the option to get activity analysis on their private notes with AI.
                </div>
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
            title: "Activity fortune"
        }
    },
    data() {
        const aiHumours = _.cloneDeep(this.$store.state.aiHumours).map((h) => {
            return {value: h, text: h.charAt(0).toUpperCase() + h.slice(1)}
        })
        aiHumours.unshift({value: "", text: "Random"})
        aiHumours.push({value: "custom", text: "Custom prompt"})

        return {
            loading: false,
            activity: false,
            activityName: null,
            activityDescription: null,
            activityId: "",
            customPrompt: "",
            aiHumours: aiHumours,
            selectedAiHumour: aiHumours[0],
            aiProviders: [
                {value: "openrouter", text: "Auto"},
                {value: "anthropic", text: "Anthropic"},
                {value: "gemini", text: "Gemini"},
                {value: "mistral", text: "Mistral"},
                {value: "openai", text: "OpenAI"},
                {value: "xai", text: "xAI"}
            ],
            selectedAiProvider: "openrouter",
            syncError: null
        }
    },
    methods: {
        async getActivity() {
            this.activityName = null
            this.activityDescription = null
            this.activity = null

            if (this.activityId.trim() == "") {
                const activities = await this.$axios.$get(`/api/strava/${this.user.id}/processed-activities?limit=10`)

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

                const body = {activity: this.activity, humourPrompt: this.selectedAiHumour.value, provider: this.selectedAiProvider.value}
                if (this.selectedAiHumour.value == "custom") {
                    body.humourPrompt += `:${this.customPrompt}`
                }
                const timestamp = Math.round(new Date().valueOf() / 1000)
                const result = await this.$axios.$post(`/api/ai/${this.user.id}/activity-generate`, body)

                this.activityName = result.name?.response || "Failed!"
                this.activityDescription = result.description?.response || "Failed!"
                this.loading = false
            } catch (ex) {
                this.syncError = ex.response && ex.response.data.message ? ex.response.data.message : ex.toString()
                this.loading = false
            }
        }
    }
}
</script>
