vue
<template>
    <v-main fluid>
        <div class="stripe"></div>
        <div class="py-2"></div>

        <v-container class="text-center" fluid>
            <div class="home-wrapper">
                <h1 class="font-weight-light mt-1 mb-2" :class="$breakpoint.mdAndUp ? 'display-1' : 'headline'">
                    Weather data on your activities
                </h1>
                <div>with</div>
                <h2 class="display-2 font-weight-bold mb-4">Strautomator</h2>

                <v-card color="black" class="mb-4 home-panel">
                    <v-card-text>
                        <div class="text-left">
                            <p>
                                Strautomator allows you to automatically add icons, temperature, humidity, wind and other weather conditions to your activity details.
                            </p>

                            <h2 class="mb-2">1. First, create a condition</h2>
                            <v-img class="mb-2" src="/images/feature/condition-passes-on.png"></v-img>
                            <div class="mb-8">Define what should trigger this automation. Here we're using a "Passes on location" condition, pointing to Alexanderplatz, in Berlin.</div>

                            <h2 class="mb-2">2. Then, create an action</h2>
                            <v-img class="mb-2" src="/images/feature/action-name-weather.png"></v-img>
                            <div class="mb-8">The action above tells Strautomator to set the activity name as "Commute" plus the weather icon (sunny, cloudy, rainy etc...).</div>

                            <h2 class="mb-2">3. Review your automation</h2>
                            <v-img class="mb-2" src="/images/feature/weather-automation.png"></v-img>
                            <div class="mb-8">Review the automation conditions and actions, and you're good to go!</div>

                            <h2 class="mb-2">Multiple weather providers</h2>
                            <div class="mb-2">
                                <ul class="ml-n2 mb-2">
                                    <li>ClimaCell</li>
                                    <li>OpenWeatherMap</li>
                                    <li>Storm Glass</li>
                                    <li>Visual Crossing</li>
                                    <li>Weatherbit</li>
                                    <li>Weather API</li>
                                </ul>
                                <p>
                                    PRO users can choose their preferred weather provider, while free accounts are limited to the default provider for their current location.
                                </p>
                            </div>
                        </div>
                    </v-card-text>
                </v-card>

                <div class="mt-6 mb-2">
                    <div v-if="$store.state.user">
                        <v-btn color="primary" to="/automations" title="My Automations" rounded nuxt>
                            <v-icon left>mdi-link</v-icon>
                            Go to My Automations
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
            title: "Weather data on your activities"
        }
    },
    methods: {
        login() {
            this.$login()
        }
    }
}
</script>
