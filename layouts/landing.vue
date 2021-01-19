<template>
    <v-app class="landing">
        <v-main fluid>
            <nuxt />
        </v-main>

        <div class="mb-6 text-center strava-powered">
            <img src="/images/strava-powered.svg" width="130" />
        </div>
        <div class="mb-6 text-center">
            <n-link to="/help" title="Need help?"><v-icon>mdi-help-circle</v-icon></n-link>
            <a href="https://github.com/strautomator" title="Strautomator @ GitHub"><v-icon class="ml-4 ml-md-3">mdi-github</v-icon></a>
            <a href="https://twitter.com/strautomator" title="Strautomator @ Twitter"><v-icon class="ml-4 ml-md-3">mdi-twitter</v-icon></a>
            <a href="https://t.me/strautomator" title="Strautomator @ Telegram"><v-icon class="ml-4 ml-md-3">mdi-telegram</v-icon></a>
        </div>
        <v-footer class="justify-center" color="#292929" height="100">
            <div class="title font-weight-light grey--text text--lighten-1 text-center">
                <img src="/images/logo.svg" width="24" height="24" class="strautologo" />
                Strautomator.com
            </div>
        </v-footer>
    </v-app>
</template>

<script>
export default {
    head: {
        meta: [{hid: "description", name: "description", content: "Automate your Strava activities! Strautomator is like IFTTT, but for Strava."}]
    }
}
</script>
