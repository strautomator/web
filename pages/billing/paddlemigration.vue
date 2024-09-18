<template>
    <v-layout column>
        <v-container fluid>
            <h1>{{ migrated ? "Migration finished" : "Migration to Paddle" }}</h1>

            <div v-if="!user.isPro">
                <v-card outlined>
                    <v-card-text>
                        <h3 class="mb-2">You don't have an active PRO subscription.</h3>
                        <div>The migration from PayPal to Paddle.com is available for current subscribers only.</div>
                        <div class="mt-4 text-center text-md-left">
                            <v-btn color="primary" to="/account" title="Back to my account" outlined rounded small nuxt>
                                <v-icon left>mdi-arrow-left</v-icon>
                                Back to my account
                            </v-btn>
                        </div>
                    </v-card-text>
                </v-card>
            </div>

            <div v-else>
                <template v-if="loading">
                    <v-progress-circular size="32" width="2" v-if="loading" indeterminate></v-progress-circular>
                    <span class="ml-4">Fetching subscription details...</span>
                </template>
                <p v-else-if="subscription?.source != 'paypal'">Your existing PRO subscription was not paid via PayPal, so you don't need to migrate to Paddle.</p>

                <div v-else-if="migrated">
                    <p class="mt-4 mb-6">The migration process from PayPal to Paddle has finished! Please check your email for the confirmation invoice.</p>
                    <p>
                        Future payments will now be handled exclusively via Paddle. <span v-if="refundAmount > 0">We have issued a refund of {{ refundAmount }} on your previous PayPal subscription.</span>
                    </p>

                    <p v-if="errorMessage">{{ errorMessage }}</p>
                    <div class="mt-4 text-center text-md-left">
                        <v-btn color="primary" to="/account" title="Back to my account" small rounded outlined nuxt>
                            <v-icon left>mdi-arrow-left</v-icon>
                            Back to my account
                        </v-btn>
                    </div>
                </div>

                <div v-else>
                    <p class="mt-4 mb-6">We welcome all users who have subscribed using PayPal to migrate their PRO subscriptions to <a href="https://paddle.com" title="Paddle.com" target="paddle">Paddle.com</a>.</p>
                    <h4 class="mb-1 text-md-h6">Why is Strautomator switching to Paddle?</h4>
                    <p>
                        Paddle is a well established billing platform that supports more payment methods compared to PayPal. Additionally, they act as a Merchant of Record for Strautomator, so they'll take care of all billing and payment related
                        tasks, including tax and compliance.
                    </p>

                    <h4 class="mb-1 text-md-h6">What happens if I don't migrate?</h4>
                    <p>Existing PayPal subscriptions will still be billed and valid up until Tuesday, December 31st, 2025. After that date, all existing PayPal subscriptions will be cancelled, and affected accounts will be switched back to Free.</p>

                    <h4 class="mb-1 text-md-h6">What is the migration process?</h4>
                    <p>
                        First, you'll need to proceed and subscribe again using the new Paddle checkout process. Once your new subscription is activated, your previous PayPal subscription will be automatically cancelled. If your last PayPal payment
                        was made in the last 180 days, you will get a partial refund for the remaining days. So for example if you paid 7.99 {{ currency }} 3 months ago, you will get a refund of around 5.69 {{ currency }}.
                    </p>
                    <p v-if="discountId">
                        As a courtesy, the first 1000 users to migrate are eligible for a discount, so the subscription price will be cheaper compared to their existing subscription price with PayPal. The discount codes will be automatically applied
                        to the checkout, and are valid until December 31st, 2024.
                    </p>

                    <h4 class="mb-1 text-md-h6">Ready?</h4>
                    <div>
                        <v-checkbox class="ml-n1" v-model="termsAgree" label="I agree with the migration steps" dense />
                    </div>
                    <div class="pt-2 text-center text-md-left">
                        <v-btn color="primary" title="Subscribe via Paddle" @click="paddleCheckout()" :disabled="!termsAgree" :x-large="$breakpoint.mdAndUp" rounded nuxt>
                            <v-icon left>mdi-database-import-outline</v-icon>
                            Start migration
                        </v-btn>
                    </div>
                </div>
            </div>
        </v-container>
    </v-layout>
</template>

<script>
import _ from "lodash"
import subscriptionMixin from "~/mixins/subscriptionMixin.js"
import userMixin from "~/mixins/userMixin.js"

export default {
    authenticated: true,
    mixins: [subscriptionMixin, userMixin],
    head() {
        return {
            title: "Billing"
        }
    },
    data() {
        return {
            loading: true,
            subscription: null,
            paddleTransactionId: null,
            termsAgree: false,
            migrated: false,
            discountId: null,
            errorMessage: null,
            refundAmount: 0
        }
    },
    async fetch() {
        try {
            if (this.user.isPro) {
                this.loading = true
                const subscription = await this.$axios.$get(`/api/users/${this.user.id}/subscription`)
                this.loading = false
                this.subscription = subscription
            }
        } catch (ex) {
            this.$webError(this, "PaddleMigration.fetch", ex)
        }

        this.loading = false
    },
    mounted() {
        if (!window.paddleHasLoaded) {
            Paddle.Initialize({token: this.$store.state.paddle.token, eventCallback: this.paddleCallback})
            if (this.$store.state.paddle.environment == "sandbox") {
                Paddle.Environment.set("sandbox")
            }
            window.paddleHasLoaded = true
        }
        if (this.$route.query.d && this.$route.query.d != "x") {
            this.discountId = this.$route.query.d
        }
    },
    methods: {
        async paddleCheckout() {
            try {
                const checkout = {
                    settings: {
                        allowLogout: false,
                        displayMode: "overlay",
                        theme: "dark"
                    }
                }

                if (this.user.paddleTransactionId) {
                    checkout.transactionId = this.user.paddleTransactionId
                } else {
                    checkout.customData = {userId: this.user.id, paypalMigration: this.user.subscriptionId}
                    checkout.items = [{quantity: 1, priceId: this.$store.state.paddle.priceId}]
                    if (this.user.paddleId) {
                        checkout.customer = {id: this.user.paddleId}
                    } else if (this.user.email) {
                        checkout.customer = {email: this.user.email}
                    }
                }

                if (this.discountId) {
                    checkout.discountId = this.discountId
                }

                Paddle.Checkout.open(checkout)
            } catch (ex) {
                Paddle.Checkout.close()
                ex.title = "Could not start the checkout process"
                this.$webError(this, "PaddleMigration.paddleCheckout", ex)
            }
        },
        async paddleCallback(ev) {
            try {
                if (ev.name == "checkout.customer.created" && ev.data?.customer?.id) {
                    await this.$axios.$post(`/api/paddle/${this.user.id}/customer?migration=1`, {id: ev.data.customer.id, email: ev.data.customer.email, transactionId: ev.data.transaction_id})
                    this.$store.commit("setUserData", {paddleId: ev.data.customer.id, paddleTransactionId: ev.data.transaction_id})
                    this.paddleTransactionId = ev.data.transaction_id
                } else if (ev.name == "checkout.completed") {
                    this.$store.commit("setUserData", {paddleTransactionId: null})
                    await this.cancelPayPal()
                    this.migrated = true
                    Paddle.Checkout.close()
                }
            } catch (ex) {
                this.errorMessage = "If you need any support, please contact us via email at info@strautomator.com."
            }
        },
        async cancelPayPal() {
            try {
                Paddle.Spinner.show()
                const res = await this.$axios.$post(`/api/paypal/${this.user.id}/paddlemigration`, {paddleTransactionId: this.paddleTransactionId})
                this.refundAmount = res.refundAmount
            } catch (ex) {
                this.errorMessage = "We have requested the cancellation of your PayPal subscription, and it should be processed in the next 48 hours."
            }

            Paddle.Spinner.hide()
        }
    }
}
</script>
