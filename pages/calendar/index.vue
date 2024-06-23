<template>
    <v-layout column>
        <v-container fluid>
            <h1>Calendar Export</h1>
            <v-card class="mt-5" v-if="user" outlined>
                <v-card-text>
                    <p>
                        Strautomator can export your Strava activities, club events and gear component history using the iCal format.<br />
                        Please set your desired options, and then use the generated URL to subscribe.
                    </p>

                    <div>
                        <h3>What to export</h3>
                        <v-radio-group class="mt-1" v-model="calendarType" :row="$breakpoint.mdAndUp">
                            <v-radio label="Everything" value="all"></v-radio>
                            <v-radio label="Only activities" value="activities"></v-radio>
                            <v-radio label="Only club events" value="clubs"></v-radio>
                            <v-radio label="Only gear history" value="gear"></v-radio>
                        </v-radio-group>
                    </div>
                    <div>
                        <h3>Sport types</h3>
                        <v-radio-group class="mt-1" v-model="calendarSports" :row="$breakpoint.mdAndUp">
                            <v-radio label="All sports" value="all"></v-radio>
                            <v-radio label="Rides" value="Ride,MountainBikeRide,EBikeRide,EMountainBikeRide,VirtualRide"></v-radio>
                            <v-radio label="Runs" value="Walk,Run,TrailRun,VirtualRun"></v-radio>
                        </v-radio-group>
                    </div>
                    <div>
                        <h3 class="mb-4">Other options</h3>
                        <v-checkbox class="mt-n4" v-model="excludeCommutes" label="Exclude commutes" v-if="!['clubs', 'gear'].includes(calendarType)" dense />
                        <v-checkbox class="mt-n4" v-model="excludeNotJoined" label="Only events I have joined" v-if="!['activities', 'gear'].includes(calendarType)" dense />
                        <v-checkbox class="mt-n4" v-model="includeAllCountries" label="Include events outside my country" v-if="!['activities', 'gear'].includes(calendarType)" dense />
                        <v-checkbox class="mt-n4" v-model="linkInDescription" label="Add event links on descriptions" dense />
                        <v-checkbox class="mt-n4" v-model="compact" label="Compact descriptions" dense />
                    </div>
                    <div v-if="['all', 'activities'].includes(calendarType)">
                        <h3>Date range</h3>
                        <v-row class="mt-2" no-gutters>
                            <v-col cols="5" md="2">
                                <v-text-field v-model="daysFrom" label="Past" class="ml-n1" type="number" suffix="days" min="1" :max="maxDaysFrom" hide-details outlined rounded dense></v-text-field>
                            </v-col>
                            <v-col cols="5" class="ml-1 mt-3 text-caption error--text" v-if="daysFrom > maxDaysFrom">max {{ maxDaysFrom }}</v-col>
                        </v-row>
                        <v-row class="mt-3" no-gutters>
                            <v-col cols="5" md="2">
                                <v-text-field v-model="daysTo" label="Future" class="ml-n1" type="number" suffix="days" min="1" :max="maxDaysTo" hide-details outlined rounded dense></v-text-field>
                            </v-col>
                            <v-col cols="5" class="ml-1 mt-3 text-caption error--text" v-if="daysTo > maxDaysTo">max {{ maxDaysTo }}</v-col>
                        </v-row>
                    </div>

                    <div class="text-center text-md-left mt-5">
                        <v-btn color="primary" title="Subscribe to your Strava activities calendar" :href="'webcal://' + urlCalendar" rounded nuxt>
                            <v-icon left>mdi-calendar-check</v-icon>
                            Subscribe to calendar
                        </v-btn>
                        <br v-if="!$breakpoint.mdAndUp" />
                        <v-btn color="primary" class="ml-md-2 mt-3 mt-md-0" title="Want to generate a new calendar URL?" @click.stop="showResetDialog" :disabled="newUrlToken" outlined rounded nuxt>
                            <v-icon left>mdi-reload-alert</v-icon>
                            Reset URL token
                        </v-btn>
                        <div class="mt-3">
                            <v-text-field @focus="$event.target.select()" :value="'https://' + urlCalendar" hide-details readonly dense outlined rounded></v-text-field>
                        </div>
                        <v-alert v-if="newUrlToken" class="mt-2" color="success" icon="mdi-arrow-up-bold" rounded dense>
                            <div class="text-center text-md-left">New token generated, calendar URL updated!</div>
                        </v-alert>
                    </div>
                </v-card-text>
            </v-card>
            <v-alert v-if="user && !user.isPro" border="top" color="primary" class="mt-4" colored-border>
                <div class="mt-1 text-center text-md-left">
                    Free accounts are limited to activities from the past
                    {{ $store.state.freePlanDetails.pastCalendarDays }} and club events for the next {{ $store.state.freePlanDetails.futureCalendarDays }}
                    days, using the default template.
                    <br v-if="!$breakpoint.mdAndUp" />
                    <n-link to="/billing" title="Upgrade to PRO!" nuxt>Upgrade to PRO</n-link>
                    to export activities from the past {{ $store.state.proPlanDetails.pastCalendarDays }} and club events for the next {{ $store.state.proPlanDetails.futureCalendarDays }} days, using a custom template.
                </div>
            </v-alert>
            <v-card v-if="user && user.isPro" class="mt-5" outlined>
                <v-card-title class="accent">Activity template</v-card-title>
                <v-card-text>
                    <p class="mt-4">As a PRO user, you can customize the details of your activities on exported calendars.</p>
                    <div>
                        <v-text-field ref="eventSummaryInput" label="Event summary" v-model="calendarTemplate.eventSummary" @focus="setActiveField('eventSummary')" hide-details dense outlined rounded></v-text-field>
                    </div>
                    <div>
                        <Mentionable :keys="['$']" :items="activityTags" offset="1">
                            <v-textarea
                                ref="eventDetailsInput"
                                class="mt-3"
                                label="Event details"
                                v-model="calendarTemplate.eventDetails"
                                height="160"
                                maxlength="255"
                                @focus="setActiveField('eventDetails')"
                                hide-details
                                dense
                                outlined
                                rounded
                                no-resize
                            ></v-textarea>
                        </Mentionable>
                    </div>
                    <div class="mt-2 text-center text-md-left">
                        <v-btn color="primary" title="Save your custom calendar template" :outlined="!changedTemplate" :disabled="!changedTemplate" @click="saveTemplate" rounded nuxt>
                            <v-icon left>mdi-content-save</v-icon>
                            Save
                        </v-btn>
                        <v-btn class="ml-2" color="accent" title="Save your custom calendar template" @click="setSampleTemplate" rounded nuxt>
                            <v-icon left>mdi-text-box-outline</v-icon>
                            Sample
                        </v-btn>
                    </div>
                    <v-alert v-model="templateWarning" color="secondary" class="mt-4" icon="mdi-alert" rounded outlined dense>The new template will be applied once your calendar gets refreshed with new activities from Strava.</v-alert>
                </v-card-text>
            </v-card>
            <v-card class="mt-5" outlined>
                <v-card-title class="accent"> Need help? </v-card-title>
                <v-card-text>
                    <p class="mt-3">
                        Subscribing to .ics calendars should be fairly simple, but the steps are slightly different depending on which service or client you use. For help, please check
                        <a class="font-weight-medium" href="https://www.webcal.guru/en-GB/help?question_id=subscribe" target="helpOthers">WebCal.Guru</a> or...
                    </p>
                    <ul class="pl-4">
                        <li>
                            <a class="font-weight-medium" href="https://support.google.com/calendar/answer/37100?hl=en" target="helpGoogle">Google</a>
                        </li>
                        <li>
                            <a class="font-weight-medium" href="https://help.yahoo.com/kb/unfollow-calendars-yahoo-mail-sln28066.html" target="helpYahoo">Yahoo Mail</a>
                        </li>
                        <li>
                            <a class="font-weight-medium" href="https://support.microsoft.com/en-us/office/import-or-subscribe-to-a-calendar-in-outlook-on-the-web-503ffaf6-7b86-44fe-8dd6-8099d95f38df" target="helpOutlook">Outlook</a>
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

            <v-dialog v-model="resetDialog" width="440" overlay-opacity="0.95">
                <v-card>
                    <v-toolbar color="primary">
                        <v-toolbar-title>Reset URL token</v-toolbar-title>
                        <v-spacer></v-spacer>
                        <v-toolbar-items>
                            <v-btn icon @click.stop="hideResetDialog">
                                <v-icon>mdi-close</v-icon>
                            </v-btn>
                        </v-toolbar-items>
                    </v-toolbar>
                    <v-card-text>
                        <p class="mt-2">Are you sure you want to reset your URL token? Your calendar will get a new URL, and previously imported calendars will be invalidated.</p>
                        <div class="text-right">
                            <v-spacer></v-spacer>
                            <v-btn class="mr-2" color="grey" title="Cancel and do not reset" @click.stop="hideResetDialog" text rounded>
                                <v-icon left>mdi-cancel</v-icon>
                                Cancel
                            </v-btn>
                            <v-btn color="primary" title="Confirm and reset the URL" @click="resetUrl" rounded>
                                <v-icon left>mdi-check</v-icon>
                                Reset
                            </v-btn>
                        </div>
                    </v-card-text>
                </v-card>
            </v-dialog>
        </v-container>
    </v-layout>
</template>

<script>
import {Mentionable} from "vue-mention"
import _ from "lodash"
import recipeMixin from "~/mixins/recipeMixin.js"
import userMixin from "~/mixins/userMixin.js"

export default {
    components: {Mentionable},
    authenticated: true,
    mixins: [recipeMixin, userMixin],
    head() {
        return {
            title: "Calendar"
        }
    },
    data() {
        const user = this.$store.state.user
        const calendarTemplate = user.preferences?.calendarTemplate || {}
        const freePlan = this.$store.state.freePlanDetails
        const proPlan = this.$store.state.proPlanDetails
        const defaultDaysFrom = user.isPro ? Math.round(proPlan.pastCalendarDays / 365 / 2) * 365 : freePlan.pastCalendarDays
        const defaultDaysTo = user.isPro ? Math.round(proPlan.futureCalendarDays / 180 / 2) * 180 : freePlan.futureCalendarDays

        return {
            calendarType: "all",
            calendarSports: "all",
            location: null,
            excludeCommutes: false,
            excludeNotJoined: false,
            includeAllCountries: false,
            linkInDescription: false,
            compact: false,
            templateWarning: false,
            activeField: "eventDetails",
            daysFrom: defaultDaysFrom,
            daysTo: defaultDaysTo,
            maxDaysFrom: user.isPro ? proPlan.pastCalendarDays : freePlan.pastCalendarDays,
            maxDaysTo: user.isPro ? proPlan.futureCalendarDays : freePlan.futureCalendarDays,
            currentEventSummary: calendarTemplate.eventSummary || "",
            currentEventDetails: calendarTemplate.eventDetails || "",
            calendarTemplate: {
                eventSummary: calendarTemplate.eventSummary || "",
                eventDetails: calendarTemplate.eventDetails || ""
            },
            sampleTemplate: {
                eventSummary: "${name} ${icon}",
                eventDetails: "${distance} - ${elevationGain}\n${speedAvg}\n${hrAvg} - ${wattsAvg}\nGear: ${gear}\n${description}"
            },
            resetDialog: false,
            newUrlToken: false
        }
    },

    computed: {
        activityTags() {
            return this.mainActivityTags || []
        },
        urlCalendar() {
            if (!this.location) return ""

            const location = this.location
            const port = location.port == "80" || location.port == "" ? "" : `:${location.port}`
            const urlToken = this.$store.state.user.urlToken
            const params = []

            if (this.calendarSports != "all") params.push(`sports=${this.calendarSports}`)
            if (this.calendarType != "gear") {
                if (this.excludeCommutes && this.calendarType != "clubs") params.push("commutes=0")
                if (this.excludeNotJoined && this.calendarType != "activities") params.push("joined=1")
                if (this.includeAllCountries && this.calendarType != "activities") params.push("countries=1")
            }
            if (this.linkInDescription) params.push("link=1")
            if (this.compact) params.push("compact=1")
            if (this.daysFrom != this.maxDaysFrom) params.push(`daysfrom=${this.daysFrom}`)
            if (this.daysTo != this.maxDaysTo) params.push(`daysto=${this.daysTo}`)

            const querystring = params.length > 0 ? `?${params.join("&")}` : ""

            return `${location.hostname}${port}/api/calendar/${this.user.id}/${urlToken}/${this.calendarType}.ics${querystring}`
        },
        changedTemplate() {
            return this.currentEventSummary != this.calendarTemplate.eventSummary || this.currentEventDetails != this.calendarTemplate.eventDetails
        }
    },
    mounted() {
        if (!this.location) {
            this.location = window.location
        }
    },
    methods: {
        async saveTemplate() {
            try {
                const url = `/api/calendar/${this.user.id}/template`
                const data = {eventSummary: this.calendarTemplate.eventSummary.trim(), eventDetails: this.calendarTemplate.eventDetails.trim()}

                await this.$axios.$post(url, data)

                this.$store.commit("setUserCalendarTemplate", data)
                this.currentEventSummary = data.eventSummary
                this.currentEventDetails = data.eventDetails
                this.templateWarning = true
            } catch (ex) {
                this.$webError(this, "Calendar.saveTemplate", ex)
            }
        },
        setSampleTemplate() {
            this.calendarTemplate.eventSummary = this.sampleTemplate.eventSummary
            this.calendarTemplate.eventDetails = this.sampleTemplate.eventDetails
        },
        setActiveField(field) {
            this.activeField = field
        },
        showResetDialog() {
            this.resetDialog = true
        },
        hideResetDialog() {
            this.resetDialog = false
        },
        async resetUrl() {
            try {
                const body = {urlToken: this.$store.state.user.urlToken}
                const response = await this.$axios.$post(`/api/users/${this.user.id}/url-token`, body)

                if (!response || !response.urlToken) {
                    throw new Error("Failed to generate a new URL token")
                }

                this.resetDialog = false
                this.$store.commit("setUserUrlToken", response.urlToken)
                this.newUrlToken = response.urlToken
            } catch (ex) {
                this.$webError(this, "Calendar.resetUrl", ex)
            }
        }
    }
}
</script>
