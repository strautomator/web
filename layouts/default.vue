<template>
    <v-app class="text-center">
        <v-app-bar fixed app>
            <v-toolbar-title class="mr-10 ml-1">
                <n-link to="/dashboard" nuxt router>
                    <img src="/images/logo-round.svg" width="48" height="48" class="strautologo float-left" />
                    <span class="d-inline-block ml-2 mt-2">Strautomator</span>
                </n-link>
            </v-toolbar-title>

            <v-toolbar-items class="hidden-sm-and-down">
                <v-btn to="/automations" router nuxt>Automations</v-btn>
                <v-btn to="/gear" router nuxt>Gear</v-btn>
                <v-btn to="/calendar" router nuxt>Calendar</v-btn>
                <v-btn to="/map" router nuxt>Map</v-btn>
                <v-btn to="/help" router nuxt>Help</v-btn>
            </v-toolbar-items>

            <v-spacer></v-spacer>
            <top-notifications />

            <router-link to="/account" title="Go to My Account" router nuxt>
                <v-icon v-if="$store.state.user?.preferences?.privacyMode" class="ml-1" large>mdi-incognito</v-icon>
                <v-avatar class="ml-4" v-else-if="$store.state.user?.profile?.urlAvatar" :size="$breakpoint.mdAndUp ? 48 : 32">
                    <img :src="$store.state.user?.profile.urlAvatar" />
                </v-avatar>
            </router-link>
            <v-btn color="info" class="ml-1 mr-n3 mr-md-0" title="Logout" @click="showLogoutDialog" rounded text router nuxt>
                <v-icon>mdi-logout</v-icon>
                <span v-if="!$breakpoint.smAndDown" class="hidden-sm-and-down caption">Logout</span>
            </v-btn>
        </v-app-bar>
        <v-main>
            <v-container class="width-wrapper" fluid>
                <nuxt v-if="$store.state?.user" />
                <ads-panel />
            </v-container>

            <div class="mt-3 text-center">
                <div class="mb-6">
                    <img src="/images/strava-powered.svg" width="130" />
                </div>
                <div>
                    <n-link to="/account" title="My Account" nuxt><v-icon class="ml-2 mr-2">mdi-account</v-icon></n-link>
                    <n-link to="/help" title="Need help?" nuxt><v-icon class="ml-2 mr-2">mdi-help-circle</v-icon></n-link>
                    <a href="https://github.com/strautomator" title="Strautomator @ GitHub"><v-icon class="ml-2 mr-2">mdi-github</v-icon></a>
                    <a href="https://x.com/strautomator" title="Strautomator @ X"><v-icon class="ml-2 mr-2">mdi-twitter</v-icon></a>
                </div>

                <div class="copyright">
                    <span>Strautomator.com</span>
                    <v-chip v-if="$store.state.user?.isPro" color="primary" class="caption mb-1 ml-1" outlined>PRO</v-chip>
                    <div class="mt-3">
                        <n-link to="/tc" title="Terms and Conditions" class="caption" nuxt>Terms and Conditions</n-link>
                    </div>
                </div>
            </div>
        </v-main>
        <v-bottom-navigation class="hidden-md-and-up" color="primary" :value="activeNavBtn" app grow>
            <v-btn value="/dashboard" to="/dashboard" router nuxt>
                <span>Home</span>
                <v-icon>mdi-home</v-icon>
            </v-btn>
            <v-btn value="/automations" to="/automations" router nuxt>
                <span>Automations</span>
                <v-icon>mdi-file-tree</v-icon>
            </v-btn>
            <v-btn value="/gear" to="/gear" router nuxt>
                <span>Gear</span>
                <v-icon>mdi-cog-refresh</v-icon>
            </v-btn>
            <v-btn value="/calendar" to="/calendar" router nuxt>
                <span>Calendar</span>
                <v-icon>mdi-calendar</v-icon>
            </v-btn>
            <v-btn value="/map" to="/map" router nuxt>
                <span>Map</span>
                <v-icon>mdi-map</v-icon>
            </v-btn>
            <v-btn value="/help" to="/help" v-show="false" router nuxt>
                <span>Help</span>
                <v-icon>mdi-help</v-icon>
            </v-btn>
            <v-btn value="/account" to="/account" v-show="false" router nuxt>
                <span>Account</span>
                <v-icon>mdi-account</v-icon>
            </v-btn>
        </v-bottom-navigation>

        <v-dialog v-model="logoutDialog" width="440" overlay-opacity="0.95">
            <v-card>
                <v-toolbar color="accent">
                    <v-toolbar-title>Logout</v-toolbar-title>
                    <v-spacer></v-spacer>
                    <v-toolbar-items>
                        <v-btn icon @click.stop="hideLogoutDialog">
                            <v-icon>mdi-close</v-icon>
                        </v-btn>
                    </v-toolbar-items>
                </v-toolbar>
                <v-card-text>
                    <p class="mt-3">Do you want to logout from Strautomator?</p>
                    <p>To log back in please use the <strong>Connect with Strava</strong> button again on the homepage.</p>
                    <div class="text-right">
                        <v-spacer></v-spacer>
                        <v-btn class="mr-2" color="grey" title="Stay here" @click.stop="hideLogoutDialog" text rounded>
                            <v-icon left>mdi-cancel</v-icon>
                            Cancel
                        </v-btn>
                        <v-btn color="removal" title="Yes, logout" @click="logout" rounded>
                            <v-icon left>mdi-logout</v-icon>
                            Logout
                        </v-btn>
                    </div>
                </v-card-text>
            </v-card>
        </v-dialog>

        <v-dialog v-model="errorDialog" width="440" overlay-opacity="0.95">
            <v-card>
                <v-toolbar color="error">
                    <v-toolbar-title>{{ $store.state.errorTitle }}</v-toolbar-title>
                    <v-spacer></v-spacer>
                    <v-toolbar-items>
                        <v-btn icon @click.stop="hideErrorDialog">
                            <v-icon>mdi-close</v-icon>
                        </v-btn>
                    </v-toolbar-items>
                </v-toolbar>
                <v-card-text>
                    <p class="mt-3">Reference method: {{ $store.state.errorMethod }}</p>
                    <p>{{ $store.state.errorMessage }}</p>
                    <div class="text-center text-md-right">
                        <v-spacer></v-spacer>
                        <v-btn class="mr-2" color="accent" title="Back to the Dashboard" @click.stop="goToDashboard" rounded>
                            <v-icon left>mdi-refresh</v-icon>
                            Reload
                        </v-btn>
                        <v-btn color="accent" title="Ignore this error and continue" @click.stop="hideErrorDialog" rounded>
                            <v-icon left>mdi-cancel</v-icon>
                            Close
                        </v-btn>
                    </div>
                </v-card-text>
            </v-card>
        </v-dialog>
    </v-app>
</template>

<script>
import AdsPanel from "~/components/AdsPanel.vue"
import TopNotifications from "~/components/TopNotifications.vue"

export default {
    authenticated: true,
    components: {AdsPanel, TopNotifications},
    head: {
        meta: [{hid: "description", name: "description", content: "Automate your Strava activities! Strautomator is like IFTTT, but for Strava."}]
    },
    data() {
        return {
            activeNavBtn: this.$route.path || null,
            logoutDialog: false
        }
    },
    computed: {
        errorDialog() {
            return this.$store.state.errorTitle || this.$store.state.errorMessage ? true : false
        }
    },
    mounted() {
        if (!this.$store.state?.user) {
            const errTitle = "User not found"
            document.location.href = `/error?status=401&title=${encodeURIComponent(errTitle)}`
        }
    },
    methods: {
        goToDashboard() {
            document.location.href = "/dashboard"
        },
        showErrorDialog(title, message) {
            this.errorTitle = title
            this.errorMessage = message
            this.errorDialog = true
        },
        hideErrorDialog() {
            this.$store.commit("setError", null)
        },
        showLogoutDialog() {
            this.logoutDialog = true
        },
        hideLogoutDialog() {
            this.logoutDialog = false
        },
        logout() {
            this.$logout()
        }
    }
}
</script>
