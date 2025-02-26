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

        <footer-section />
    </v-app>
</template>

<script>
import FeatureLinks from "~/components/FeatureLinks.vue"
import FooterSection from "~/components/FooterSection.vue"

export default {
    components: {FeatureLinks, FooterSection},
    head: {
        meta: [{hid: "description", name: "description", content: "Automate your Strava activities! Strautomator is like IFTTT, but for Strava."}]
    }
}
</script>
