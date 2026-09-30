<template>
    <v-app class="feature site-page">
        <v-main fluid>
            <div class="site-glow site-glow-top"></div>
            <div class="py-2"></div>
            <v-container class="text-center" fluid>
                <div class="home-wrapper">
                    <nuxt />
                    <feature-links />
                </div>
            </v-container>
        </v-main>

        <section class="feature-cta site-cta" v-if="$route.path != '/feature'">
            <h2 class="site-headline site-headline-cta">Turbocharge <span class="gradient-text">your Strava experience</span></h2>
            <p class="site-lead mx-auto">Connect your Strava account today!</p>
            <btn-automations />
        </section>

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
