<template>
    <v-layout column>
        <v-container fluid>
            <div class="mt-4 mb-8 text-center display-3 font-weight-black">Thank you!</div>
            <v-card>
                <v-card-text>
                    <p>Hi {{ user.profile.firstName }}!</p>
                    <p>Your support is truly appreciated! It gives me not only the financial help to keep Strautomator running, but also the recognition and the motivation I need to keep bringing all the cool features you might ask.</p>
                    <v-alert v-if="$route.query.fixed" color="accent" border="top">
                        Seems like you had a previous subscription that was not reflected on the database. The system will automagically fix it and your account should be switched to PRO within the next few minutes.
                    </v-alert>
                    <p v-else>Your account will be switched to PRO automatically within the next few minutes.</p>
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
            title: "Thank you"
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
