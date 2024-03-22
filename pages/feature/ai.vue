<template>
    <v-main fluid>
        <feature-title header="Let AI name your activities" />

        <v-card color="black" class="mb-4 home-panel">
            <v-card-text>
                <div class="text-left">
                    <p>Tired of boring Strava activity names? Strautomator has AI features to give unique titles and descriptions to your activities!</p>
                    <p>Your activity metadata, efforts and weather conditions are all taken into consideration when generating the content.</p>
                    <v-img class="mb-8" src="/images/feature/action-auto-generate.png"></v-img>

                    <h2 class="mb-2">Multiple AI providers</h2>
                    <div class="mb-2">
                        <ul class="ml-n2 mb-2">
                            <li>OpenAI ChatGPT</li>
                            <li>Google Gemini</li>
                            <li>Anthropic Claude</li>
                        </ul>
                        <p>PRO users can choose a preferred AI provider, while free accounts are limited to the basic models from OpenAI and Google.</p>
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
            title: "Activities names and descriptions with ChatGPT, Gemini or Claude"
        }
    },
    methods: {
        login() {
            this.$login()
        }
    }
}
</script>
