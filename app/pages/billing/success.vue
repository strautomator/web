<template>
    <v-layout column>
        <v-container fluid>
            <div class="mt-4 mb-8 text-center display-3 font-weight-black">Thank you!</div>
            <v-card>
                <v-card-text>
                    <p>Hi {{ user.profile.firstName }}!</p>
                    <p v-if="this.$route.query.donation">Your support is truly appreciated! Your account will be switched to PRO automatically in a few minutes.</p>
                    <p v-else>Your donation is truly appreciated! Hope you are enjoying all the features that Strautomator has to offer.</p>
                </v-card-text>
            </v-card>
            <div class="mt-8 text-center">
                <v-btn color="primary" to="/account" title="Back to my account" exact rounded nuxt>
                    <v-icon left>mdi-arrow-left</v-icon>
                    Back to My Account
                </v-btn>
            </div>
        </v-container>
    </v-layout>
</template>

<script>
import userMixin from "~/mixins/userMixin.js"

export default {
    authenticated: true,
    mixins: [userMixin],
    head() {
        return {
            title: "Thank you!"
        }
    },
    mounted() {
        if (this.user?.paddleTransactionId) {
            this.$store.commit("setUserData", {paddleTransactionId: null})
        }

        const reload = () => (window.location.href = "/billing")
        setTimeout(reload, 5000)
    }
}
</script>
