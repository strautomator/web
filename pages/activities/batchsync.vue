<template>
    <v-layout column>
        <v-container fluid>
            <h1>Batch activities sync</h1>
            <template v-if="recipes.length == 0">
                <create-first />
            </template>
            <template v-else-if="activityCount === null">
                <div class="mb-4">Want to run your existing automations on older activities? You're just a few clicks away.</div>

                <ul class="ml-0 pl-4 pb-0 mb-4 mt-4">
                    <li>Process activities that ended up to {{ maxDays }} days ago{{ !user.isPro ? ` (PRO users gets up to ${$store.state.proPlanDetails.batchDays} days).` : "." }}</li>
                    <li>Weather tags might not be available for activities older than 1 week (depends on location).</li>
                    <li>Activities are processed in small batches, and can take a few hours to complete.</li>
                    <li>Only 1 batch sync operation can be triggered every 24 hours.</li>
                </ul>

                <v-card class="mt-6" v-if="!recentlyTriggered" outlined>
                    <v-card-text class="mb-4 mb-md-0 pb-0">
                        <p>
                            <strong>Attention! This action is not reversible!</strong>
                            Please double check your automations and make sure that there are no misconfigured conditions that could trigger unwanted actions. Once you trigger the batch sync, there's no way to stop it.
                        </p>
                        <div v-if="!acceptRisks" class="mt-9">
                            <v-checkbox class="mt-n4" v-model="acceptRisks" label="I understand and accept the risks." dense />
                        </div>

                        <div class="mt-6" v-else>
                            <v-row no-gutters>
                                <v-col cols="12" class="pr-0 pr-md-2" :sm="12" :md="4">
                                    <v-select label="Activity privacy" v-model="filterPrivacy" :items="listFilterPrivacy" dense outlined rounded></v-select>
                                </v-col>
                                <v-col cols="12" class="pr-0 pl-0 pr-md-2 pl-md-2" :sm="12" :md="4">
                                    <v-select label="Sport type" v-model="filterSport" :items="listFilterSport" dense outlined rounded></v-select>
                                </v-col>
                                <v-col cols="12" class="pl-0 pl-md-2" :sm="12" :md="4">
                                    <v-select label="Activity type" v-model="filterType" :items="listFilterType" dense outlined rounded></v-select>
                                </v-col>
                            </v-row>

                            <v-row no-gutters>
                                <v-col cols="12" class="pr-0 pr-md-2" :sm="12" :md="4">
                                    <v-menu v-model="dateFromMenu" :close-on-content-click="false" :nudge-right="40" transition="scale-transition" min-width="290px" offset-y>
                                        <template v-slot:activator="{on, attrs}">
                                            <v-text-field v-model="dateFrom" v-bind="attrs" v-on="on" width="200px" label="From date" type="text" prepend-icon="mdi-calendar" outlined readonly rounded dense></v-text-field>
                                        </template>
                                        <v-date-picker v-model="dateFrom" :min="dateFromMin" :max="dateFromMax" @input="dateFromMenu = false"></v-date-picker>
                                    </v-menu>
                                </v-col>
                                <v-col cols="12" class="pr-0 pl-0 pr-md-2 pl-md-2" :sm="12" :md="4">
                                    <v-menu v-model="dateToMenu" :close-on-content-click="false" :nudge-right="40" transition="scale-transition" min-width="290px" offset-y>
                                        <template v-slot:activator="{on, attrs}">
                                            <v-text-field v-model="dateTo" v-bind="attrs" v-on="on" width="200px" label="To date" type="text" prepend-icon="mdi-calendar" outlined readonly rounded dense></v-text-field>
                                        </template>
                                        <v-date-picker v-model="dateTo" :min="dateToMin" :max="dateToMax" @input="dateToMenu = false"></v-date-picker>
                                    </v-menu>
                                </v-col>
                                <v-col cols="12" class="text-center text-md-right" :sm="12" :md="4">
                                    <v-btn color="primary" class="ml-2" title="Start the batch job" @click="processActivities" :disabled="loading" rounded>
                                        <v-icon left>mdi-animation-play</v-icon>
                                        Batch process activities
                                    </v-btn>
                                </v-col>
                            </v-row>
                            <div class="mb-4 text-center text-md-right mt-md-n3" v-if="loading">
                                <v-progress-circular class="mr-1 mt-n1" size="16" width="2" indeterminate></v-progress-circular>
                                Preparing the batch job, please wait...
                            </div>
                        </div>
                    </v-card-text>
                </v-card>
                <div v-else>
                    <v-alert color="error" border="top" colored-border>
                        <div class="mt-1">You have triggered a batch sync {{ $dayjs(user.dateLastBatchProcessing).fromNow() }}. Please wait at least 24 hours before executing a batch sync again.</div>
                    </v-alert>
                    <v-btn class="mt-1" color="primary" title="Go to my automations history" to="/automations/history" small nuxt rounded>
                        <v-icon left>mdi-history</v-icon>
                        Go to automation history
                    </v-btn>
                </div>
            </template>
            <template v-else>
                <v-alert border="top" color="error" v-if="jobError">
                    {{ jobError }}
                </v-alert>
                <v-card v-else outlined>
                    <v-card-title class="accent">{{ batchTitle }}</v-card-title>
                    <v-card-text class="pt-4">
                        <div v-if="activityCount < 1">
                            <p>
                                No valid activities were found between {{ $dayjs(dateFrom).format("ll") }} and {{ $dayjs(dateTo).format("ll") }}.<br v-if="$breakpoint.mdAndUp" />You might want to try extending the date range or removing some activity
                                filters.
                            </p>
                            <v-btn class="mt-1" color="primary" title="Try again" @click="activityCount = null" small nuxt rounded>
                                <v-icon left>mdi-arrow-left</v-icon>
                                Try again
                            </v-btn>
                        </div>
                        <div v-else-if="batchProcessed">Activities between {{ $dayjs(dateFrom).format("ll") }} and {{ $dayjs(dateTo).format("ll") }} are being processed right now, and should be updated in less than a minute.</div>
                        <div v-else>
                            Activities between {{ $dayjs(dateFrom).format("ll") }} and {{ $dayjs(dateTo).format("ll") }} are now queued for processing.<br v-if="$breakpoint.mdAndUp" />Please note that this is an asynchronous job, and can take up to
                            {{ maxHours }} hour(s) to complete.
                        </div>
                        <v-btn v-if="activityCount > 0" class="mt-4" color="primary" title="Go to my automations history" to="/automations/history" small nuxt rounded>
                            <v-icon left>mdi-history</v-icon>
                            Go to automation history
                        </v-btn>
                    </v-card-text>
                </v-card>

                <ads-panel />
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
            title: "Batch activities sync"
        }
    },
    data() {
        const dateFrom = this.$dayjs().subtract(this.$store.state.freePlanDetails.batchDays, "days").format("YYYY-MM-DD")
        const dateTo = this.$dayjs().format("YYYY-MM-DD")

        const listFilterPrivacy = [
            {value: "all", text: "All activities"},
            {value: "private", text: "Private activities"},
            {value: "public", text: "Public activities"}
        ]

        const listFilterType = [
            {value: "all", text: "All types"},
            {value: "commute", text: "Just commutes"},
            {value: "notCommute", text: "Exclude commutes"},
            {value: "race", text: "Just races"},
            {value: "notRace", text: "Exclude races"}
        ]

        const listFilterSport = [{value: "all", text: "All sports"}]
        for (let st of this.$store.state.sportTypes) {
            const sportName = this.getSportName(st)
            listFilterSport.push({value: st, text: sportName})
        }

        return {
            loading: false,
            jobError: null,
            acceptRisks: false,
            activityCount: null,
            batchProcessed: false,
            dateFrom: dateFrom,
            dateFromMenu: false,
            dateTo: dateTo,
            dateToMenu: false,
            filterPrivacy: "all",
            filterSport: "all",
            filterType: "all",
            listFilterPrivacy: listFilterPrivacy,
            listFilterSport: listFilterSport,
            listFilterType: listFilterType
        }
    },
    computed: {
        recipes() {
            return Object.values(this.user.recipes)
        },
        recentlyTriggered() {
            if (!this.user.dateLastBatchProcessing) return false
            return this.$dayjs().subtract(24, "hours").isBefore(this.$dayjs(this.user.dateLastBatchProcessing))
        },
        maxDays() {
            return this.user.isPro ? this.$store.state.proPlanDetails.batchDays : this.$store.state.freePlanDetails.batchDays
        },
        maxHours() {
            return Math.ceil(this.activityCount / 100)
        },
        dateFromMin() {
            return this.$dayjs().subtract(this.maxDays, "days").format("YYYY-MM-DD")
        },
        dateFromMax() {
            const today = this.$dayjs()
            const currentDateTo = this.$dayjs(this.dateTo)
            return today.isAfter(currentDateTo) ? currentDateTo.format("YYYY-MM-DD") : today.format("YYYY-MM-DD")
        },
        dateToMin() {
            return this.$dayjs(this.dateFrom).format("YYYY-MM-DD")
        },
        dateToMax() {
            return this.$dayjs().format("YYYY-MM-DD")
        },
        batchTitle() {
            if (this.activityCount < 1) return "No activities found"
            if (this.batchProcessed) return `Processed ${this.processedCount} activities`
            return `Will process ${this.activityCount} activities`
        }
    },
    methods: {
        getDate(date) {
            return this.$dayjs(date)
        },
        async processActivities() {
            try {
                this.jobError = null
                this.loading = true

                const data = {
                    dateFrom: this.dateFrom,
                    dateTo: this.dateTo,
                    filterPrivacy: this.filterPrivacy,
                    filterSport: this.filterSport,
                    filterType: this.filterType
                }

                const result = await this.$axios.$post(`/api/strava/${this.user.id}/process-activities`, data)

                this.activityCount = result.activityCount || 0
                this.batchProcessed = result.processed
            } catch (ex) {
                this.activityCount = 0
                this.jobError = ex.response && ex.response.data.message ? ex.response.data.message : ex.toString()
            } finally {
                this.loading = false
            }
        }
    }
}
</script>
