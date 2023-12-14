<template>
    <v-main fluid>
        <div class="stripe"></div>
        <div class="py-2"></div>

        <v-container class="text-center" fluid>
            <div class="home-wrapper">
                <feature-title header="Let ChatGPT name your activities" />

                <v-card color="black" class="mb-4 home-panel">
                    <v-card-text>
                        <div class="text-left">
                            <p>Strautomator's activity name generation just got a major boost: it can now use ChatGPT and Gemini to bring an unique and cool name for each of your cycling and running activities.</p>
                            <v-img class="mb-8" src="/images/feature/chat-gpt-prompt.png"></v-img>

                            <p>To use this feature, simply select the "Auto generate the activity name" action on your automation.</p>
                            <v-img class="mb-8" src="/images/feature/action-auto-generate.png"></v-img>

                            <p class="font-italic">At the moment this feature is available to PRO users only. Non PRO users will fallback to the template-based method to generate activity names.</p>
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
