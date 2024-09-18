<template>
    <v-layout column>
        <v-container fluid>
            <div v-if="unsubscribed" class="mt-4 mb-8 text-center display-3 font-weight-black"><v-icon x-large>mdi-emoticon-sad</v-icon></div>
            <h1 v-else>{{ user.isPro ? "My PRO subscription" : "Get PRO" }}</h1>
            <p>Hi {{ user.profile.firstName }}!</p>

            <div v-if="unsubscribed">
                <v-card outlined>
                    <v-card-text>
                        <h3 class="mb-2">Your account will switch from PRO back to Free soon!</h3>
                        <div>
                            {{ unsubMessage }}
                        </div>
                        <div>Thanks for your support, and remember that you can always resubscribe if you wish to have all the bells and whistles again.</div>
                        <div class="mt-4">
                            <v-btn color="primary" to="/account" title="Back to my account" outlined rounded small nuxt>
                                <v-icon left>mdi-arrow-left</v-icon>
                                Back to my account
                            </v-btn>
                        </div>
                    </v-card-text>
                </v-card>
            </div>

            <div v-else-if="user.isPro">
                <template v-if="loading">
                    <v-progress-circular size="32" width="2" v-if="loading" indeterminate></v-progress-circular>
                    <span class="ml-4">Fetching subscription details...</span>
                </template>
                <p v-else-if="subscription?.status != 'CANCELLED'">Thank you for subscribing and becoming a <strong>PRO</strong>! Your support is truly appreciated <v-icon small>mdi-emoticon-outline</v-icon></p>
                <p v-else>Your account will be switched from <strong>PRO</strong> to <strong>Free</strong> in a few moments.</p>

                <v-card outlined>
                    <v-card-text>
                        <template v-if="unsubscribed">
                            <h3 class="error--text mb-2">Your subscription was cancelled!</h3>
                            <div>Your account will be downgraded back to the free version.</div>
                            <div class="text-center mt-8 mb-6">
                                <v-icon x-large>mdi-emoticon-sad</v-icon>
                            </div>
                        </template>
                        <template v-else-if="subscription">
                            <div>Subscription method: {{ subscriptionSource }}</div>
                            <div class="mb-2">Price: {{ paymentAmount }}</div>
                            <div v-if="subscriptionSource != 'Friend'">Last payment: {{ lastPaymentDetails }}</div>
                            <div>{{ nextPaymentDetails }}</div>
                            <div class="mt-6 text-center text-md-left" v-if="['paddle', 'paypal'].includes(subscription.source) && subscription.frequency != 'lifetime'">
                                <v-btn class="mr-md-2" color="primary" title="View subscription at Paddle" v-if="subscription.source == 'paddle'" @click.stop="paddleManage" rounded>
                                    <v-icon left>{{ subscription.status == "CANCELLED" ? "mdi-refresh" : "mdi-credit-card-outline" }}</v-icon>
                                    {{ subscription.status == "CANCELLED" ? "Reactivate subscription" : "Manage subscription" }}
                                </v-btn>
                                <v-btn class="mt-4 mt-md-0" color="removal" title="Confirm and unsubscribe" v-if="subscription.status != 'CANCELLED'" @click.stop="showUnsubDialog" rounded>
                                    <v-icon left>mdi-cancel</v-icon>
                                    Cancel subscription
                                </v-btn>
                            </div>
                        </template>

                        <template v-else-if="!loading">
                            <h3 class="secondary--text ma-0 mb-2">Oops!</h3>
                            Seems like your subscription is missing some details on our end.
                            <br v-if="$breakpoint.mdAndUp" />
                            Don't worry, your PRO account is safe and this issue will magically disappear in a few days.
                        </template>
                        <div class="mt-8 text-center text-md-left">
                            <v-btn color="primary" to="/account" title="Back to my account" outlined rounded small nuxt>
                                <v-icon left>mdi-arrow-left</v-icon>
                                Back to my account
                            </v-btn>
                        </div>
                    </v-card-text>
                </v-card>

                <v-dialog v-model="unsubDialog" width="440" overlay-opacity="0.95">
                    <v-card>
                        <v-toolbar color="removal">
                            <v-toolbar-title>Cancel subscription</v-toolbar-title>
                            <v-spacer></v-spacer>
                            <v-toolbar-items>
                                <v-btn icon @click.stop="hideUnsubDialog">
                                    <v-icon>mdi-close</v-icon>
                                </v-btn>
                            </v-toolbar-items>
                        </v-toolbar>
                        <v-card-text>
                            <p class="mt-3">Thanks for your support! Before you proceed, please be aware that the cancellation takes effect immediately.</p>
                            <p class="mt-3">If you don't mind, please let me know why're you're cancelling your PRO subscription (optional).</p>
                            <div>
                                <v-textarea label="I'm cancelling it because..." v-model="unsubReason" maxlength="200" rounded outlined no-resize></v-textarea>
                            </div>
                            <div class="text-center text-md-right">
                                <v-spacer></v-spacer>
                                <v-btn class="mb-4 mb-md-0 mr-md-2" color="grey" title="I want to keep PRO" @click.stop="hideUnsubDialog" text rounded>
                                    <v-icon left>mdi-check</v-icon>
                                    Keep it
                                </v-btn>
                                <v-btn color="removal" title="Confirm and unsubscribe" @click="unsubscribe" rounded>
                                    <v-icon left>mdi-cancel</v-icon>
                                    Cancel subscription
                                </v-btn>
                            </div>
                        </v-card-text>
                    </v-card>
                </v-dialog>
            </div>

            <div v-else>
                <p class="mt-4 mb-6">Our payment processor (Paddle.com) supports all major credit cards, as well as PayPal, Google Pay and Apple Pay.</p>

                <v-card class="mb-6" outlined>
                    <v-card-title class="accent">Subscription options</v-card-title>
                    <v-card-text class="pt-4">
                        <ul class="ml-n2 mb-6">
                            <li>A single "set and forget" payment of {{ currencySymbol }}{{ $store.state.proPlanDetails.price.lifetime.toFixed(2) }}.</li>
                            <li>A recurring yearly payment of {{ currencySymbol }}{{ $store.state.proPlanDetails.price.yearly.toFixed(2) }}.</li>
                            <li>A monthly GitHub sponsorship of $1.00.</li>
                        </ul>
                        <v-row>
                            <v-col md="4" sm="12">
                                <v-btn color="primary" title="Lifetime subscription via Paddle" @click="paddleCheckout('lifetime')" :x-large="$breakpoint.mdAndUp" block rounded nuxt>
                                    <v-icon left>mdi-credit-card-outline</v-icon>
                                    {{ $store.state.proPlanDetails.price.lifetime.toFixed(2) }} {{ currency }} / lifetime
                                </v-btn>
                            </v-col>
                            <v-col md="4" sm="12">
                                <v-btn color="primary" title="Yearly subscription via Paddle" @click="paddleCheckout('yearly')" :x-large="$breakpoint.mdAndUp" block rounded nuxt>
                                    <v-icon left>mdi-credit-card-outline</v-icon>
                                    {{ $store.state.proPlanDetails.price.yearly.toFixed(2) }} {{ currency }} / year
                                </v-btn>
                            </v-col>
                            <v-col md="4" sm="12">
                                <a href="https://github.com/sponsors/igoramadas" title="Sponsor me on GitHub!">
                                    <v-btn color="primary" title="Sponsorship via GitHub" :x-large="$breakpoint.mdAndUp" block rounded nuxt>
                                        <v-icon left>mdi-github</v-icon>
                                        Monthly sponsorship
                                    </v-btn>
                                </a>
                            </v-col>
                        </v-row>
                    </v-card-text>
                </v-card>

                <free-pro-table />
            </div>
        </v-container>
    </v-layout>
</template>

<script>
import _ from "lodash"
import FreeProTable from "~/components/FreeProTable.vue"
import subscriptionMixin from "~/mixins/subscriptionMixin.js"
import userMixin from "~/mixins/userMixin.js"
import {subscription} from "../../../core/lib/loghelper"

export default {
    authenticated: true,
    components: {FreeProTable},
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
            subscriptionSource: null,
            unsubscribed: false,
            unsubDialog: false,
            unsubReason: "",
            unsubMessage: null
        }
    },
    computed: {
        isAffiliate() {
            return ["Amex", "Friend", "N26", "Revolut", "Trade Republic"].includes(this.subscriptionSource)
        },
        paymentAmount() {
            if (!this.subscription || this.isAffiliate) return "free"
            return this.subscription.price + " " + this.subscription.currency
        },
        lastPaymentDetails() {
            if (!this.subscription) return ""
            if (this.isAffiliate) return "never"
            if (["GitHub"].includes(this.subscriptionSource)) return "managed via GitHub"
            return this.subscription.dateLastPayment ? this.$dayjs(this.subscription.dateLastPayment).format("ll") : `managed via ${this.subscriptionSource}`
        },
        nextPaymentDetails() {
            if (!this.subscription) return ""
            if (this.subscription.status == "CANCELLED") return `Cancelled at: ${this.$dayjs(this.subscription.dateUpdated)}`
            if (this.subscription.frequency == "lifetime") return `LIFETIME SUBSCRIPTION`
            if (this.subscription.dateExpiry) return `Expires at: ${this.$dayjs(this.subscription.dateExpiry).format("ll")}`
            if (this.subscription.dateNextPayment) return `Next payment: ${this.$dayjs(this.subscription.dateNextPayment).format("ll")}`
            if (this.subscription.status == "ACTIVE" && this.subscription.dateLastPayment) return `Next payment: around ${this.$dayjs(this.subscription.dateLastPayment).add(1, "year").format("ll")}`
            return "No future payments are scheduled."
        }
    },
    async fetch() {
        try {
            if (this.user.isPro) {
                this.loading = true
                const subscription = await this.$axios.$get(`/api/users/${this.user.id}/subscription`)
                this.loading = false

                this.subscription = subscription
                this.subscriptionSource = this.getSubscriptionSource(subscription)
            }
        } catch (ex) {
            this.$webError(this, "Billing.fetch", ex)
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
    },
    methods: {
        async paddleManage() {
            try {
                const transaction = await this.$axios.$get(`/api/paddle/${this.user.id}/new-transaction`)
                if (transaction?.newCheckout) {
                    await this.paddleCheckout()
                    return
                }
                this.$store.commit("setUserData", {paddleTransactionId: transaction.id})
                await this.paddleCheckout("update", transaction.id)
            } catch (ex) {
                ex.title = "Could not create a transaction with Paddle"
                this.$webError(this, "Billing.paddleManage", ex)
            }
        },
        async paddleCheckout(action, transactionId) {
            try {
                const priceId = action == "lifetime" ? this.$store.state.paddle.priceId.lifetime : this.$store.state.paddle.priceId.yearly
                const checkout = {
                    settings: {
                        allowLogout: false,
                        showAddDiscounts: false,
                        successUrl: `${window.location.protocol}//${window.location.host}/billing/success`,
                        displayMode: "overlay",
                        theme: "dark"
                    }
                }
                if (transactionId && action != "lifetime") {
                    checkout.transactionId = transactionId
                } else {
                    checkout.customData = {userId: this.user.id}
                    checkout.items = [{quantity: 1, priceId: priceId}]
                    if (this.user.paddleId) {
                        checkout.customer = {id: this.user.paddleId}
                    } else if (this.user.email) {
                        checkout.customer = {email: this.user.email}
                    }
                }

                Paddle.Checkout.open(checkout)
            } catch (ex) {
                ex.title = "Could not start the checkout process"
                this.$webError(this, "Billing.paddleCheckout", ex)
            }
        },
        async paddleCallback(ev) {
            try {
                if (ev.name == "checkout.customer.created" && ev.data?.customer?.id) {
                    await this.$axios.$post(`/api/paddle/${this.user.id}/customer`, {id: ev.data.customer.id, email: ev.data.customer.email, transactionId: ev.data.transaction_id})
                    this.$store.commit("setUserData", {paddleId: ev.data.customer.id})
                } else if (ev.name == "checkout.completed") {
                    this.$store.commit("setUserData", {paddleTransactionId: null})
                }
            } catch (ex) {
                console.error("Billing.paddleCheckout", ex)
                Paddle.Checkout.close()
            }
        },
        async unsubscribe() {
            try {
                this.loading = true

                if (this.unsubReason) this.unsubReason = this.unsubReason.trim()

                const res = await this.$axios.$post(`/api/users/${this.user.id}/unsubscribe`, {reason: this.unsubReason || null})
                this.unsubMessage = res.message
                this.loading = false
                this.unsubscribed = true
                this.$store.commit("setUserData", {isPro: false, subscriptionId: null})
            } catch (ex) {
                ex.title = "Error trying to unsubscribe your account"
                this.$webError(ex)
            }

            this.loading = false
            this.unsubDialog = false
        },
        showUnsubDialog() {
            this.unsubDialog = true
        },
        hideUnsubDialog() {
            this.unsubDialog = false
        }
    }
}
</script>
