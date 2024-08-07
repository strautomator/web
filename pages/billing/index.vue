<template>
    <v-layout column>
        <v-container fluid>
            <div v-if="unsubscribed" class="mt-4 mb-8 text-center display-3 font-weight-black"><v-icon x-large>mdi-emoticon-sad</v-icon></div>
            <div v-else-if="user.isPro" class="mt-4 mb-8 text-center display-3 font-weight-black">Thank you!</div>
            <h1 v-else>Billing</h1>
            <p>Hi {{ user.profile.firstName }}!</p>

            <div v-if="unsubscribed">
                <v-card outlined>
                    <v-card-text>
                        <h3 class="error--text mb-2">Your account will switch from PRO back to Free soon!</h3>
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
                <p v-else>Your account will be switched from <strong>PRO</strong> to <strong>Free</strong> in the upcoming days.</p>

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
                            <div v-if="subscriptionSource != 'Friend'">Last payment: {{ lastPaymentDate }}</div>
                            <div>Next payment: {{ subscription.status == "CANCELLED" ? "cancelled" : nextPaymentDate }}</div>
                            <div class="mt-6 text-center text-md-left" v-if="subscription.status != 'CANCELLED'">
                                <v-btn color="removal" title="Confirm and unsubscribe" @click.stop="showUnsubDialog" rounded>
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
                            <p class="mt-3">Thanks for your support! If you don't mind, please let me know why're you're cancelling your PRO subscription (optional).</p>
                            <div>
                                <v-textarea label="I'm cancelling my subscription because..." v-model="unsubReason" maxlength="200" rounded outlined no-resize></v-textarea>
                            </div>
                            <div class="text-right">
                                <v-spacer></v-spacer>
                                <v-btn class="mr-2" color="grey" title="I want to keep PRO" @click.stop="hideUnsubDialog" text rounded>
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

            <div v-else-if="activeBillingPlan">
                <p>
                    Strautomator is free to use <v-icon small>mdi-emoticon-outline</v-icon> but keeping it alive isn't. I don't expect to make any money out of the service, but the PRO subscription of a few users should be enough to offset the costs
                    and give me the motivation to keep adding new features.
                </p>
                <p class="mt-4 mb-6">You can subscribe via PayPal (yearly), or sponsor me via GitHub (monthly).</p>

                <v-card class="mb-6" outlined>
                    <v-card-title class="accent">Subscribe to PRO</v-card-title>
                    <v-card-text class="pb-2 pb-md-0">
                        <v-row class="mt-6" no-gutters>
                            <v-col class="text-center mb-6">
                                <v-btn color="primary" title="Subscribe via PayPal" @click="prepareSubscription(activeBillingPlan.id)" :x-large="$breakpoint.mdAndUp" rounded nuxt>
                                    <v-icon left>mdi-credit-card-outline</v-icon>
                                    {{ currencySymbol }}{{ activeBillingPlan.price.toFixed(2) }} / {{ activeBillingPlan.frequency }} via PayPal
                                </v-btn>
                            </v-col>
                            <v-col class="text-center mb-2">
                                <a href="https://github.com/sponsors/igoramadas" title="Sponsor me on GitHub!">
                                    <v-btn color="primary" title="Sponsorship via GitHub" :x-large="$breakpoint.mdAndUp" rounded nuxt>
                                        <v-icon left>mdi-github</v-icon>
                                        ${{ $store.state.proPlanDetails.price.github.toFixed(2) }} / month via GitHub
                                    </v-btn>
                                </a>
                            </v-col>
                        </v-row>
                        <p class="text-center" v-if="$store.state.proPlanDetails.price.upcoming">
                            Hurry up! The yearly subscription price for new users will increase from
                            {{ activeBillingPlan.price.toFixed(2) }} {{ $store.state.expectedCurrency }} to {{ $store.state.proPlanDetails.price.upcoming.toFixed(2) }} {{ $store.state.expectedCurrency }} soon.
                        </p>
                    </v-card-text>
                </v-card>
                <p>Not so sure yet? You can also test 1 year of PRO by subscribing to one of my fintech <n-link to="/billing/affiliates" title="Affiliate services" nuxt>affiliate services</n-link>.</p>
                <free-pro-table />
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
            title: "Billing"
        }
    },
    data() {
        return {
            loading: true,
            billingPlans: [],
            activeBillingPlan: null,
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
        lastPaymentDate() {
            if (!this.subscription) return ""
            if (this.isAffiliate) return "never"
            if (["GitHub"].includes(this.subscriptionSource)) return "managed by GitHub"
            return this.subscription.lastPayment ? this.$dayjs(this.subscription.lastPayment.date).format("ll") : "managed by PayPal"
        },
        nextPaymentDate() {
            if (!this.subscription) return ""
            if (this.subscription.dateExpiry) return this.$dayjs(this.subscription.dateExpiry).format("ll")
            if (this.subscription.dateNextPayment) return this.$dayjs(this.subscription.dateNextPayment)
            if (this.subscriptionSource == "Friend") return "maybe a beer?"
            return this.subscription.lastPayment ? this.$dayjs(this.subscription.lastPayment.date).add(1, "year").format("ll") : "managed by PayPal"
        },
        currencySymbol() {
            if (this.activeBillingPlan?.currency == "EUR") return "€"
            if (this.activeBillingPlan?.currency == "GBP") return "£"
            return "$"
        }
    },
    async fetch() {
        try {
            const res = await this.$axios.$get(`/api/paypal/${this.user.id}/billingplans`)
            const billingPlans = Object.values(res)
            this.billingPlans = billingPlans
            this.activeBillingPlan = billingPlans.find((b) => b.currency == (this.$store.state.expectedCurrency || "USD"))
        } catch (ex) {
            this.$webError(this, "Billing.fetch", ex)
        }

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
    methods: {
        async prepareSubscription(planId) {
            try {
                const subscription = await this.$axios.$post(`/api/paypal/${this.user.id}/subscribe/${planId}`)

                if (subscription && subscription.approvalUrl) {
                    document.location.href = subscription.approvalUrl
                } else if (subscription && subscription.status == "ACTIVE") {
                    this.$router.push({path: `/billing/success?fixed=${subscription.id}`})
                } else {
                    this.$webError(this, "Billing.prepareSubscription", "Could not setup your subscription with PayPal")
                }
            } catch (ex) {
                ex.title = "Could not setup your subscription with PayPal"
                this.$webError(this, "Billing.prepareSubscription", ex)
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
