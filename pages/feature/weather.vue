vue
<template>
    <v-main fluid>
        <feature-title header="Weather data on your activities" />

        <v-card color="black" class="mb-4 home-panel">
            <v-card-text>
                <div class="text-left">
                    <p>Strautomator allows you to add icons, temperature, humidity, wind and other weather conditions to your activity details.</p>

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
                            <li v-for="provider in providers" :key="provider">{{ provider }}</li>
                        </ul>
                        <p>PRO users can choose their preferred weather provider, while free accounts are limited to the default provider for their current location.</p>
                    </div>
                </div>
            </v-card-text>
        </v-card>

        <div class="mt-6 mb-2">
            <btn-automations />
        </div>
    </v-main>
</template>

<script>
import FeatureTitle from "~/components/FeatureTitle.vue"
import BtnAutomations from "~/components/buttons/Automations.vue"

export default {
    layout: "feature",
    components: {FeatureTitle, BtnAutomations},
    head() {
        return {
            title: "Weather data on your Strava activities"
        }
    },
    data() {
        const providers = []

        for (let p of this.$store.state.weatherProviders) {
            if (p.value != null) {
                providers.push(p.text)
            }
        }

        return {
            providers: providers
        }
    },
    methods: {
        login() {
            this.$login()
        }
    }
}
</script>
