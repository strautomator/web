<template>
    <v-layout column>
        <v-container fluid>
            <h1>Calendar</h1>
            <v-alert v-if="user && !user.isPro" border="top" color="primary" colored-border>
                <div class="mt-1 text-center text-md-left">
                    Calendars on free accounts are limited to the last
                    {{ $store.state.freePlanDetails.maxCalendarDays }} days only.
                    <br />
                    <n-link to="/billing" title="Upgrade to PRO!" nuxt>Upgrade to PRO</n-link>
                    to export up to {{ $store.state.proPlanDetails.maxCalendarDays }} days of activities.
                </div>
            </v-alert>
            <v-card class="mt-5" outlined>
                <v-card-text>
                    <p>
                        Strautomator can export your Strava activities using the iCalendar format, allowing you to view your activities as events on the calendar service of your choice.
                    </p>
                    <p class="mt-2">
                        Use the following URL to subscribe directly on your Calendar client:
                    </p>
                    <div class="text-center text-md-left">
                        <v-text-field label="URL" :value="'https://' + urlCalendar" dense outlined rounded></v-text-field>
                        <v-btn color="primary" title="Subscribe to your Strava activities calendar" :href="'webcal://' + urlCalendar" rounded nuxt>
                            <v-icon left>mdi-calendar-check</v-icon>
                            Subscribe to calendar
                        </v-btn>
                        <div class="caption mt-3">
                            * The button above might not work on some Android devices.
                        </div>
                    </div>
                </v-card-text>
            </v-card>
            <v-card class="mt-5" outlined>
                <v-card-title class="accent">
                    Need help?
                </v-card-title>
                <v-card-text>
                    <p class="mt-3">
                        Subscribing to .ics calendars should be fairly simple, but the steps are slightly different depending on which service or client you use.
                    </p>
                    <p>
                        Here are the official support pages for some:
                    </p>
                    <ul class="pl-4">
                        <li>
                            <a class="font-weight-medium" href="https://support.google.com/calendar/answer/37100?hl=en" target="helpGoogle">Google</a>
                            &gt;
                            <span class="caption">Ways to add someone else's calendar &gt; Add using a link</span>
                        </li>
                        <li>
                            <a class="font-weight-medium" href="https://help.yahoo.com/kb/unfollow-calendars-yahoo-mail-sln28066.html" target="helpYahoo">Yahoo Mail</a>
                            &gt;
                            <span class="caption">Follow other calendars</span>
                        </li>
                        <li>
                            <a class="font-weight-medium" href="https://support.microsoft.com/en-us/office/import-or-subscribe-to-a-calendar-in-outlook-on-the-web-503ffaf6-7b86-44fe-8dd6-8099d95f38df" target="helpOutlook">Outlook</a>
                            &gt;
                            <span class="caption">Subscribe to a calendar</span>
                        </li>
                        <li>
                            <a class="font-weight-medium" href="https://support.apple.com/en-gb/guide/calendar/icl1022/mac" target="helpMac">Mac OS</a>
                        </li>
                        <li>
                            <a class="font-weight-medium" href="https://support.apple.com/en-gb/guide/iphone/iph3d1110d4/ios" target="helpiOS">iOS</a>
                        </li>
                    </ul>
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
            title: "Calendar"
        }
    },
    data() {
        return {
            location: null,
            excludeCommutes: false,
            sportTypes: []
        }
    },
    mounted() {
        if (!this.location) {
            this.location = window.location
        }
    },
    computed: {
        urlCalendar() {
            if (!this.location) return ""

            const location = this.location
            const port = location.port == "80" || location.port == "" ? "" : `:${location.port}`
            const userId = this.$store.state.user.id
            const urlToken = this.$store.state.user.urlToken

            return `${location.hostname}${port}/api/calendar/${userId}/${urlToken}/activities.ics`
        }
    }
}
</script>
