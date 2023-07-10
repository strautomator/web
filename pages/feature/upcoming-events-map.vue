vue
<template>
    <v-main fluid>
        <div class="stripe"></div>
        <div class="py-2"></div>

        <v-container class="text-center" fluid>
            <div class="home-wrapper">
                <feature-title header="View your upcoming events map" />

                <v-card color="black" class="mb-4 home-panel">
                    <v-card-text>
                        <div class="text-left">
                            <p>
                                Strautomator makes it damn easy for you to decide which club events you should attend to. It pins your upcoming events on a map, and draws the route in case there's one set on Strava. PRO users will also get partial
                                support for Komoot routes.
                            </p>
                            <v-img class="mb-5" src="/images/feature/upcoming-events-map.png"></v-img>
                            <p>
                                PRO accounts can view up to {{ $store.state.proPlanDetails.futureCalendarDays }} days of events, and batch download the Strava routes as a single ZIP file. Free accounts are limited to events for the next
                                {{ $store.state.freePlanDetails.futureCalendarDays }} days only, and no ZIP downloads.
                            </p>
                        </div>
                    </v-card-text>
                </v-card>

                <div class="mt-6 mb-2">
                    <div v-if="$store.state.user">
                        <v-btn color="primary" to="/map" title="Upcoming Events Map" rounded nuxt>
                            <v-icon left>mdi-link</v-icon>
                            Go to upcoming events map
                        </v-btn>
                    </div>
                    <div v-else>
                        <a title="Connect with Strava..." @click="login()"><img class="strava-connect" src="/images/strava-connect.svg" /></a>
                    </div>
                </div>

                <feature-links />
            </div>
        </v-container>
    </v-main>
</template>

<script>
import FeatureLinks from "~/components/FeatureLinks.vue"
import FeatureTitle from "~/components/FeatureTitle.vue"

export default {
    layout: "landing",
    components: {FeatureLinks, FeatureTitle},
    head() {
        return {
            title: "View your upcoming club events map"
        }
    },
    methods: {
        login() {
            this.$login()
        }
    }
}
</script>
