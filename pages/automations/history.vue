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
                            <v-btn color="primary" title="Fetch history" @click="fetchHistory()" :disabled="loading" rounded>
                                <v-icon left>mdi-table-search</v-icon>
                                Search
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

                    <v-simple-table v-else>
                        <thead class="accent" v-if="$breakpoint.mdAndUp">
                            <tr>
                                <th></th>
                                <th>Original activity</th>
                                <th>Automation(s)</th>
                                <th>Updated fields</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="activity in activities" :key="activity.id">
                                <td class="text-center" v-if="$breakpoint.mdAndUp">
                                    <v-icon>{{ getSportIcon(activity.type) }}</v-icon>
                                </td>
                                <td class="pt-2 pb-2" nowrap>
                                    <template v-if="!$breakpoint.mdAndUp">
                                        <v-icon class="mt-n1 mr-1" small>{{ getSportIcon(activity.type) }}</v-icon>
                                        <span class="float-right ml-2">{{ getDate(activity).format("ll hA") }}</span>
                                        <a class="font-weight-bold" :href="`https://www.strava.com/activities/${activity.id}`" :title="`Open activity ${activity.id} on Strava`" target="strava">{{ activity.name || "Activity *" }}</a>
                                        <ul class="mt-1 ml-n2">
                                            <li v-for="(recipe, id) in activity.recipes" :key="`${activity.id}-rs-${id}`">
                                                <span :class="{'text-decoration-line-through grey--text': !user.recipes[id]}">{{ recipe.title }}</span>
                                            </li>
                                        </ul>
                                        <div class="mt-1 ml-n2">
                                            <v-icon class="mr-2 mb-1" v-if="isActivityRecord(activity)" small>mdi-medal</v-icon>
                                            <v-chip class="mr-1 mb-1" v-for="(value, propName) in activity.updatedFields" :title="value" :key="`${activity.id}-fs-${propName}`" small outlined>{{ propName }}</v-chip>
                                            <v-chip class="mr-1 mb-1" title="Link to strautomator.com" small outlined>linkback</v-chip>
                                        </div>
                                    </template>
                                    <template v-else>
                                        <a class="font-weight-bold" :href="`https://www.strava.com/activities/${activity.id}`" :title="`Open activity ${activity.id} on Strava`" target="strava">{{ activity.name || "Activity *" }}</a>
                                        <br />
                                        {{ getDate(activity).format("ll") }}
                                        <br />
                                        {{ getDate(activity).format("HH:mm") }}
                                    </template>
                                </td>
                                <td class="pt-2 pb-2" v-if="$breakpoint.mdAndUp" nowrap>
                                    <ul class="pl-0">
                                        <li v-for="(recipe, id) in activity.recipes" :key="`${activity.id}-rm-${id}`">
                                            <span :class="{'text-decoration-line-through grey--text': !user.recipes[id]}">{{ recipe.title }}</span>
                                        </li>
                                    </ul>
                                </td>
                                <td v-if="$breakpoint.mdAndUp" class="pt-2 pb-2">
                                    <v-icon class="mr-2 mb-1" v-if="isActivityRecord(activity)">mdi-medal</v-icon>
                                    <v-chip class="mr-1 mb-1" v-for="(value, propName) in activity.updatedFields" :title="value" :key="`${activity.id}-fm-${propName}`" small>{{ propName }}</v-chip>
                                    <v-chip class="mr-1 mb-1" title="Link to strautomator.com" small outlined>linkback</v-chip>
                                </td>
                            </tr>
                            <tr>
                                <td class="font-weight-bold pt-2 pb-2" colspan="4">Total: {{ activities.length }} activities</td>
                            </tr>
                        </tbody>
                    </v-simple-table>
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

export default {
    authenticated: true,
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
            this.dateFrom = this.$dayjs(this.user.dateLastProcessedActivity).subtract(30, "days").format("YYYY-MM-DD")
        }

        await this.fetchHistory()
    },
    methods: {
        getDate(activity) {
            const aDate = this.$dayjs(activity.dateStart || activity.dateProcessed)

            // Always display local activity times!
            if (activity.utcStartOffset) {
                aDate.utcOffset(activity.utcStartOffset)
            }

            return aDate
        },
        async fetchHistory() {
            try {
                this.loading = true
                this.activities = await this.$axios.$get(`/api/strava/activities/processed?from=${this.dateFrom}&to=${this.dateTo}`)
            } catch (ex) {
                this.$webError("History.fetchHistory", ex)
            }

            this.loading = false
        }
    }
}
</script>
