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
                <v-btn to="/account" router nuxt>Account</v-btn>
                <v-btn to="/help" router nuxt>Help</v-btn>
            </v-toolbar-items>
            <v-spacer></v-spacer>
            <v-avatar v-if="$store.state.user && $store.state.user.profile.urlAvatar" :size="$breakpoint.mdAndUp ? 48 : 32">
                <img :src="$store.state.user.profile.urlAvatar" />
            </v-avatar>
            <v-btn color="info" class="ml-1" :class="{'mr-n2': $breakpoint.smAndDown}" to="/logout" title="Logout" @click="logout" rounded text router nuxt>
                <v-icon>mdi-logout</v-icon>
                <span v-if="!$breakpoint.smAndDown" class="hidden-sm-and-down caption">Logout</span>
            </v-btn>
        </v-app-bar>
        <v-content>
            <v-container class="width-wrapper" fluid>
                <nuxt />
            </v-container>

            <div class="mt-4 mt-md-8 text-center">
                <v-divider class="mb-8 width-wrapper"></v-divider>
                <div class="mb-6">
                    <img src="/images/strava-powered.svg" width="130" />
                </div>
                <v-chip color="accent" class="caption mb-3 mb-md-1 mr-md-2">BETA</v-chip>
                <div class="d-md-inline">
                    Found a bug? Have suggestions?
                </div>
                <div class="d-md-inline">
                    <a href="mailto:info@strautomator.com" title="Send your feedback!">info@strautomator.com</a>
                    or
                    <a href="https://twitter.com/strautomator" title="Strautomator @ Twitter">@strautomator</a>
                </div>
                <div class="copyright">
                    <img src="/images/logo-round.svg" width="24" height="24" class="strautologo" />
                    <span>Strautomator - Made in Berlin</span>
                </div>
            </div>
        </v-content>
        <v-bottom-navigation class="hidden-md-and-up" color="primary" v-model="activeNavBtn" app grow>
            <v-btn to="/dashboard" router nuxt>
                <span>Dashboard</span>
                <v-icon>mdi-home</v-icon>
            </v-btn>
            <v-btn to="/automations" router nuxt>
                <span>Automations</span>
                <v-icon>mdi-file-tree</v-icon>
            </v-btn>
            <v-btn to="/account" router nuxt>
                <span>Account</span>
                <v-icon>mdi-account</v-icon>
            </v-btn>
            <v-btn to="/help" router nuxt>
                <span>Help</span>
                <v-icon>mdi-help</v-icon>
            </v-btn>
        </v-bottom-navigation>
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
            activeNavBtn: null
        }
    },
    methods: {
        logout() {
            this.$logout()
        }
    }
}
</script>
