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
                <v-btn to="/account" router nuxt>Account</v-btn>
                <v-btn to="/help" router nuxt>Help</v-btn>
            </v-toolbar-items>

            <v-spacer></v-spacer>
            <top-notifications />

            <v-icon v-if="$store.state.user?.preferences?.privacyMode" class="ml-1" large>mdi-incognito</v-icon>
            <v-avatar class="ml-4" v-else-if="$store.state.user?.profile?.urlAvatar" :size="$breakpoint.mdAndUp ? 48 : 32">
                <img :src="$store.state.user?.profile.urlAvatar" />
            </v-avatar>
            <v-btn color="info" class="ml-1 mr-n3 mr-md-0" title="Logout" @click="showLogoutDialog" rounded text router nuxt>
                <v-icon>mdi-logout</v-icon>
                <span v-if="!$breakpoint.smAndDown" class="hidden-sm-and-down caption">Logout</span>
            </v-btn>
        </v-app-bar>
        <v-main>
            <div v-if="$store.state.beta" class="beta-header">Beta environment, for testing purposes only!</div>

            <v-container class="width-wrapper" fluid>
                <nuxt v-if="$store.state?.user" />
            </v-container>

            <div class="mt-3 text-center">
                <div class="mb-6">
                    <img src="/images/strava-powered.svg" width="130" />
                </div>
                <div>
                    <n-link to="/help" title="Need help?"><v-icon class="ml-2 mr-2">mdi-help-circle</v-icon></n-link>
                    <a href="https://github.com/strautomator" title="Strautomator @ GitHub"><v-icon class="ml-2 mr-2">mdi-github</v-icon></a>
                    <a href="https://twitter.com/strautomator" title="Strautomator @ Twitter"><v-icon class="ml-2 mr-2">mdi-twitter</v-icon></a>
                </div>

                <div class="copyright">
                    <span>Strautomator.com</span>
                    <v-chip v-if="$store.state.user?.isPro" color="primary" class="caption mb-1 ml-1" outlined>PRO</v-chip>
                    <v-chip v-if="$store.state.beta" color="primary" class="caption mb-1 ml-1" outlined>Beta</v-chip>
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
            <v-btn value="/account" to="/account" router nuxt>
                <span>Account</span>
                <v-icon>mdi-account</v-icon>
            </v-btn>
            <v-btn value="/help" to="/help" v-show="false" router nuxt>
                <span>Help</span>
                <v-icon>mdi-help</v-icon>
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
                        <v-btn class="mr-1" color="grey" title="Stay here" @click.stop="hideLogoutDialog" text rounded>
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
    </v-app>
</template>

<script>
import TopNotifications from "~/components/TopNotifications.vue"

export default {
    authenticated: true,
    components: {TopNotifications},
    head: {
        meta: [{hid: "description", name: "description", content: "Automate your Strava activities! Strautomator is like IFTTT, but for Strava."}]
    },
    data() {
        return {
            activeNavBtn: this.$route.path || null,
            logoutDialog: false
        }
    },
    mounted() {
        if (!this.$store.state?.user) {
            const errTitle = "User not found"
            document.location.href = `/error?status=401&title=${encodeURIComponent(errTitle)}`
        }
    },
    methods: {
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
