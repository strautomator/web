<template>
    <v-main fluid>
        <div class="stripe"></div>
        <div class="py-2"></div>

        <v-container class="text-center" fluid>
            <div class="home-wrapper">
                <h1 class="font-weight-light mt-1 mb-2" :class="$breakpoint.mdAndUp ? 'display-1' : 'headline'">
                    Export your Strava calendar
                </h1>
                <div>with</div>
                <h2 class="display-2 font-weight-bold mb-4">Strautomator</h2>

                <v-card color="black" class="mb-4 home-panel">
                    <v-card-text>
                        <div class="text-left">
                            <p>
                                You can now have your Strava activities and upcoming club events displayed on your favourite calendar app. Calendars are exported using the .ics format and compatible with most popular calendar applications and
                                services (Google, Apple, Outlook, Thunderbird etc).
                            </p>

                            <h2 class="mb-2">How can I subscribe?</h2>
                            <v-img class="mb-2" src="/images/feature/calendar-subscribe.png"></v-img>
                            <div class="mb-8">
                                <ul class="ml-n2 mb-4">
                                    <li>Go to My Account, then My Calendar</li>
                                    <li>Choose your desired calendar options</li>
                                    <li>Use the "Subscribe to calendar" button, or copy the URL directly from the text field</li>
                                </ul>
                                <p>
                                    PRO users can export up to {{ $store.state.proPlanDetails.pastCalendarDays }} days of activities on their calendar, while free accounts are limited to the past
                                    {{ $store.state.freePlanDetails.pastCalendarDays }} and next {{ $store.state.freePlanDetails.futureCalendarDays }} days.
                                </p>
                            </div>

                            <h2 class="mt-4 mb-2">Customizing the calendar details</h2>
                            <div class="mb-2">
                                <p>PRO users can fully customize the template of the exported calendar, by setting their own calendar template. Speed, time, elevation, distance, temperature, device... use whatever you want!</p>
                            </div>
                        </div>
                    </v-card-text>
                </v-card>

                <div class="mt-6 mb-2">
                    <div v-if="$store.state.user">
                        <v-btn color="primary" to="/calendar" title="My Calendar" rounded nuxt>
                            <v-icon left>mdi-link</v-icon>
                            Go to My Calendar
                        </v-btn>
                    </div>
                    <div v-else>
                        <a title="Connect with Strava..." @click="login()"><img class="strava-connect" src="/images/strava-connect.svg"/></a>
                    </div>
                </div>

                <feature-links />
            </div>
        </v-container>
    </v-main>
</template>

<script>
import FeatureLinks from "~/components/FeatureLinks.vue"

export default {
    layout: "landing",
    components: {FeatureLinks},
    head() {
        return {
            title: "Export your Strava calendar"
        }
    },
    methods: {
        login() {
            this.$login()
        }
    }
}
</script>
