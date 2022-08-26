<template>
    <v-layout column>
        <v-container v-if="loading" fluid>
            <div class="text-center">
                <v-progress-circular class="mr-1 mt-n1" size="16" width="2" indeterminate></v-progress-circular>
            </div>
        </v-container>
        <v-container v-else-if="subscriptionSource == 'revoluta'" fluid>
            <v-card>
                <v-card-text class="text-center">
                    <p>Thanks for participating! You already have a lifetime PRO account ☺</p>
                    <img src="/images/affiliates/revolut-logo.png" width="64" height="64" class="mt-2" />
                </v-card-text>
            </v-card>
            <div class="mt-6 text-center">
                <v-btn color="primary" to="/account" rounded nuxt>
                    <v-icon left>mdi-arrow-left</v-icon>
                    Back to my account
                </v-btn>
            </div>
        </v-container>
        <v-container v-else-if="available" fluid>
            <div class="mt-4 mb-8 text-center display-2 font-weight-black">Lifetime PRO, with Revolut!</div>
            <v-card>
                <v-card-text>
                    <p>Hi {{ user.profile.firstName }}!</p>
                    <p>
                        Do you know Revolut? One app, all things money, in their words. In my words, it's one of the most innovative neobanks out there. Revolut is available in more than 35 countries worldwide, and it's possibly the most
                        feature-complete bank in most of these countries.
                    </p>

                    <p>
                        Every now and then they run affiliate campaigns, and I'm taking the opportunity to offer a free lifetime PRO subscription to people who sign up to Revolut using my
                        <a href="https://links.devv.com/l/revolut" title="Sign up to Revolut" target="revolut">affiliate link</a>.
                    </p>
                    <p>
                        To be eligible, you'll need to complete these steps by <strong>{{ $dayjs(dateEnd).format("lll") }}</strong>
                    </p>
                    <ul class="ml-n2">
                        <li class="font-weight-bold">Sign up to Revolut with our link</li>
                        <li>Verify your identity with Revolut</li>
                        <li>Add money to your new account</li>
                        <li>Request a physical Revolut card</li>
                        <li>Complete at least 3x 5 EUR+ purchases</li>
                    </ul>
                    <p class="mt-3">
                        If you sign up using the same email you have registered in Strautomator, the upgrade to PRO should happen automatically after a few days. Otherwise please send your full name or email to
                        <a href="mailto:info@strautomator.com">info@strautomator.com</a>, and I'll manually active your PRO subscription.
                    </p>
                    <p>Eligible users who complete the steps will have their lifetime PRO activated by {{ $dayjs(dateSwitch).format("ll") }} at the latest, including the last step.</p>

                    <div class="mt-5 text-center text-md-left">
                        <a href="https://links.devv.com/l/revolut" title="Sign up to Revolut" target="revolut"
                            ><v-btn color="primary" rounded nuxt>
                                <v-img src="/images/affiliates/revolut-logo.png" width="16" height="16" class="mr-2" />
                                Sign up to Revolut
                            </v-btn></a
                        >
                    </div>

                    <v-alert class="mt-6 text-caption" color="accent">
                        <div class="mb-4" v-if="subscriptionSource == 'paypal'">
                            You already have a PRO subscription via PayPal.
                            <br v-if="$breakpoint.mdAndUp" />
                            If you participate in this campaign, your PayPal subscription will be cancelled so no future payments are needed.
                        </div>
                        Please note that Revolut has no direct affiliation to Strautomator!
                        <br v-if="$breakpoint.mdAndUp" />
                        For more details about the "Lifetime PRO with Revolut" campaign, please check the <n-link to="/help?q=revolut" nuxt>help</n-link> section.
                    </v-alert>

                    <div class="mt-4">
                        <free-pro-table :no-price="true" />
                    </div>
                </v-card-text>
            </v-card>
        </v-container>
        <v-container v-else fluid>
            <v-card>
                <v-card-text>
                    <p class="text-center">The "Lifetime PRO with Revolut" campaign is currently not running. If you want a PRO account, please subscribe via PayPal or GitHub.</p>
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
import FreeProTable from "~/components/FreeProTable.vue"
import userMixin from "~/mixins/userMixin.js"

export default {
    authenticated: true,
    components: {FreeProTable},
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
    computed: {
        subscriptionSource() {
            if (this.user.isPro && this.user.subscription) {
                return this.user.subscription.source
            }
            return null
        }
    },
    async fetch() {
        try {
            const announcements = await this.$axios.$get(`/api/announcements/${this.user.id}/active`)

            for (let a of announcements) {
                if (a.id == "revolut-pro") {
                    this.available = true
                    this.dateEnd = a.dateExpiry
                    this.dateSwitch = this.$dayjs(a.dateExpiry).add(9, "days")
                }
            }

            this.loading = false
        } catch (ex) {
            this.$webError("Revolut.fetch", ex)
        }

        this.loading = false
    }
}
</script>
