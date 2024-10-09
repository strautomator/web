<template>
    <v-layout column>
        <v-container fluid>
            <h1>Activity photo</h1>
            <template v-if="!user || user.preferences?.privacyMode">
                <div>
                    The AI features are disabled when Privacy Mode is enabled. If you wish to test it, please disable the Privacy Mode on your
                    <n-link to="/account" title="My Account" nuxt>account preferences</n-link>.
                </div>
            </template>
            <template v-else-if="quota < 1">
                <v-alert border="top" color="primary" colored-border>
                    <p class="mt-4">You have reached your weekly quota, please try again in a few days, or subscribe to PRO to get a higher quota.</p>
                </v-alert>
            </template>
            <template v-else>
                <div>Try out Strautomator's generated activity photos, powered by AI (BETA)!<br />While this feature is being tested, users can use it only a few times per week.</div>
                <v-card class="mt-6" outlined>
                    <v-card-text class="pb-2 pb-md-0">
                        <v-container class="ma-0 pa-0" fluid>
                            <v-row no-gutters>
                                <v-col cols="12" :sm="12" :md="4">
                                    <v-text-field v-model="activityId" label="Activity ID or URL" :loading="loading" :disabled="loading || generating" outlined rounded dense></v-text-field>
                                </v-col>
                                <v-col cols="12" :sm="12" :md="3">
                                    <v-select
                                        label="Style"
                                        v-model="selectedAiStyle"
                                        class="ml-md-2 mt-n2 mt-md-0"
                                        item-value="value"
                                        item-text="text"
                                        :items="aiStyles"
                                        :disabled="loading || generating"
                                        dense
                                        outlined
                                        rounded
                                        return-object
                                    ></v-select>
                                </v-col>
                                <v-col cols="12" :sm="12" :md="3">
                                    <v-select
                                        label="Provider"
                                        v-model="selectedAiProvider"
                                        class="ml-md-2 mt-n2 mt-md-0"
                                        item-value="value"
                                        item-text="text"
                                        :items="aiProviders"
                                        :disabled="loading || generating"
                                        dense
                                        outlined
                                        rounded
                                        return-object
                                    ></v-select>
                                </v-col>
                                <v-col class="text-center text-md-right mt-1" cols="12" :sm="12" :md="2">
                                    <v-btn color="primary" class="mt-n4 mt-md-0" @click="getActivity()" :disabled="loading || generating" rounded>
                                        <v-icon left>mdi-image-auto-adjust</v-icon>
                                        Try it!
                                    </v-btn>
                                </v-col>
                            </v-row>
                        </v-container>
                        <div v-if="activity === false" class="text-center text-md-left mt-4 mt-md-0 pb-md-4">Enter the activity URL or ID above, or leave blank to pick a random recent activity.</div>
                        <v-alert class="mt-4 mt-md-0" border="top" color="error" v-else-if="apiError">
                            {{ apiError }}
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
                                <div v-if="generating">
                                    <v-progress-circular class="mr-1 mt-n1" size="16" width="2" indeterminate></v-progress-circular>
                                    Generating image, please wait...
                                </div>
                                <v-img :src="imageUrl" @load="imgLoaded" @error="imgError" />
                            </div>
                        </v-card-text>
                    </v-card>
                </template>
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
            title: "Activity photos"
        }
    },
    data() {
        const aiStyles = ["anime", "cartoonish", "pixelated", "sci-fi drawing", "vibrant fantasy", "vintage"].map((h) => {
            return {value: h, text: h.charAt(0).toUpperCase() + h.slice(1)}
        })
        aiStyles.unshift({value: "", text: "Random"})

        return {
            loading: false,
            generating: false,
            quota: 1,
            activity: false,
            activityId: "",
            apiError: null,
            aiStyles: aiStyles,
            selectedAiStyle: aiStyles[0],
            aiProviders: [
                {value: "gemini", text: "Gemini"},
                {value: "openai", text: "OpenAI"}
            ],
            selectedAiProvider: "openai"
        }
    },
    computed: {
        imageUrl() {
            if (!this.activity) return ""
            return `/api/ai/${this.user.id}/${this.user.urlToken}/activity/${this.activity.id}.png?provider=${this.selectedAiProvider.value}&style=${this.selectedAiStyle.value}`
        }
    },
    async fetch() {
        try {
            const res = await this.$axios.$get(`/api/ai/${this.user.id}/image-quota`)

            if (!res || res.quota < 1) {
                this.quota = 0
            }
        } catch (ex) {
            this.apiError = "Failed to check your current quota."
        }
    },
    methods: {
        async getActivity() {
            this.activity = null
            this.apiError = null
            this.loading = true

            if (this.activityId.trim() == "") {
                const activities = await this.$axios.$get(`/api/strava/${this.user.id}/processed-activities?limit=10`)

                if (activities.length > 0) {
                    this.activityId = _.sample(activities).id
                } else {
                    this.apiError = "No processed activities found, please enter a activity ID or URL."
                    return
                }
            } else if (isNaN(this.activityId)) {
                const arrUrl = this.activityId.replace("https://", "").split("/")

                if (arrUrl.length < 3) {
                    this.apiError = "Invalid activity URL."
                    return
                }

                this.activityId = arrUrl[2]
            }

            if (isNaN(this.activityId)) {
                this.apiError = "Invalid activity ID."
                return
            }

            try {
                this.activity = await this.$axios.$get(`/api/strava/${this.user.id}/activities/${this.activityId}/details`)

                if (!this.activity) {
                    this.apiError = "Activity not available."
                }
            } catch (ex) {
                if (ex.response?.status == 404 || ex.message?.includes("Not Found")) {
                    this.apiError = "Activity not found."
                } else {
                    this.apiError = ex.response?.data?.error ? ex.response.data.error : ex.toString()
                }
            }

            this.loading = false
            this.generating = true
        },
        imgLoaded() {
            this.generating = false
        },
        imgError() {
            this.generating = false
            this.apiError = "Failed to generate the image."
        }
    }
}
</script>
