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
                            <v-btn color="primary" to="/account" title="Back to my account" exact outlined rounded small nuxt>
                                <v-icon left>mdi-arrow-left</v-icon>
                                Back to My Account
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
                <template v-else-if="subscription?.source == 'paypal'">
                    <p>Your current PRO subscription was not paid via PayPal, so you don't need to migrate.</p>
                    <v-btn color="primary" to="/account" title="Back to my account" exact small rounded outlined nuxt>
                        <v-icon left>mdi-arrow-left</v-icon>
                        Back to My Account
                    </v-btn>
                </template>

                <div v-else-if="migrated">
                    <p class="mt-4 mb-6">The migration process from PayPal to Paddle has finished! Please check your email for the confirmation invoice.</p>
                    <p>
                        Future payments will now be handled exclusively via Paddle.
                        <span v-if="refundAmount">We have issued a refund of {{ refundAmount }} on your cancelled PayPal subscription.</span>
                    </p>

                    <p v-if="errorMessage">{{ errorMessage }}</p>
                    <div class="mt-4 text-center text-md-left">
                        <v-btn color="primary" to="/account" title="Back to my account" exact small rounded outlined nuxt>
                            <v-icon left>mdi-arrow-left</v-icon>
                            Back to My Account
                        </v-btn>
                    </div>
                </div>

                <div v-else>
                    <p class="mt-4 mb-6">We welcome all users who have subscribed using PayPal to migrate their PRO subscriptions to <a href="https://paddle.com/about" title="Paddle.com" target="paddle">Paddle.com</a>.</p>
                    <h4 class="mb-1 text-md-h6">Why is Strautomator switching to Paddle?</h4>
                    <p>Paddle is a well established billing platform that supports more payment methods compared to PayPal. Additionally, it acts as a Merchant of Record for Strautomator, taking care of all our billing and payment related tasks.</p>

                    <h4 class="mb-1 text-md-h6">Do I need to migrate?</h4>
                    <p>No, the PRO subscription migration from PayPal to Paddle is optional.</p>

                    <h4 class="mb-1 text-md-h6">What is the migration process?</h4>
                    <p>
                        First, you'll need to proceed and subscribe again using the new Paddle checkout process. Once your new subscription is activated, your previous PayPal subscription will be automatically cancelled. You'll then receive a partial
                        refund relative to the remaining time of your existing subscription, directly via PayPal.
                    </p>
                    <p>For the migration you have the option to keep doing yearly payments, or switch to a single-payment lifetime subscription.</p>
                    <v-alert class="accent" v-if="discountLifetime || discountYearly" outlined>
                        As a "thank you" we are offering a discount to a limited number of users that migrate from PayPal to Paddle.
                        <br />
                        Use code <strong class="primary--text">{{ discountLifetime || "PAYPAL10M" }}</strong> for the lifetime subscription or <strong class="primary--text">{{ discountYearly || "PAYPAL10M" }}</strong> for the yearly subscription at
                        checkout.
                    </v-alert>

                    <v-card outlined>
                        <v-card-text>
                            <p>
                                To start the migration, please select your desired subscription frequency below.<br />
                                The relevant discount codes, if any, will be applied automatically at checkout.
                            </p>

                            <div class="pt-2 text-center text-md-left">
                                <v-btn color="primary" title="Subscribe via Paddle" @click="paddleCheckout(false)" class="mb-4 mb-md-0 mr-md-2" rounded nuxt>
                                    <v-icon left>mdi-database-import-outline</v-icon>
                                    Yearly subscription
                                </v-btn>
                                <v-btn color="primary" title="Subscribe via Paddle" @click="paddleCheckout(true)" rounded nuxt>
                                    <v-icon left>mdi-database-import-outline</v-icon>
                                    Lifetime subscription
                                </v-btn>
                            </div>
                        </v-card-text>
                    </v-card>
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
            title: "Migration to Paddle"
        }
    },
    data() {
        return {
            loading: true,
            subscription: null,
            paddleTransactionId: null,
            migrated: false,
            discountLifetime: null,
            discountYearly: null,
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
        if (this.$route.query.dl) {
            this.discountLifetime = this.$route.query.dl
        }
        if (this.$route.query.dy) {
            this.discountYearly = this.$route.query.dy
        }
    },
    methods: {
        async paddleCheckout(lifetime) {
            try {
                const priceId = lifetime ? this.$store.state.paddle.priceId.lifetime : this.$store.state.paddle.priceId.yearly
                const checkout = {
                    settings: {
                        allowLogout: false,
                        showAddDiscounts: true,
                        displayMode: "overlay",
                        theme: "dark"
                    }
                }

                checkout.customData = {userId: this.user.id, paypalMigration: this.subscription.id}
                checkout.items = [{quantity: 1, priceId: priceId}]

                if (lifetime && this.discountLifetime) {
                    checkout.discountCode = this.discountLifetime
                } else if (this.discountYearly) {
                    checkout.discountCode = this.discountYearly
                }

                if (this.user.paddleId) {
                    checkout.customer = {id: this.user.paddleId}
                } else if (this.user.email) {
                    checkout.customer = {email: this.user.email}
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
                this.errorMessage = "We have requested the cancellation of your PayPal subscription, and it should be processed in the next 24 hours."
            }

            Paddle.Spinner.hide()
        }
    }
}
</script>
