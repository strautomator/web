<template>
    <v-layout column>
        <v-container fluid>
            <h1>Calendar</h1>
            <v-alert v-if="user && !user.isPro" border="top" color="primary" colored-border>
                <div class="mt-1 text-center text-md-left">
                    Calendars on free accounts are limited to the last
                    {{ $store.state.freePlanDetails.pastCalendarDays }} days only.
                    <br v-if="$breakpoint.mdAndUp" />
                    <n-link to="/billing" title="Upgrade to PRO!" nuxt>Upgrade to PRO</n-link>
                    to export up to {{ $store.state.proPlanDetails.pastCalendarDays }} days of activities and enable a custom events template on your Calendar.
                </div>
            </v-alert>
            <v-card class="mt-5" outlined>
                <v-card-text>
                    <p>
                        Strautomator can export your Strava activities and club events using the iCal format.
                    </p>
                    <div>
                        <h3>What to export</h3>
                        <v-radio-group class="mt-1" v-model="calendarType" :row="$breakpoint.mdAndUp">
                            <v-radio label="Activities and club events" value="all"></v-radio>
                            <v-radio label="Only activities" value="activities"></v-radio>
                            <v-radio label="Only club events" value="clubs"></v-radio>
                        </v-radio-group>
                    </div>
                    <div>
                        <h3>Sport types</h3>
                        <v-radio-group class="mt-1" v-model="calendarSports" :row="$breakpoint.mdAndUp">
                            <v-radio label="All sports" value="all"></v-radio>
                            <v-radio label="Rides" value="Ride,EBikeRide,VirtualRide"></v-radio>
                            <v-radio label="Runs" value="Run,Walk"></v-radio>
                        </v-radio-group>
                    </div>
                    <div>
                        <h3>Other options</h3>
                        <v-checkbox class="mt-1" v-model="excludeCommutes" label="Exclude commutes" :disabled="calendarType == 'clubs'" />
                        <v-checkbox class="mt-n4" v-model="excludeNotJoined" label="Only events I have joined" :disabled="calendarType == 'activities'" />
                    </div>
                    <div class="text-center text-md-left mt-2">
                        <v-btn color="primary" title="Subscribe to your Strava activities calendar" :href="'webcal://' + urlCalendar" rounded nuxt>
                            <v-icon left>mdi-calendar-check</v-icon>
                            Subscribe to calendar
                        </v-btn>
                    </div>
                    <div class="text-center text-md-left caption mt-4">
                        If the button above does not work, please subscribe manually using the link below:
                    </div>
                    <div class="mt-4">
                        <v-text-field label="URL" :value="'https://' + urlCalendar" hide-details readonly dense outlined rounded></v-text-field>
                    </div>
                </v-card-text>
            </v-card>
            <v-card v-if="user && user.isPro" class="mt-5" outlined>
                <v-card-title class="accent">
                    Events template
                </v-card-title>
                <v-card-text>
                    <p class="mt-4">
                        As a PRO user, you can customize the details of your activities (not club events) on exported calendars. Simply edit the fields below or leave them blank to use the defaults.
                    </p>
                    <div>
                        <v-text-field ref="eventSummaryInput" label="Event summary" v-model="calendarTemplate.eventSummary" @focus="setActiveField('eventSummary')" hide-details dense outlined rounded></v-text-field>
                    </div>
                    <div>
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
                    </div>
                    <div class="mt-2">
                        <div class="caption mb-2 text-center text-md-left">Available tags, format: ${tagName}</div>
                        <v-chip class="mr-1 mb-2" @click="addTag('icon')" small>icon</v-chip>
                        <v-chip class="mr-1 mb-2" @click="addTag('gear')" small>gear</v-chip>
                        <v-chip class="mr-1 mb-2" @click="addTag('distance')" small>distance</v-chip>
                        <v-chip class="mr-1 mb-2" @click="addTag('elevationGain')" small>elevationGain</v-chip>
                        <v-chip class="mr-1 mb-2" @click="addTag('elevationMax')" small>elevationMax</v-chip>
                        <v-chip class="mr-1 mb-2" @click="addTag('climbingRatio')" small>climbingRatio</v-chip>
                        <v-chip class="mr-1 mb-2" @click="addTag('speedAvg')" small>speedAvg</v-chip>
                        <v-chip class="mr-1 mb-2" @click="addTag('speedMax')" small>speedMax</v-chip>
                        <v-chip class="mr-1 mb-2" @click="addTag('cadenceAvg')" small>cadenceAvg</v-chip>
                        <v-chip class="mr-1 mb-2" @click="addTag('hasPower')" small>hasPower*</v-chip>
                        <v-chip class="mr-1 mb-2" @click="addTag('wattsAvg')" small>wattsAvg</v-chip>
                        <v-chip class="mr-1 mb-2" @click="addTag('wattsWeighted')" small>wattsWeighted</v-chip>
                        <v-chip class="mr-1 mb-2" @click="addTag('wattsMax')" small>wattsMax</v-chip>
                        <v-chip class="mr-1 mb-2" @click="addTag('hrAvg')" small>hrAvg</v-chip>
                        <v-chip class="mr-1 mb-2" @click="addTag('hrMax')" small>hrMax</v-chip>
                        <v-chip class="mr-1 mb-2" @click="addTag('calories')" small>calories</v-chip>
                        <v-chip class="mr-1 mb-2" @click="addTag('device')" small>device</v-chip>
                        <v-chip class="mr-1 mb-2" @click="addTag('commute')" small>commute*</v-chip>
                        <v-chip class="mr-1 mb-2" @click="addTag('manual')" small>manual*</v-chip>
                        <v-chip class="mr-1 mb-2" @click="addTag('temperature')" small>temperature**</v-chip>
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
                    <ul class="caption mt-4 pl-4">
                        <li>The "hasPower", "commute" and "manual" tags are boolean (yes or no)</li>
                        <li>The "temperature" tag is the value measured by the GPS device</li>
                    </ul>
                    <v-alert v-model="templateWarning" color="secondary" class="mt-4" icon="mdi-alert" rounded outlined dense>The new template will be applied once your calendar gets refreshed with new activities from Strava.</v-alert>
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
            calendarType: "all",
            calendarSports: "all",
            location: null,
            excludeCommutes: false,
            excludeNotJoined: false,
            templateWarning: false,
            activeField: "eventDetails",
            currentEventSummary: calendarTemplate.eventSummary || "",
            currentEventDetails: calendarTemplate.eventDetails || "",
            calendarTemplate: {
                eventSummary: calendarTemplate.eventSummary || "",
                eventDetails: calendarTemplate.eventDetails || ""
            },
            sampleTemplate: {
                eventSummary: "${name} ${icon}",
                eventDetails: "${distance} - ${elevationGain}\n${speedAvg}\n${calories}\n${hrAvg} - ${wattsAvg}\nGear: ${gear}\n${description}"
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

            const timestamp = Math.round(new Date().valueOf() / 1000 / 60 / 60)
            const location = this.location
            const port = location.port == "80" || location.port == "" ? "" : `:${location.port}`
            const userId = this.$store.state.user.id
            const urlToken = this.$store.state.user.urlToken
            const sports = this.calendarSports != "all" ? `&sports=${this.calendarSports}` : ""
            const commutes = this.excludeCommutes && this.calendarType != "clubs" ? "&commutes=0" : ""
            const joined = this.excludeNotJoined && this.calendarType != "activities" ? "&joined=1" : ""

            return `${location.hostname}${port}/api/calendar/${userId}/${urlToken}/${this.calendarType}.ics?ts=${timestamp}${sports}${commutes}${joined}`
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
        },
        setSampleTemplate() {
            this.calendarTemplate.eventSummary = this.sampleTemplate.eventSummary
            this.calendarTemplate.eventDetails = this.sampleTemplate.eventDetails
        },
        setActiveField(field) {
            this.activeField = field
        },
        addTag(tag) {
            const textInput = this.$refs[`${this.activeField}Input`].$refs.input
            const sentence = textInput.value
            const len = sentence.length
            const pos = textInput.selectionStart || 0

            const before = sentence.substring(0, pos)
            const after = sentence.substring(pos, len)

            this.calendarTemplate[this.activeField] = before + "${" + tag + "}" + after

            this.$nextTick().then(() => {
                textInput.focus()

                if (textInput.setSelectionRange) {
                    const range = pos + tag.length + 3
                    textInput.setSelectionRange(range, range)
                }
            })
        }
    }
}
</script>
