<template>
    <v-layout column>
        <v-container fluid>
            <h1>
                Automation history
                <v-btn class="float-right mt-3 text-h6 font-weight-bold" color="primary" to="/dashboard/charts" title="Go to automations chart" x-small fab rounded nuxt>
                    <v-icon small>mdi-poll</v-icon>
                </v-btn>
            </h1>

            <v-card outlined>
                <v-card-text class="pa-0">
                    <v-row class="pt-7 pb-2 pb-md-0">
                        <v-col cols="6" md="3" class="text-center text-md-left pb-0 pt-0 pl-6">
                            <v-menu v-model="dateFromMenu" :close-on-content-click="false" :nudge-right="40" transition="scale-transition" min-width="290px" offset-y>
                                <template v-slot:activator="{on, attrs}">
                                    <v-text-field v-model="dateFrom" v-bind="attrs" v-on="on" label="From date" type="text" :disabled="loading" outlined readonly rounded dense></v-text-field>
                                </template>
                                <v-date-picker v-model="dateFrom" :max="dateTo" @input="dateFromMenu = false"></v-date-picker>
                            </v-menu>
                        </v-col>
                        <v-col cols="6" md="3" class="text-center text-md-left pb-0 pt-0 pr-6">
                            <v-menu v-model="dateToMenu" :close-on-content-click="false" :nudge-right="40" transition="scale-transition" min-width="290px" offset-y>
                                <template v-slot:activator="{on, attrs}">
                                    <v-text-field v-model="dateTo" v-bind="attrs" v-on="on" label="To date" type="text" :disabled="loading" outlined readonly rounded dense></v-text-field>
                                </template>
                                <v-date-picker v-model="dateTo" :min="dateFrom" @input="dateToMenu = false"></v-date-picker>
                            </v-menu>
                        </v-col>
                        <v-col cols="12" md="2" class="text-center text-md-left pb-0 pt-1 mt-n4 mt-md-0">
                            <v-btn color="primary" title="Search history of processed activities" @click="fetchHistory()" :disabled="loading" rounded>
                                <v-icon left>mdi-table-search</v-icon>
                                Search activities
                            </v-btn>
                        </v-col>
                    </v-row>

                    <v-divider class="mt-4 mt-md-n3" />

                    <div class="mt-4 mb-4 pl-4 pr-4" v-if="loading">
                        <v-progress-circular class="mr-1 mt-n1" size="16" width="2" indeterminate></v-progress-circular>
                        Loading history...
                    </div>

                    <div class="mt-4 mb-4 pl-4 pr-4" v-else-if="activities.length == 0">
                        No processed activities found from
                        <br v-if="!$breakpoint.mdAndUp" />
                        {{ dateFrom }} to {{ dateTo }}.
                    </div>

                    <processed-activities :activities="activities" :header="true" v-else></processed-activities>
                </v-card-text>
            </v-card>

            <div class="caption ml-1 mt-3" v-if="user && user.preferences.privacyMode">* Privacy mode is enabled, some details about processed activities are not saved.</div>
        </v-container>
    </v-layout>
</template>

<script>
import _ from "lodash"
import userMixin from "~/mixins/userMixin.js"
import recipeMixin from "~/mixins/recipeMixin.js"
import stravaMixin from "~/mixins/stravaMixin.js"
import ProcessedActivities from "~/components/ProcessedActivities.vue"

export default {
    authenticated: true,
    components: {ProcessedActivities},
    mixins: [userMixin, recipeMixin, stravaMixin],
    head() {
        return {
            title: "Automation history"
        }
    },
    data() {
        const dateTo = this.$dayjs().format("YYYY-MM-DD")

        return {
            loading: true,
            activities: null,
            dateFromMenu: false,
            dateFrom: null,
            dateToMenu: false,
            dateTo: dateTo
        }
    },
    async fetch() {
        if (!this.dateFrom) {
            this.dateFrom = this.$dayjs(this.user.dateLastProcessedActivity).subtract(1, "month").startOf("month").format("YYYY-MM-DD")
        }

        await this.fetchHistory()
    },
    methods: {
        async fetchHistory() {
            try {
                this.loading = true
                this.activities = await this.$axios.$get(`/api/strava/${this.user.id}/activities/processed?from=${this.dateFrom}&to=${this.dateTo}`)
            } catch (ex) {
                this.$webError(this, "History.fetchHistory", ex)
            }

            this.loading = false
        }
    }
}
</script>
