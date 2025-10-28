<template>
    <v-app class="feature">
        <v-main fluid>
            <div class="stripe"></div>
            <div class="py-2"></div>
            <v-container class="text-center" fluid>
                <div class="home-wrapper">
                    <nuxt />
                    <feature-links />
                </div>
            </v-container>
        </v-main>

        <div class="mt-6 mb-2" v-if="$route.path != '/feature'">
            <btn-automations />
        </div>

        <footer-section />
    </v-app>
</template>

<script>
import BtnAutomations from "~/components/buttons/Automations.vue"
import FeatureLinks from "~/components/FeatureLinks.vue"
import FooterSection from "~/components/FooterSection.vue"

export default {
    components: {BtnAutomations, FeatureLinks, FooterSection},
    head: {
        meta: [{hid: "description", name: "description", content: "Automate your Strava activities! Strautomator is like IFTTT, but for Strava"}]
    }
}
</script>
