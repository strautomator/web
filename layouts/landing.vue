<template>
    <v-app class="landing">
        <v-content fluid>
            <nuxt />
        </v-content>

        <div class="mb-6 text-center strava-powered">
            <img src="/images/strava-powered.svg" width="130" />
        </div>
        <div class="mb-6 text-center">
            <a href="https://github.com/strautomator" title="Strautomator @ GitHub"><v-icon>mdi-github</v-icon></a>
            <a href="https://twitter.com/strautomator" title="Strautomator @ Twitter"><v-icon class="ml-2">mdi-twitter</v-icon></a>
            <a href="https://instagram.com/strautomator" title="Strautomator @ Instagram"><v-icon class="ml-2">mdi-instagram</v-icon></a>
        </div>
        <div id="cookie-panel" class="hidden">
            <div class="wrapper columns">
                <div class="column has-text-left-tablet">
                    <span class="is-size-7"></span>
                </div>
                <div class="column is-one-fifth">
                    <button id="but-cookie" class="button is-rounded is-pulled-right-mobile-only is-size-7">Accept cookies</button>
                </div>
            </div>
        </div>
        <v-snackbar v-model="showCookieConsent" color="accent" class="caption" :timeout="0" multi-line bottom>
            This website will use cookies for login, analytics and usability features. Proceed with usage only if you accept them.
            <v-btn @click="acceptCookies" title="Alright, sir!">Accept</v-btn>
        </v-snackbar>
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
    },
    data() {
        return {
            showCookieConsent: !(this.$cookies.get("cookie-consent", {parseJSON: false}) || false)
        }
    },
    methods: {
        acceptCookies() {
            this.$cookies.set("cookie-consent", true, {
                path: "/",
                maxAge: 60 * 60 * 24 * 365 * 10
            })

            this.showCookieConsent = false
        }
    }
}
</script>
