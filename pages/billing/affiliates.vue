<template>
    <v-layout column>
        <v-container v-if="subscriptionSource && subscriptionSource != 'github' && subscriptionSource != 'paypal'" fluid>
            <v-card>
                <v-card-text class="text-center">
                    <p>Thanks for participating! You already registered with our {{ startCase(subscriptionSource) }} affiliate link.</p>
                    <img :src="'/images/affiliates/' + subscriptionSource + '-logo.png'" width="64" height="64" class="mt-2" />
                </v-card-text>
            </v-card>
            <div class="mt-6 text-center">
                <v-btn color="primary" to="/account" rounded nuxt>
                    <v-icon left>mdi-arrow-left</v-icon>
                    Back to my account
                </v-btn>
            </div>
        </v-container>
        <v-container v-else fluid>
            <h1>1 year of PRO, free?</h1>
            <p>
                Want to try Strautomator's PRO features, but not really convinced you should spend money on a yearly subscription yet? You can get the first year for free, by using my referral code to register to one of my affiliated fintech
                services. These are services that I personally use on a daily basis. Here's how it works:
            </p>
            <ul class="ml-n2">
                <li>You register using my referral link</li>
                <li>Complete the listed referral steps</li>
                <li>Send me your Strava ID via <a href="mailto:info@strautomator.com" title="Email">email</a></li>
            </ul>
            <p class="mt-4">Once everything is confirmed, your account will be switched to PRO. After 1 year, if you still wish to keep using PRO features, you'll need to subscribe via PayPal or GitHub.</p>

            <v-card v-if="revolut" class="mt-5" outlined>
                <v-card-title class="accent text-center text-md-left">
                    <img src="/images/affiliates/revolut.png" alt="Revolut" class="mx-auto mx-md-0 card-affiliate-logo" />
                </v-card-title>
                <v-card-text>
                    <div class="mt-3 mb-1">
                        <p>Revolut is an online bank with more than 30 million customers worldwide. It has all the features and financial services that you could possibly imagine, even on their free account.</p>
                        <ul class="ml-n2">
                            <li>Open your Revolut account with my link</li>
                            <li>Add money to your new account</li>
                            <li>Request a physical Revolut card</li>
                            <li>Make at least 3 purchases of 5+ EUR</li>
                        </ul>
                        <div class="mt-5 text-center text-md-left">
                            <a href="https://links.devv.com/l/revolut" title="Go to Revolut" target="revolut"><v-btn color="primary" rounded nuxt>Go to Revolut</v-btn></a>
                        </div>
                    </div>
                </v-card-text>
            </v-card>

            <v-card class="mt-5" outlined>
                <v-card-title class="accent text-center text-md-left">
                    <img src="/images/affiliates/n26.png" alt="N26" class="mx-auto mx-md-0 card-affiliate-logo" />
                </v-card-title>
                <v-card-text>
                    <div class="mt-3 mb-1">
                        <p>N26 is an online bank with more than 8 million customers worldwide. The free account offers all the basics, but if you want more features and added insurance, you can opt for one of their paid plans.</p>
                        <ul class="ml-n2">
                            <li>Open your N26 account with my link</li>
                            <li>Make at least 1 purchase of 10+ EUR</li>
                        </ul>
                        <div class="mt-5 text-center text-md-left">
                            <a href="https://links.devv.com/l/n26" title="Go to N26" target="n26"><v-btn color="primary" rounded nuxt>Go to N26</v-btn></a>
                        </div>
                    </div>
                </v-card-text>
            </v-card>

            <v-card class="mt-5" outlined>
                <v-card-title class="accent text-center text-md-left">
                    <img src="/images/affiliates/traderepublic.png" alt="Trade Republic" class="mx-auto mx-md-0 card-affiliate-logo" />
                </v-card-title>
                <v-card-text>
                    <div class="mt-3 mb-1">
                        <p>Trade Republic is an online broker with more than 4 million customers in the EU. Commission-free trading for 1 EUR only, and up to 1% savings cashback using their new VISA card.</p>
                        <p>Required steps:</p>
                        <ul class="ml-n2">
                            <li>Open your account with my link</li>
                            <li>Start investing within 21 days</li>
                        </ul>
                        <div class="mt-5 text-center text-md-left">
                            <a href="https://links.devv.com/l/traderepublic" title="Go to Trade Republic" target="traderepublic"><v-btn color="primary" rounded nuxt>Go to Trade Republic</v-btn></a>
                        </div>
                    </div>
                </v-card-text>
            </v-card>

            <v-card class="mt-5" outlined>
                <v-card-title class="accent text-center text-md-left">
                    <img src="/images/affiliates/scalable.png" alt="Scalable Capital" class="mx-auto mx-md-0 card-affiliate-logo" />
                </v-card-title>
                <v-card-text>
                    <div class="mt-3 mb-1">
                        <p>Scalable Capital is an innovative online broker with more than 600k clients. Commission-free trading, automated investing and smart wealth management services.</p>
                        <p>Required steps:</p>
                        <ul class="ml-n2">
                            <li>Open your account with my link</li>
                            <li>Trade at least 250+ EUR within 30 days</li>
                        </ul>
                        <div class="mt-5 text-center text-md-left">
                            <a href="https://links.devv.com/l/scalable" title="Go to Scalable Capital" target="scalable"><v-btn color="primary" rounded nuxt>Go to Scalable Capital</v-btn></a>
                        </div>
                    </div>
                </v-card-text>
            </v-card>

            <v-alert border="top" color="mt-5 accent">
                Please note that you <strong>must</strong> use the buttons above to open the correct referral links. If you register to any of these fintech services separately by going directly to their website, they will not be able to identify the
                referral code.
            </v-alert>
        </v-container>
        <v-container v-else fluid>
            <v-card>
                <v-card-text>
                    <p class="text-center mb-0">The "Lifetime PRO with Revolut" campaign is currently not running. If you want a PRO account, please subscribe via PayPal or GitHub.</p>
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
            title: "Subscription via affiliates"
        }
    },
    data() {
        const country = this.$store.state.country || "us"

        return {
            revolut: true,
            n26: ["at", "be", "de", "es", "fi", "fr", "gr", "ie", "it", "is", "li", "lv", "lt", "nl", "no", "pl", "pt", "se", "si", "sk"].includes(country),
            scalable: ["at", "de", "es", "fr", "it", "nl"].includes(country),
            tradeRepublic: ["at", "be", "de", "es", "fr", "it", "pt"].includes(country)
        }
    },
    computed: {
        subscriptionSource() {
            if (this.user.isPro && this.subscription) {
                return this.subscription.source
            }
            return null
        }
    },
    methods: {
        startCase(value) {
            return _.startCase(value)
        }
    }
}
</script>
