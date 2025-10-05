<template>
    <div>
        <div class="mb-6 text-center strava-powered">
            <img src="/images/strava-powered.svg" width="130" />
        </div>
        <div class="mb-6 text-center">
            <n-link to="/account" title="My Account" v-if="loggedIn" nuxt><v-icon class="ml-2 mr-2">mdi-account</v-icon></n-link>
            <n-link to="/help" title="Need help?" nuxt><v-icon class="ml-2 mr-2">mdi-help-circle</v-icon></n-link>
            <a href="https://github.com/strautomator" title="Strautomator @ GitHub"><v-icon class="ml-2 mr-2">mdi-github</v-icon></a>
        </div>
        <v-footer class="justify-center" color="#101010" height="100">
            <div class="title font-weight-light grey--text text--lighten-1 text-center pt-2">
                <a href="/home" title="Home">
                    <img src="/images/logo.svg" width="16" height="16" class="strautologo mt-n1" />
                </a>
                <span>Strautomator.com</span>
                <v-chip v-if="!isPro" color="primary" class="caption mb-1 ml-1" small outlined>PRO</v-chip>
                <div class="mt-3 caption">
                    <n-link to="/tc" title="Terms and Conditions" nuxt>Terms and Conditions</n-link>
                    <n-link to="/impressum" title="Impressum" class="ml-5" v-if="impressum" nuxt>Impressum</n-link>
                </div>
            </div>
        </v-footer>
    </div>
</template>

<script>
export default {
    computed: {
        loggedIn() {
            return this.$store.state?.user ? true : false
        },
        isPro() {
            return this.$store.state?.user?.isPro ? true : false
        },
        impressum() {
            return ["AT", "BE", "CH", "DE"].includes(this.$store.state.country)
        }
    }
}
</script>
