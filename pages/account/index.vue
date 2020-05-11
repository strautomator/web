<template>
    <v-layout column>
        <v-container fluid>
            <h1>Account</h1>
            <div class="text-center text-md-left">
                <div class="mt-3">{{ user.profile.firstName }} {{ user.profile.lastName }}</div>
                <div>Account ID {{ user.id }}</div>
                <div>Registered on {{ dateRegistered }}</div>
                <div>Units: {{ user.profile.units }}</div>
                <p class="mt-3 caption">
                    <a :href="stravaProfileUrl" target="strava" title="Go to my profile on Strava..."><v-icon color="primary" small>mdi-open-in-new</v-icon> Open my Strava profile... </a>
                </p>
            </div>
            <h3 class="mt-5 mb-3">Account status: PRO (beta) account</h3>
            <free-pro-table />
            <div class="mt-4 text-center text-md-left">
                <v-btn color="red" title="Time to say goodbye?" to="/account/goodbye" outlined rounded nuxt>Close my account</v-btn>
                <v-btn color="primary" class="ml-2" to="/donate" title="Donate and become a PRO!" rounded nuxt>Donate now</v-btn>
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
import FreeProTable from "~/components/FreeProTable.vue"
import userMixin from "~/mixins/userMixin.js"

export default {
    authenticated: true,
    components: {
        FreeProTable
    },
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
    }
}
</script>
