<template>
    <v-layout column>
        <v-container fluid>
            <h1>{{ !accountDeleted ? "Close my account" : "Account deleted" }}</h1>
            <v-card>
                <v-card-text>
                    <div v-if="!accountDeleted">
                        <p>
                            We hope this was just a mistake, so to double check: are you sure?
                        </p>
                        <p>
                            Once you hit that button there's no way back, we'll delete your automations and the connection to your Strava account.
                        </p>
                        <div class="text-center mt-8">
                            <v-btn color="gray" class="mr-3" to="/account" title="Back to my account" text rounded nuxt>
                                <v-icon left>mdi-arrow-left</v-icon>
                                Back
                            </v-btn>
                            <v-btn color="red darken-3" @click="cancelAccount()" title="Goodbye :-(" rounded>
                                <v-icon left>mdi-close-circle</v-icon>
                                Close my account
                            </v-btn>
                        </div>
                    </div>
                    <div v-else>
                        <p class="title mb-2">
                            Sad to see you go &#x1F615;
                        </p>
                        <p>
                            If you change your mind in the future you can always come back and connect Strautomator to your Strava account again.
                        </p>
                        <p class="mt-12">
                            <n-link to="/home" title="Back to the homepage..." class="caption" nuxt>Back to the homepage...</n-link>
                        </p>
                    </div>
                </v-card-text>
            </v-card>
        </v-container>
    </v-layout>
</template>

<script>
export default {
    authenticated: true,
    head() {
        return {
            title: "Goodbye?"
        }
    },
    async asyncData({error, params, store}) {
        const now = new Date().getTime() / 1000

        return {
            now: now,
            accountDeleted: false
        }
    },
    methods: {
        async cancelAccount() {
            try {
                const userId = this.$store.state.user.id

                this.$axios.$delete(`/api/users/${userId}`)
                this.accountDeleted = true

                const logout = () => {
                    this.$logout()
                }
                setTimeout(logout, 20000)
            } catch (ex) {
                this.$webError("AccountGoodbye.cancelAccount", ex)
            }
        },
        confirmDeleted() {}
    }
}
</script>
