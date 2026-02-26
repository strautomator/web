<template>
    <v-main fluid>
        <feature-title header="AI insights for your activities" />

        <v-card color="black" class="mb-4 home-panel">
            <v-card-text>
                <div class="text-left">
                    <p>
                        If you want some advice about your activity performance, Strautomator can generate private AI insights for your activities. It will consider not only your activity metadata, but also your recent performance, training volume
                        and weather data.
                    </p>
                    <p>If you want to bring it to the next level, you can also set your own custom prompt that will be sent to the AI provider to generate the insights.</p>
                    <v-img class="mb-8" src="/images/feature/action-ai-insights.png"></v-img>

                    <h2 class="mb-2">Multiple AI providers</h2>
                    <ul class="ml-n2 mb-6">
                        <li>Anthropic (Claude)</li>
                        <li>Mistral (Mistral AI)</li>
                        <li>OpenAI (ChatGPT)</li>
                        <li>Google (Gemini)</li>
                        <li>xAI (Grok)</li>
                        <li>OpenRouter (all models)</li>
                    </ul>

                    <p>This feature is available to PRO users only.</p>
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
            title: "Better (and private) AI insights for your Strava activities"
        }
    },
    methods: {
        login() {
            this.$login()
        }
    }
}
</script>
