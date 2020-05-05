<template>
    <v-layout column>
        <v-container fluid>
            <div class="mt-4 mb-8 text-center display-3 font-weight-black">Thank you!</div>
            <v-card>
                <v-card-text>
                    <p>Hi {{ user.profile.firstName }}!</p>
                    <p>
                        We truly appreciate your donation! Your support gives me not only the financial help to keep Strautomator running, but also the recognition and the motivation I need to keep it running and adding requested features!
                    </p>
                    <p>
                        Your account will be switched to PRO automatically within the next few minutes.
                    </p>
                </v-card-text>
            </v-card>
            <div class="mt-8 text-center">
                <v-btn color="primary" to="/account" rounded>Back to my account...</v-btn>
            </div>
        </v-container>
    </v-layout>
</template>

<style></style>

<script>
import userMixin from "~/mixins/userMixin.js"

export default {
    authenticated: true,
    mixins: [userMixin],
    head() {
        return {
            title: "Thank you"
        }
    }
}
</script>
