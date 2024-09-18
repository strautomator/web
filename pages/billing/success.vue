<template>
    <v-layout column>
        <v-container fluid>
            <div class="mt-4 mb-8 text-center display-3 font-weight-black">Thank you!</div>
            <v-card>
                <v-card-text>
                    <p>Hi {{ user.profile.firstName }}!</p>
                    <p>Your support is truly appreciated! Your account will be switched to PRO automatically in a few minutes.</p>
                </v-card-text>
            </v-card>
            <div class="mt-8 text-center">
                <v-btn color="primary" to="/account" title="Back to my account" rounded nuxt>Back to my account</v-btn>
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
        setTimeout(reload, 4000)
    }
}
</script>
