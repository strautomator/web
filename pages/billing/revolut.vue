<template>
    <v-layout column>
        <v-container v-if="available" fluid>
            <div class="mt-4 mb-8 text-center display-2 font-weight-black">Lifetime PRO, with Revolut!</div>
            <v-card>
                <v-card-text>
                    <p>Hi {{ user.profile.firstName }}!</p>
                    <p>
                        Do you know Revolut? One app, all things money, in their words. In my words, it's one of the most innovative neobanks out there. Every now and then they run affiliate campaigns, and I'm taking the opportunity to offer a free
                        lifetime PRO subscription to people who sign up to Revolut using my <a href="https://links.devv.com/l/revolut" title="Sign up to Revolut" target="revolut">affiliate link</a>.
                    </p>
                    <p>
                        To be eligible, you'll need to complete these steps by <strong>{{ $dayjs(dateEnd).format("lll") }}</strong>
                    </p>
                    <ul class="ml-n2">
                        <li>Sign up to Revolut and verify your ID</li>
                        <li>Add money to your new account</li>
                        <li>Request a physical Revolut card</li>
                        <li>Complete at least 3 purchases with your new physical or a virtual card</li>
                    </ul>
                    <p class="mt-3">
                        If you sign up using the same email you have registered in Strautomator, there are no extra steps, and your Strautomator account will be upgraded to PRO automatically. Otherwise please send your full name or email to
                        <a href="mailto:info@strautomator.com">info@strautomator.com</a>, and I'll manually active your PRO subscription within 48 hours.
                    </p>
                    <div class="mt-5 text-center text-md-left">
                        <a href="https://links.devv.com/l/revolut" title="Sign up to Revolut" target="revolut"
                            ><v-btn color="primary" rounded nuxt>
                                <v-img src="/images/affiliates/revolut-logo.png" width="16" height="16" class="mr-2" />
                                Sign up to Revolut
                            </v-btn></a
                        >
                    </div>
                </v-card-text>
            </v-card>
        </v-container>
        <v-container v-else fluid>
            <v-card>
                <v-card-text>
                    <p>The "Lifetime PRO, with Revolut" campaign is currently not running. But of course, you can still <a href="https://links.devv.com/l/revolut">open a Revolut account</a> if you wish to :-)</p>
                </v-card-text>
            </v-card>
            <div class="mt-6 text-center">
                <v-btn color="primary" to="/account" rounded nuxt>
                    <v-icon left>mdi-arrow-left</v-icon>
                    Back to my account
                </v-btn>
            </div>
        </v-container>
    </v-layout>
</template>

<script>
import _ from "lodash"
import userMixin from "~/mixins/userMixin.js"

export default {
    authenticated: true,
    mixins: [userMixin],
    head() {
        return {
            title: "Lifetime PRO, with Revolut"
        }
    },
    data() {
        return {
            loading: true,
            available: false,
            dateEnd: null,
            dateSwitch: null
        }
    },
    async fetch() {
        try {
            const announcements = await this.$axios.$get("/api/announcements/active")

            for (let a of announcements) {
                console.dir(a)
                if (a.id == "revolut-pro") {
                    this.available = true
                    this.dateEnd = a.dateExpiry
                    this.dateSwitch = this.$dayjs(a.dateExpiry).add(2, "days")
                }
            }
        } catch (ex) {
            this.$webError("Revolut.fetch", ex)
        }

        this.loading = false
    }
}
</script>
