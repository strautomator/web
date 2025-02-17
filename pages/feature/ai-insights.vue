<template>
    <v-main fluid>
        <feature-title header="AI insights on your private notes" />

        <v-card color="black" class="mb-4 home-panel">
            <v-card-text>
                <div class="text-left">
                    <p>If you want some advice about your activity performance, Strautomator can generate AI insights for you on your private notes.</p>
                    <v-img class="mb-8" src="/images/feature/action-auto-generate.png"></v-img>

                    <h2 class="mb-2">Multiple AI providers</h2>
                    <div class="mb-2">
                        <ul class="ml-n2 mb-2">
                            <li>Anthropic (Claude)</li>
                            <li>Mistral (Mistral AI)</li>
                            <li>OpenAI (ChatGPT)</li>
                            <li>Gemini (Google)</li>
                            <li>xAI (Grok)</li>
                        </ul>
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
