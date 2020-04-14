<template>
    <v-app class="text-center">
        <v-app-bar fixed app>
            <v-toolbar-title class="mr-10 ml-1">
                <n-link to="/dashboard" nuxt router>
                    <v-icon color="amber" class="mr-2" large>mdi-bike-fast</v-icon>
                    Strautomator
                </n-link>
            </v-toolbar-title>

            <v-toolbar-items class="hidden-sm-and-down">
                <v-btn to="/automations" router nuxt>Automations</v-btn>
                <v-btn to="/account" router nuxt>Account</v-btn>
                <v-btn to="/help" router nuxt>Help</v-btn>
            </v-toolbar-items>
            <v-spacer></v-spacer>
            <v-avatar v-if="$store.state.oauth.user && $store.state.oauth.user.profile.urlAvatar" :size="$vuetify.breakpoint.mdAndUp ? 48 : 32">
                <img :src="$store.state.oauth.user.profile.urlAvatar" />
            </v-avatar>
            <v-btn color="amber lighten-4" class="ml-1" to="/logout" title="Logout" @click="logout" text router nuxt>
                <v-icon>mdi-logout</v-icon>
                <span v-if="!$vuetify.breakpoint.smAndDown" class="hidden-sm-and-down">Logout</span>
            </v-btn>
        </v-app-bar>
        <v-content>
            <v-container class="width-wrapper" fluid>
                <nuxt />
            </v-container>

            <div class="mt-4 mt-md-8 text-center">
                <v-divider class="mb-6 width-wrapper"></v-divider>
                <v-chip color="accent" class="caption mb-3 mb-md-1 mr-md-2">WE'RE STILL IN BETA</v-chip>
                <div class="d-md-inline">
                    Found a bug? Have suggestions?
                </div>
                <div class="d-md-inline">
                    <a href="mailto:info@strautomator.com" title="Send us your feedback!">info@strautomator.com</a>
                </div>
                <div class="mt-1 mb-8">&copy; {{ new Date().getFullYear() }} Strautomator - Made in Berlin</div>
            </div>
        </v-content>
        <v-bottom-navigation class="hidden-md-and-up" app grow>
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
    async asyncData({error, store}) {
        try {
            const user = store.state.oauth.user

            return {
                user: user
            }
        } catch (ex) {
            error({
                statusCode: 500,
                message: ex.toString()
            })
        }
    },
    methods: {
        logout() {
            this.$logout()
        }
    }
}
</script>
