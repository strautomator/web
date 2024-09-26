<template>
    <v-layout column>
        <v-container fluid>
            <h1>Download my data</h1>
            <v-card class="mt-3" outlined>
                <v-card-text class="pa-0">
                    <div class="pa-4">
                        Here you can download a ZIP file with all the data that Strautomator holds about you.
                        <div v-if="user && user.dateLastArchiveGenerated">You can generate a new archive every {{ this.$store.state.archiveDownloadDays }} days. One was last generated on {{ $dayjs(user.dateLastArchiveGenerated).format("ll") }}.</div>
                    </div>
                    <h3 class="pl-4 pb-2">What's included?</h3>
                    <ul class="pl-8">
                        <li class="font-weight-bold gdpr-list-header" v-if="!$breakpoint.mdAndUp">Activities</li>
                        <li>Processed activities</li>
                        <li>Activities queued for processing</li>
                        <li class="font-weight-bold gdpr-list-header" v-if="!$breakpoint.mdAndUp">FitActivities</li>
                        <li>Processed FIT summaries from Garmin</li>
                        <li>Processed FIT summaries from Wahoo</li>
                        <li class="font-weight-bold gdpr-list-header" v-if="!$breakpoint.mdAndUp">Automations</li>
                        <li>Automation statistics</li>
                        <li>Shared automations</li>
                        <li class="font-weight-bold gdpr-list-header" v-if="!$breakpoint.mdAndUp">AthleteRecords</li>
                        <li>Personal activity records</li>
                        <li class="font-weight-bold gdpr-list-header" v-if="!$breakpoint.mdAndUp">Calendars</li>
                        <li>Calendar configurations</li>
                        <li class="font-weight-bold gdpr-list-header" v-if="!$breakpoint.mdAndUp">GearWear</li>
                        <li>GearWear configurations</li>
                        <li>Battery tracker</li>
                        <li class="font-weight-bold gdpr-list-header" v-if="!$breakpoint.mdAndUp">Notifications</li>
                        <li>Read and unread notifications</li>
                        <li>Read announcements</li>
                        <li class="font-weight-bold gdpr-list-header" v-if="!$breakpoint.mdAndUp">Subscription</li>
                        <li>PRO subscription details</li>
                        <li class="font-weight-bold gdpr-list-header" v-if="!$breakpoint.mdAndUp">User</li>
                        <li>Account details and preferences</li>
                        <li>Strava profile</li>
                        <li>Automation configurations</li>
                        <li class="font-weight-bold gdpr-list-header" v-if="!$breakpoint.mdAndUp">*.ics</li>
                        <li>Cached exported calendars</li>
                    </ul>

                    <v-divider class="mt-6"></v-divider>

                    <div class="pa-4">
                        Some of the data indicated above might be missing, depending on which features you're using. The download does <span class="font-weight-bold">not</span> include your account tokens, credentials, short-lived cache and access
                        logs.
                    </div>

                    <div class="pa-3 text-center text-md-left">
                        <v-btn class="ma-1" color="primary" title="Download my data" @click="downloadArchive" rounded>
                            <v-icon left>mdi-archive-arrow-down</v-icon>
                            {{ isNewArchive ? "Download new archive" : "Download existing archive" }}
                        </v-btn>
                    </div>
                </v-card-text>
            </v-card>
        </v-container>
    </v-layout>
</template>

<script>
import _ from "lodash"
import userMixin from "~/mixins/userMixin.js"

export default {
    authenticated: true,
    mixins: [userMixin],
    head() {
        return {
            title: "Download my data"
        }
    },
    computed: {
        isNewArchive() {
            if (!this.user.dateLastArchiveGenerated) return true
            return this.$dayjs().diff(this.user.dateLastArchiveGenerated, "days") >= this.$store.state.archiveDownloadDays
        }
    },
    methods: {
        async downloadArchive() {
            try {
                const result = await this.$axios.$get(`/api/users/${this.user.id}/archive-download`)

                if (!result || !result.url) {
                    throw new Error("Failed to generated a download URL")
                }

                window.open(result.url, "strautomator-download")
            } catch (ex) {
                this.$webError(this, "Account.downloadArchive", ex)
            }
        }
    }
}
</script>
