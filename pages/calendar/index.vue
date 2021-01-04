<template>
    <v-layout column>
        <v-container fluid>
            <h1>Calendar</h1>
            <v-alert v-if="user && !user.isPro" border="top" color="primary" colored-border>
                <div class="mt-1 text-center text-md-left">
                    Calendars on free accounts are limited to the last
                    {{ $store.state.freePlanDetails.maxCalendarDays }} days only.
                    <br v-if="$breakpoint.mdAndUp" />
                    <n-link to="/billing" title="Upgrade to PRO!" nuxt>Upgrade to PRO</n-link>
                    to export up to {{ $store.state.proPlanDetails.maxCalendarDays }} days of activities and enable a custom events template on your Calendar.
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
                        <v-text-field label="URL" :value="'https://' + urlCalendar" hide-details readonly dense outlined rounded></v-text-field>
                        <v-btn class="mt-4" color="primary" title="Subscribe to your Strava activities calendar" :href="'webcal://' + urlCalendar" rounded nuxt>
                            <v-icon left>mdi-calendar-check</v-icon>
                            Subscribe to calendar
                        </v-btn>
                        <div class="caption mt-3">
                            * The button above might not work on some Android devices.
                        </div>
                    </div>
                </v-card-text>
            </v-card>
            <v-card v-if="user && user.isPro" class="mt-5" outlined>
                <v-card-title class="accent">
                    Events template
                </v-card-title>
                <v-card-text>
                    <p class="mt-4">
                        As a PRO user, you can customize the summary and details of events on exported calendars. Simply edit the fields below adding your desired tags, or leave blank to use the defaults.
                    </p>
                    <div>
                        <v-text-field label="Event summary" v-model="calendarTemplate.eventSummary" :placeholder="sampleTemplate.eventSummary" hide-details dense outlined rounded></v-text-field>
                    </div>
                    <div>
                        <v-textarea class="mt-3" label="Event details" v-model="calendarTemplate.eventDetails" :placeholder="sampleTemplate.eventDetails" height="160" maxlength="255" hide-details dense outlined rounded no-resize></v-textarea>
                    </div>
                    <div class="text-center text-md-left">
                        <v-btn class="mt-4" color="primary" title="Save your custom calendar template" :outlined="!changedTemplate" :disabled="!changedTemplate" @click="saveTemplate" rounded nuxt>
                            <v-icon left>mdi-content-save</v-icon>
                            Save template
                        </v-btn>
                    </div>
                    <v-alert v-model="templateWarning" color="secondary" class="mt-4" icon="mdi-alert" rounded outlined dense>The new template will be applied once your calendar gets refreshed with new activities from Strava.</v-alert>
                    <v-card class="mt-5 mb-0" outlined>
                        <v-card-text>
                            <div class="caption mb-2 text-center text-md-left">Available tags, format: ${tagName}</div>
                            <v-chip class="mr-1 mb-2" small>icon</v-chip>
                            <v-chip class="mr-1 mb-2" small>gear</v-chip>
                            <v-chip class="mr-1 mb-2" small>distance</v-chip>
                            <v-chip class="mr-1 mb-2" small>elevationGain</v-chip>
                            <v-chip class="mr-1 mb-2" small>elevationMax</v-chip>
                            <v-chip class="mr-1 mb-2" small>speedAvg</v-chip>
                            <v-chip class="mr-1 mb-2" small>speedMax</v-chip>
                            <v-chip class="mr-1 mb-2" small>cadenceAvg</v-chip>
                            <v-chip class="mr-1 mb-2" small>wattsAvg</v-chip>
                            <v-chip class="mr-1 mb-2" small>wattsWeighted</v-chip>
                            <v-chip class="mr-1 mb-2" small>wattsMax</v-chip>
                            <v-chip class="mr-1 mb-2" small>hrAvg</v-chip>
                            <v-chip class="mr-1 mb-2" small>hrMax</v-chip>
                            <v-chip class="mr-1 mb-2" small>calories</v-chip>
                            <v-chip class="mr-1 mb-2" small>temperature</v-chip>
                            <v-chip class="mr-1 mb-2" small>device</v-chip>
                            <v-chip class="mr-1 mb-2" small>commute</v-chip>
                        </v-card-text>
                    </v-card>
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
        const calendarTemplate = this.$store.state.user.calendarTemplate || {}

        return {
            location: null,
            excludeCommutes: false,
            templateWarning: false,
            sportTypes: [],
            currentEventSummary: calendarTemplate.eventSummary || "",
            currentEventDetails: calendarTemplate.eventDetails || "",
            calendarTemplate: {
                eventSummary: calendarTemplate.eventSummary || "",
                eventDetails: calendarTemplate.eventDetails || ""
            },
            sampleTemplate: {
                eventSummary: "${name} ${icon}",
                eventDetails: "${distance} km - ${elevationGain} m\n${speedAvg} km/h\n${calories} kcal\n${hrAvg} bpm - ${wattsAvg} watts\n{description}"
            }
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
        },
        changedTemplate() {
            return this.currentEventSummary != this.calendarTemplate.eventSummary || this.currentEventDetails != this.calendarTemplate.eventDetails
        }
    },
    methods: {
        async saveTemplate() {
            try {
                const user = this.$store.state.user
                const url = `/api/calendar/${user.id}/template`

                const data = {eventSummary: this.calendarTemplate.eventSummary.trim(), eventDetails: this.calendarTemplate.eventDetails.trim()}
                await this.$axios.$post(url, data)
                this.$store.commit("setUserCalendarTemplate", data)

                this.currentEventSummary = data.eventSummary
                this.currentEventDetails = data.eventDetails
                this.templateWarning = true
            } catch (ex) {
                this.$webError("Calendar.saveTemplate", ex)
            }
        }
    }
}
</script>
