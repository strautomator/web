<template>
    <v-layout column>
        <v-container fluid>
            <h1>Download my data</h1>
            <v-card class="mt-3" outlined>
                <v-card-text class="pa-0">
                    <div class="pa-4">
                        Here you can download a ZIP file with all the data that Strautomator holds about you.
                        <div v-if="user && user.dateLastArchiveGenerated">
                            You can generate a new archive every {{ this.$store.state.archiveDownloadDays }} days. The existing archive was generated on {{ $dayjs(user.dateLastArchiveGenerated).format("ll") }}.
                        </div>
                    </div>
                    <h3 class="pl-4 pb-2">What's included?</h3>
                    <v-simple-table>
                        <thead class="accent">
                            <tr>
                                <th v-if="$breakpoint.mdAndUp">File</th>
                                <th>Data</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td class="nowrap" width="1" v-if="$breakpoint.mdAndUp">activities.json</td>
                                <td class="pt-2 pb-2">
                                    <ul class="pl-4">
                                        <li>Processed activities</li>
                                        <li>Activities queued for processing</li>
                                    </ul>
                                </td>
                            </tr>
                            <tr>
                                <td class="nowrap" width="1" v-if="$breakpoint.mdAndUp">athlete-records.json</td>
                                <td class="pt-2 pb-2">
                                    <ul class="pl-4">
                                        <li>Personal activity records</li>
                                    </ul>
                                </td>
                            </tr>
                            <tr>
                                <td class="nowrap" width="1" v-if="$breakpoint.mdAndUp">garmin.json</td>
                                <td class="pt-2 pb-2">
                                    <ul class="pl-4">
                                        <li>Processed FIT summaries from Garmin</li>
                                    </ul>
                                </td>
                            </tr>
                            <tr>
                                <td class="nowrap" width="1" v-if="$breakpoint.mdAndUp">gearwear.json</td>
                                <td class="pt-2 pb-2">
                                    <ul class="pl-4">
                                        <li>Gear configurations</li>
                                    </ul>
                                </td>
                            </tr>
                            <tr>
                                <td class="nowrap" width="1" v-if="$breakpoint.mdAndUp">notifications.json</td>
                                <td class="pt-2 pb-2">
                                    <ul class="pl-4">
                                        <li>Notifications</li>
                                        <li>Announcements</li>
                                    </ul>
                                </td>
                            </tr>
                            <tr>
                                <td class="nowrap" width="1" v-if="$breakpoint.mdAndUp">recipe-stats.json</td>
                                <td class="pt-2 pb-2">
                                    <ul class="pl-4">
                                        <li>Automation statistics</li>
                                    </ul>
                                </td>
                            </tr>
                            <tr>
                                <td class="nowrap" width="1" v-if="$breakpoint.mdAndUp">subscriptions.json</td>
                                <td class="pt-2 pb-2">
                                    <ul class="pl-4">
                                        <li>PRO subscription details</li>
                                    </ul>
                                </td>
                            </tr>
                            <tr>
                                <td class="nowrap" width="1" v-if="$breakpoint.mdAndUp">users.json</td>
                                <td class="pt-2 pb-2">
                                    <ul class="pl-4">
                                        <li>Strava profile</li>
                                        <li>Account details</li>
                                        <li>Automation configurations</li>
                                    </ul>
                                </td>
                            </tr>
                            <tr>
                                <td class="nowrap" width="1" v-if="$breakpoint.mdAndUp">wahoo.json</td>
                                <td class="pt-2 pb-2">
                                    <ul class="pl-4">
                                        <li>Processed FIT summaries from Wahoo</li>
                                    </ul>
                                </td>
                            </tr>
                            <tr>
                                <td class="nowrap" width="1" v-if="$breakpoint.mdAndUp">*.ics</td>
                                <td class="pt-2 pb-2">
                                    <ul class="pl-4">
                                        <li>Cached exported calendars</li>
                                    </ul>
                                </td>
                            </tr>
                        </tbody>
                    </v-simple-table>
                    <v-divider></v-divider>

                    <div class="pa-4">
                        Some of the files above might be missing, depending on which features you're using on the website. The download does <span class="font-weight-bold">not</span> include your account tokens, credentials, short-lived cache and
                        access logs.
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
