<template>
    <v-main fluid>
        <feature-title header="Export your Strava calendar" />

        <v-card color="black" class="mb-4 home-panel">
            <v-card-text>
                <div class="text-left">
                    <p>
                        With Strautomator, you can have your Strava activities and upcoming club events displayed on your favourite calendar app. Calendars are exported with the .ics format, and compatible with most popular calendar applications and
                        services.
                    </p>

                    <h2 class="mb-2">How can I subscribe?</h2>
                    <v-img class="mb-2" src="/images/feature/calendar-subscribe.png"></v-img>
                    <div>
                        <ul class="ml-n2">
                            <li>Go to the Calendar tab</li>
                            <li>Choose your desired calendar options</li>
                            <li>Use the "Subscribe to calendar" button, or copy the URL directly from the text field</li>
                        </ul>
                    </div>
                </div>
            </v-card-text>
        </v-card>

        <div class="mt-6 mb-2">
            <btn-calendar />
        </div>
    </v-main>
</template>

<script>
import FeatureTitle from "~/components/FeatureTitle.vue"
import BtnCalendar from "~/components/buttons/Calendar.vue"

export default {
    layout: "feature",
    components: {FeatureTitle, BtnCalendar},
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
