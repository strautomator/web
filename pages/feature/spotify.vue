vue
<template>
    <v-main fluid>
        <div class="stripe"></div>
        <div class="py-2"></div>

        <v-container class="text-center" fluid>
            <div class="home-wrapper">
                <feature-title header="Spotify tracks on your activities" />

                <v-card color="black" class="mb-4 home-panel">
                    <v-card-text>
                        <div class="text-left">
                            <p>Strautomator allows you to add your Spotify track list to your Strava activities!</p>

                            <h2 class="mb-2">1. First, link your Spotify account</h2>
                            <v-img class="mb-2" src="/images/feature/spotify-link.png"></v-img>
                            <div class="mb-8">Go to "My Account" and use the button "Link Spotify Account".</div>

                            <h2 class="mb-2">2. Create an automation with Spotify tags</h2>
                            <v-img class="mb-2" src="/images/feature/spotify-action.png"></v-img>
                            <div class="mb-8">On your new or existing automation, define an action to add any of the available Spotify tags to the activity name or description.</div>

                            <h2 class="mb-2">3. Review your automation</h2>
                            <v-img class="mb-2" src="/images/feature/spotify-automation.png"></v-img>
                            <div class="mb-8">Review the automation conditions and actions, save, and enjoy having your tracks played during an activity shown in Strava.</div>
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
            title: "Spotify tracks on your activities"
        }
    },
    methods: {
        login() {
            this.$login()
        }
    }
}
</script>
