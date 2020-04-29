<template>
    <v-layout column>
        <v-container fluid>
            <h1>Account</h1>
            <div class="text-center text-md-left">
                <div class="mt-3">{{ user.profile.firstName }} {{ user.profile.lastName }}</div>
                <div>Account ID {{ user.id }}</div>
                <div>Registered on {{ dateRegistered }}</div>
                <p class="mt-3 caption">
                    <a :href="stravaProfileUrl" target="strava" title="Go to my profile on Strava..."><v-icon color="primary" small>mdi-open-in-new</v-icon> Open my Strava profile... </a>
                </p>
            </div>

            <h3 class="mt-5 mb-3">Current subscription: Pro (beta) account</h3>

            <v-simple-table>
                <thead>
                    <tr>
                        <th>Features</th>
                        <th class="text-center">FREE</ht>
                        <th class="text-center">PRO</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Automations</td>
                        <td class="text-center">2</td>
                        <td class="text-center">Unlimited</td>
                    </tr>
                    <tr>
                        <td>Conditions</td>
                        <td class="text-center">2</td>
                        <td class="text-center">Unlimited</td>
                    </tr>
                    <tr>
                        <td>All features</td>
                        <td class="text-center"><v-icon>mdi-checkbox-blank-circle-outline</v-icon></td>
                        <td class="text-center"><v-icon>mdi-checkbox-marked-circle-outline</v-icon></td>
                    </tr>
                    <tr>
                        <td>No Links</td>
                        <td class="text-center"><v-icon>mdi-checkbox-blank-circle-outline</v-icon></td>
                        <td class="text-center"><v-icon>mdi-checkbox-marked-circle-outline</v-icon></td>
                    </tr>
                    <tr>
                        <td>Cost / year</td>
                        <td class="text-center">Free</td>
                        <td class="text-center">-</td>
                    </tr>
                </tbody>
            </v-simple-table>
            <div class="mt-5 text-center text-md-left">
                <v-btn color="primary" to="/billing" title="Become a Pro!" disabled large rounded nuxt>PRO COMING SOON</v-btn>
            </div>
            <ul class="caption mt-5 pl-4">
                <li>While we're in beta, everyone is Pro <v-icon x-small>mdi-emoticon-outline</v-icon></li>
                <li class="beta">Free accounts can have only 2 conditions per automation.</li>
                <li class="beta">Free accounts will have a link to Strautomator on the description of 20% of processed activities.</li>
            </ul>
            <div class="mt-4 text-center text-md-left">
                <v-btn color="info"  title="Logout from your account" @click="logout" outlined rounded>Logout</v-btn>
                <v-btn color="red" class="ml-2" title="Time to say goodbye?" to="/account/goodbye" outlined rounded nuxt>Close my account</v-btn>
            </div>
        </v-container>
    </v-layout>
</template>

<style>
.v-data-table tr {
    background: Transparent !important;
}
.beta {
    text-decoration: line-through;
}
</style>

<script>
import moment from "moment"
import userMixin from "~/mixins/userMixin.js"

export default {
    authenticated: true,
    mixins: [userMixin],
    head() {
        return {
            title: "Account"
        }
    },
    computed: {
        dateRegistered() {
            return moment(this.user.dateRegistered).format("LL")
        },
        stravaProfileUrl() {
            return `https://www.strava.com/athletes/${this.user.id}`
        }
    },
    methods: {
        logout() {
            this.$logout()
        }
    }
}
</script>
