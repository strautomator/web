vue
<template>
    <v-main fluid>
        <div class="stripe"></div>
        <div class="py-2"></div>

        <v-container class="text-center" fluid>
            <div class="home-wrapper">
                <feature-title header="Automatically tag your commutes" />

                <v-card color="black" class="mb-4 home-panel">
                    <v-card-text>
                        <div class="text-left">
                            <p>Strautomator can automatically tag your commutes, based on the conditions that you create to define what should be tagged.</p>

                            <h2 class="mb-2">1. First, define the conditions</h2>
                            <v-img class="mb-2" src="/images/feature/condition-end-location.png"></v-img>
                            <div class="mb-8">Define what should trigger this automation. Here we're using an "End location" condition, pointing to the address where the activity should end.</div>

                            <h2 class="mb-2">2. Then, create a commute action</h2>
                            <v-img class="mb-2" src="/images/feature/action-commute.png"></v-img>
                            <div class="mb-8">The action above tells Strautomator to mark the activity as "Commute" on Strava.</div>

                            <h2 class="mb-2">3. Review your automation</h2>
                            <v-img class="mb-2" src="/images/feature/commute-automation.png"></v-img>
                            <div class="mb-8">Review the automation conditions and actions, save, and you're good to go!</div>

                            <h2 class="mb-2">Other commute conditions</h2>
                            <div class="mb-2">
                                <p>You can use any conditions mix to define what is a commute. Some ideas:</p>
                                <ul class="ml-n2">
                                    <li>Distance is less than 10km</li>
                                    <li>Average speed is less than 20kph</li>
                                    <li>Device used is a Garmin Edge 130</li>
                                    <li>Etc etc etc...</li>
                                </ul>
                            </div>
                        </div>
                    </v-card-text>
                </v-card>

                <div class="mt-6 mb-2">
                    <div v-if="$store.state.user">
                        <v-btn color="primary" to="/automations" title="My automations" rounded nuxt>
                            <v-icon left>mdi-link</v-icon>
                            Go to my automations
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
            title: "Automatically tag your commutes"
        }
    },
    methods: {
        login() {
            this.$login()
        }
    }
}
</script>
