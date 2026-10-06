<template>
    <v-layout column>
        <v-container fluid>
            <h1>Process activity</h1>
            <template v-if="recipes.length > 0">
                <v-card class="mb-4" outlined>
                    <v-card-text class="pb-2 pb-md-0">
                        <v-container class="ma-0 pa-0" fluid>
                            <v-row no-gutters>
                                <v-col cols="12" :sm="12" :md="10">
                                    <v-text-field v-model="activityId" label="Activity ID or URL" :loading="loading" outlined rounded dense></v-text-field>
                                </v-col>
                                <v-col class="text-center text-md-right mt-1" cols="12" :sm="12" :md="2">
                                    <v-btn color="primary" class="mt-n6 mt-md-0" @click="setActivityRoute()" :loading="loading" :disabled="activityId.length < 5" rounded>
                                        <v-icon left>mdi-playlist-play</v-icon>
                                        Process
                                    </v-btn>
                                </v-col>
                            </v-row>
                        </v-container>
                        <div v-if="processedActivity === false" class="text-center text-md-left mt-4 mt-md-0 pb-md-4">Enter the activity URL or ID above.</div>
                    </v-card-text>
                </v-card>

                <div v-if="loading">
                    <v-progress-circular class="mr-1 mt-n1" size="16" width="2" indeterminate></v-progress-circular>
                    Processing activity {{ activityId }}...
                </div>
                <template v-else>
                    <v-alert border="top" color="error" v-if="syncError">
                        {{ syncError }}
                    </v-alert>
                    <v-card v-else outlined>
                        <v-card-title class="accent">Activity {{ activityId }}</v-card-title>
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
                                    <li v-if="updatedFieldsKeys.length == 0">None</li>
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
                            <v-alert color="accent" class="mt-4 text-caption text-center text-md-left pa-2 mb-0" v-if="hasWeather">Weather conditions and tags might not be available for activities older than 1 week.</v-alert>
                        </v-card-text>
                    </v-card>
                    <div class="mt-4 text-center text-md-left">
                        <v-btn color="primary" title="Debug this activity" @click="debugActivity" rounded>
                            <v-icon left>mdi-text-search</v-icon>
                            Debug this activity
                        </v-btn>
                    </div>
                </template>
            </template>

            <template v-else>
                <create-first />
            </template>
        </v-container>
    </v-layout>
</template>

<script>
import _ from "lodash"
import userMixin from "~/mixins/userMixin.js"
import recipeMixin from "~/mixins/recipeMixin.js"
import stravaMixin from "~/mixins/stravaMixin.js"
import CreateFirst from "~/components/recipes/CreateFirst.vue"

export default {
    authenticated: true,
    components: {CreateFirst},
    mixins: [userMixin, recipeMixin, stravaMixin],
    head() {
        return {
            title: "Process activity"
        }
    },
    data() {
        return {
            loading: true,
            activityId: "",
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
        },
        hasWeather() {
            if (!this.processedActivity || !this.processedActivity.recipes) return false
            const recipeIds = Object.keys(this.processedActivity.recipes)
            for (let r = 0; r < recipeIds.length; r++) {
                const recipe = this.user.recipes[r]
                if (recipe && JSON.stringify(recipe).includes("weather.")) {
                    return true
                }
            }
            return false
        }
    },
    async fetch() {
        try {
            if (this.$route.query?.id) {
                this.activityId = this.$route.query.id
                await this.syncActivity(this.activityId)
            }
        } catch (ex) {
            this.$webError(this, "ActivitySync.fetch", ex)
        }
    },
    methods: {
        async setActivityRoute() {
            this.$router.push({query: {id: this.activityId}})
            await this.syncActivity()
        },
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
        async syncActivity() {
            const id = this.activityIdFromUrl(this.activityId)
            if (!id) {
                this.syncError = "Invalid activity ID or URL."
                return
            }

            try {
                this.loading = true
                this.syncError = null
                this.processedActivity = null
                this.loading = true

                const processedActivity = await this.$axios.$get(`/api/strava/${this.user.id}/process-activity/${id}`)
                this.processedActivity = processedActivity
            } catch (ex) {
                this.processedActivity = null
                this.syncError = ex.response && ex.response.data.message ? ex.response.data.message : ex.toString()
            } finally {
                this.loading = false
            }
        },
        debugActivity(activityId) {
            this.$router.push({path: `/activities/debug?id=${activityId || this.activityId}`})
        }
    }
}
</script>
