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

        <div class="mb-6 text-center strava-powered">
            <img src="/images/strava-powered.svg" width="130" />
        </div>
        <div class="mb-6 text-center">
            <n-link to="/help" title="Need help?"><v-icon class="ml-2 mr-2">mdi-help-circle</v-icon></n-link>
            <a href="https://github.com/strautomator" title="Strautomator @ GitHub"><v-icon class="ml-2 mr-2">mdi-github</v-icon></a>
            <a href="https://x.com/strautomator" title="Strautomator @ X"><v-icon class="ml-2 mr-2">mdi-twitter</v-icon></a>
        </div>
        <v-footer class="justify-center" color="#292929" height="100">
            <div class="title font-weight-light grey--text text--lighten-1 text-center">
                <a href="/home" title="Home">
                    <img src="/images/logo.svg" width="24" height="24" class="strautologo" />
                </a>
                Strautomator.com
            </div>
        </v-footer>
    </v-app>
</template>

<script>
import FeatureLinks from "~/components/FeatureLinks.vue"

export default {
    components: {FeatureLinks},
    head: {
        meta: [{hid: "description", name: "description", content: "Automate your Strava activities! Strautomator is like IFTTT, but for Strava."}]
    }
}
</script>
