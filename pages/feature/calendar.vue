<template>
    <v-main fluid>
        <div class="stripe"></div>
        <div class="py-2"></div>

        <v-container class="text-center" fluid>
            <div class="home-wrapper">
                <h1 class="font-weight-light mt-1 mb-2" :class="$breakpoint.mdAndUp ? 'display-1' : 'headline'">
                    Export your Strava calendar
                </h1>
                <div>with</div>
                <h2 class="display-2 font-weight-bold mb-4">Strautomator</h2>

                <v-card color="black" class="mb-4 home-panel">
                    <v-card-text>
                        <p>
                            Details coming soon...
                        </p>
                    </v-card-text>
                </v-card>

                <div class="mt-6 mb-2">
                    <div v-if="$store.state.user">
                        <v-btn color="primary" to="/calendar" title="Calendar" rounded nuxt>
                            <v-icon left>mdi-link</v-icon>
                            Go to My Calendar
                        </v-btn>
                    </div>
                    <div v-else>
                        <a title="Connect with Strava..." @click="login()"><img class="strava-connect" src="/images/strava-connect.svg"/></a>
                    </div>
                </div>
            </div>
        </v-container>
    </v-main>
</template>

<script>
export default {
    layout: "landing",
    head() {
        return {
            title: "Export your Strava calendar"
        }
    },
    methods: {
        login() {
            this.$login()
        }
    }
}
</script>
