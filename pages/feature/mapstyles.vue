vue
<template>
    <v-main fluid>
        <div class="stripe"></div>
        <div class="py-2"></div>

        <v-container class="text-center" fluid>
            <div class="home-wrapper">
                <feature-title header="Set a default map style for activities" />

                <v-card color="black" class="mb-4 home-panel">
                    <v-card-text>
                        <div class="text-left">
                            <p>Strautomator can automatically set different map styles for different types of activities. Power for rides, speed for runs, and Satellite 3D for hikes? Easy!</p>

                            <h2 class="mb-2">1. First, define a sport type condition</h2>
                            <v-img class="mb-2" src="/images/feature/condition-sport-type.png"></v-img>
                            <div class="mb-8">Define which sport types should trigger the automation. Here we have selected most of the cycling activity types.</div>

                            <h2 class="mb-2">2. Then, create a map style action</h2>
                            <v-img class="mb-2" src="/images/feature/action-mapstyle.png"></v-img>
                            <div class="mb-8">Define an action to set the map style. Here we're using the "Speed" map.</div>

                            <h2 class="mb-2">3. Review your automation</h2>
                            <v-img class="mb-2" src="/images/feature/mapstyle-automation.png"></v-img>
                            <div class="mb-8">Review the automation conditions and actions, save, and you're good to go!</div>
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
            title: "Set a default map style for activities"
        }
    },
    methods: {
        login() {
            this.$login()
        }
    }
}
</script>
