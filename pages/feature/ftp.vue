<template>
    <v-main fluid>
        <div class="stripe"></div>
        <div class="py-2"></div>

        <v-container class="text-center" fluid>
            <div class="home-wrapper">
                <h1 class="font-weight-light mt-1 mb-2" :class="$breakpoint.mdAndUp ? 'display-1' : 'headline'">
                    Auto update your Strava FTP
                </h1>
                <div>with</div>
                <h2 class="display-2 font-weight-bold mb-4">Strautomator</h2>

                <v-card color="black" class="mb-4 home-panel">
                    <v-card-text>
                        <div class="text-left">
                            <p>Strautomator can estimate and update the Functional Threshold Power setting on your Strava account, based on your most intensive efforts for the past few weeks.</p>

                            <h2 class="mb-2">How does it estimate my FTP?</h2>
                            <div class="mb-8">
                                <v-alert class="font-weight-bold">eFTP = (C<sup>+20%</sup> + H) / 2</v-alert>
                                <ul class="mt-n1 ml-n2">
                                    <li>C = current FTP on Strava, weighted to 120%</li>
                                    <li>H = estimated FTP for your highest power effort during the past {{ $store.state.ftpWeeks }} weeks</li>
                                </ul>
                                <div class="mt-4 mb-2">For each recent activity, Strautomator will derive a FTP estimation based on well known formulas, depending on the activity's total time.</div>
                                <ul class="ml-n2">
                                    <li>95% to 100% of the average power if betwen 20 minutes and 1 hour</li>
                                    <li>102.5% of the average power for each extra hour after the first hour</li>
                                </ul>
                                <div class="mt-4 mb-2">Examples:</div>
                                <ul class="ml-n2">
                                    <li>200W for 20 minutes, FTP = 190W</li>
                                    <li>200W for 1 hour, FTP = 200W</li>
                                    <li>200W for 4 hours, FTP = 215W</li>
                                </ul>
                            </div>

                            <h2 class="mt-4 mb-2">How can I enable the feature?</h2>
                            <v-img class="mb-2" src="/images/feature/ftp-auto-update.png"></v-img>
                            <div class="mb-8">
                                <ul class="ml-n2">
                                    <li>Go to My Account</li>
                                    <li>Toggle the "FTP auto update" on</li>
                                    <li>Your FTP will be automatically updated every week (on Wednesdays)</li>
                                </ul>
                                <div class="mt-4">
                                    The FTP auto update is available to PRO accounts only. Users with a free account can still estimate and save their FTP to Strava manually, by using the "What's my estimated FTP" button.
                                </div>
                            </div>

                            <h2 class="mb-2">How accurate is the estimation?</h2>
                            <div class="mb-2">
                                The calculation of the FTP based on the activity power and time is using well known formulas.
                            </div>
                            <div class="mb-2">
                                The final estimation of your FTP is quite conservative, as it gives more weight to your current FTP set on Strava. So if you're taking it easy on the bike for some weeks, it won't drastically underestimate your current
                                threshold.
                            </div>
                        </div>
                    </v-card-text>
                </v-card>

                <div class="mt-6 mb-2">
                    <div v-if="$store.state.user">
                        <v-btn color="primary" to="/account" title="My Account" rounded nuxt>
                            <v-icon left>mdi-link</v-icon>
                            Go to My Account
                        </v-btn>
                    </div>
                    <div v-else>
                        <a title="Connect with Strava..." @click="login()"><img class="strava-connect" src="/images/strava-connect.svg"/></a>
                    </div>
                </div>

                <feature-links />
            </div>
        </v-container>
    </v-main>
</template>

<script>
import FeatureLinks from "~/components/FeatureLinks.vue"

export default {
    layout: "landing",
    components: {FeatureLinks},
    head() {
        return {
            title: "Auto update your Strava FTP"
        }
    },
    methods: {
        login() {
            this.$login()
        }
    }
}
</script>
