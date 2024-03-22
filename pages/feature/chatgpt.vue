<template>
    <v-main fluid>
        <feature-title header="Let ChatGPT name your activities" />

        <v-card color="black" class="mb-4 home-panel">
            <v-card-text>
                <div class="text-left">
                    <p>Strautomator's activity name generation just got a major boost: it can now use ChatGPT and Gemini to bring an unique and cool name for each of your cycling and running activities.</p>
                    <v-img class="mb-8" src="/images/feature/chat-gpt-prompt.png"></v-img>

                    <p>To use this feature, simply select the "Generate the activity name with AI" or "Generate a poem with AI" actions on your automation.</p>
                    <v-img class="mb-8" src="/images/feature/action-auto-generate.png"></v-img>
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
