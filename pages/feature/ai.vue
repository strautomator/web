<template>
    <v-main fluid>
        <feature-title header="Let AI name your activities" />

        <v-card color="black" class="mb-4 home-panel">
            <v-card-text>
                <div class="text-left">
                    <p>Tired of boring Strava activity names? Strautomator has AI features to give unique titles, descriptions and poems to your activities!</p>
                    <p>Your activity metadata, efforts and weather conditions are all taken into consideration when generating the content.</p>
                    <v-img class="mb-8" src="/images/feature/action-auto-generate.png"></v-img>

                    <h2 class="mb-2">Multiple AI providers</h2>
                    <div class="mb-2">
                        <ul class="ml-n2 mb-2">
                            <li>Anthropic (Claude)</li>
                            <li>OpenAI (ChatGPT)</li>
                            <li>Gemini (from Google)</li>
                            <li>xAI (Grok)</li>
                        </ul>
                        <p>PRO users will have access to the most advanced models, while free users are limited to a subset of the faster and cheaper models.</p>
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
            title: "Activities names and descriptions with AI from ChatGPT, Gemini, Claude and Grok"
        }
    },
    methods: {
        login() {
            this.$login()
        }
    }
}
</script>
