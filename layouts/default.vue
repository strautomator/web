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
                <v-btn to="/gear" router nuxt>Gear <v-icon class="ml-1">mdi-new-box</v-icon></v-btn>
                <v-btn to="/account" router nuxt>Account</v-btn>
                <v-btn to="/help" router nuxt>Help</v-btn>
            </v-toolbar-items>
            <v-spacer></v-spacer>
            <v-avatar v-if="$store.state.user && $store.state.user.profile.urlAvatar" :size="$breakpoint.mdAndUp ? 48 : 32">
                <img :src="$store.state.user.profile.urlAvatar" />
            </v-avatar>
            <v-btn color="info" class="ml-1 mr-n3 mr-md-0" title="Logout" @click="showLogoutDialog" rounded text router nuxt>
                <v-icon>mdi-logout</v-icon>
                <span v-if="!$breakpoint.smAndDown" class="hidden-sm-and-down caption">Logout</span>
            </v-btn>
        </v-app-bar>
        <v-main>
            <v-container class="width-wrapper" fluid>
                <nuxt />
            </v-container>

            <div class="mt-3 mt-md-8 text-center">
                <v-divider class="mb-8 width-wrapper"></v-divider>
                <div class="mb-6">
                    <img src="/images/strava-powered.svg" width="130" />
                </div>
                <div>
                    <n-link to="/help" title="Need help?"><v-icon>mdi-help-circle</v-icon></n-link>
                    <a href="https://github.com/strautomator" title="Strautomator @ GitHub"><v-icon class="ml-4 ml-md-3">mdi-github</v-icon></a>
                    <a href="https://twitter.com/strautomator" title="Strautomator @ Twitter"><v-icon class="ml-4 ml-md-3">mdi-twitter</v-icon></a>
                </div>
                <div class="copyright">
                    <span>Strautomator.com</span>
                    <v-chip v-if="$store.state.user && $store.state.user.isPro" color="primary" class="caption mb-1 ml-1">PRO</v-chip>
                </div>
            </div>
        </v-main>
        <v-bottom-navigation class="hidden-md-and-up" color="primary" :value="activeNavBtn" app grow>
            <v-btn value="/dashboard" to="/dashboard" router nuxt>
                <span>Dashboard</span>
                <v-icon>mdi-home</v-icon>
            </v-btn>
            <v-btn value="/automations" to="/automations" router nuxt>
                <span>Automations</span>
                <v-icon>mdi-file-tree</v-icon>
            </v-btn>
            <v-btn value="/gear" to="/gear" router nuxt>
                <span>Gear (NEW)</span>
                <v-icon>mdi-cog-refresh</v-icon>
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

        <v-dialog v-model="logoutDialog" max-width="440" overlay-opacity="0.94">
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
                    <p class="mt-3">
                        Do you want to logout from Strautomator?
                    </p>
                    <p>To log back in please use the <strong>Connect with Strava</strong> button again on the homepage.</p>
                    <div class="text-right">
                        <v-spacer></v-spacer>
                        <v-btn class="mr-1" color="grey" title="Stay here" @click.stop="hideLogoutDialog" text rounded>Cancel</v-btn>
                        <v-btn color="removal" title="Yes, logout" @click="logout" rounded>Logout</v-btn>
                    </div>
                </v-card-text>
            </v-card>
        </v-dialog>
    </v-app>
</template>

<script>
export default {
    authenticated: true,
    head: {
        meta: [{hid: "description", name: "description", content: "Automate your Strava activities! Strautomator is like IFTTT, but for Strava."}]
    },
    data() {
        return {
            activeNavBtn: this.$route.path || null,
            logoutDialog: false
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
