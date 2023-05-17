vue
<template>
    <v-main fluid>
        <div class="stripe"></div>
        <div class="py-2"></div>

        <v-container class="text-center" fluid>
            <div class="home-wrapper">
                <feature-title header="Track your personal records" />

                <v-card color="black" class="mb-4 home-panel">
                    <v-card-text>
                        <div class="text-left">
                            <p>Strautomator can keep tabs on your personal records on Strava! Track the longest distance, speed, power, heart rate and more for your rides, runs or any other activity type.</p>
                            <v-img class="mb-5" src="/images/feature/records-ride.png"></v-img>

                            <p>And you can also use activity records as part of automaton conditions:</p>
                            <v-img class="mb-2" src="/images/feature/records-condition.png"></v-img>

                            <h2 class="mt-4 mb-2">How can I enable the feature?</h2>
                            <div class="mb-8">
                                <div class="mb-4">The personal records tracking is opt-in:</div>
                                <ul class="ml-n2">
                                    <li>Go to your personal records view from the dashboard</li>
                                    <li>Use the "Fetch activity records" button</li>
                                    <li>Sit down and relax, your records should be extracted from activities within 3 minutes</li>
                                </ul>
                                <div class="mt-4">After the feature is enabled, new activity records will be checked automatically.</div>
                            </div>
                        </div>
                    </v-card-text>
                </v-card>

                <div class="mt-6 mb-2">
                    <div v-if="$store.state.user">
                        <v-btn color="primary" to="/dashboard/records" title="Personal records" rounded nuxt>
                            <v-icon left>mdi-link</v-icon>
                            Go to personal records
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
            title: "Track your personal records"
        }
    },
    methods: {
        login() {
            this.$login()
        }
    }
}
</script>
