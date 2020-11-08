<template>
    <v-layout column>
        <v-container fluid>
            <h1 v-if="!user.isPro">Billing</h1>
            <div v-else class="mt-4 mb-8 text-center display-3 font-weight-black">Thank you!</div>
            <p>Hi {{ user.profile.firstName }}!</p>
            <div v-if="!user.isPro">
                <p>
                    Strautomator is free to use <v-icon small>mdi-emoticon-outline</v-icon> but keeping it alive isn't. I don't expect to make any money out of the service, but the PRO subscription of a few users should be enough to offset the costs
                    and give me the motivation to keep adding new features.
                </p>
                <div class="mt-4 mb-6">
                    You can subscribe via PayPal or GitHub.
                </div>
                <v-card class="mb-6" outlined>
                    <v-card-title class="accent">PRO subscription</v-card-title>
                    <v-card-text class="pb-2 pb-md-0">
                        <v-row class="mt-6" no-gutters>
                            <v-col class="text-center mb-6">
                                <div v-for="plan in billingPlans" :key="plan.id">
                                    <v-btn color="primary" title="Subscribe via PayPal" @click="prepareSubscription(plan.id)" x-large rounded nuxt>
                                        <v-icon left>mdi-credit-card-outline</v-icon>
                                        ${{ plan.price.toFixed(2) + " / " + plan.frequency }} via PayPal
                                    </v-btn>
                                </div>
                            </v-col>
                            <v-col class="text-center mb-2">
                                <a href="https://github.com/sponsors/igoramadas" title="Sponsor me on GitHub!">
                                    <v-btn color="primary" title="Sponsorship via GitHub" x-large rounded nuxt>
                                        <v-icon left>mdi-github</v-icon>
                                        ${{ $store.state.proPlanDetails.githubPrice.toFixed(2) }} / month via GitHub
                                    </v-btn>
                                </a>
                            </v-col>
                        </v-row>
                    </v-card-text>
                </v-card>
                <free-pro-table />
            </div>
            <div v-else>
                <p>Thank you for subscribing and becoming a <strong>PRO</strong>! Your support is truly appreciated <v-icon small>mdi-emoticon-outline</v-icon></p>

                <v-card outlined>
                    <v-card-text>
                        <template v-if="loading">
                            <v-progress-circular size="32" width="2" v-if="loading" indeterminate></v-progress-circular>
                            <span class="ml-4">Fetching subscription details...</span>
                        </template>
                        <template v-else-if="unsubscribed">
                            <h3 class="error--text mb-2">Your subscription was cancelled!</h3>
                            <div>
                                Your account was now downgraded back to the Free version.
                            </div>
                            <div class="text-center mt-8 mb-6">
                                <v-icon x-large>mdi-emoticon-sad</v-icon>
                            </div>
                        </template>
                        <template v-else-if="subscription">
                            <div>Subscription method: {{ subscriptionSource }}</div>
                            <div>Next payment: {{ nextPaymentDate }}</div>
                            <div>Last payment: {{ lastPaymentDate }}</div>
                            <div class="mt-6 text-center text-md-left">
                                <v-btn color="removal" title="Confirm and unsubscribe" @click.stop="showUnsubDialog" rounded>
                                    <v-icon left>mdi-cancel</v-icon>
                                    Cancel subscription
                                </v-btn>
                            </div>
                        </template>
                        <template v-else>
                            <h3 class="secondary--text ma-0 mb-2">Oops!</h3>
                            Seems like your subscription is missing some details on our end.
                            <br v-if="$breakpoint.mdAndUp" />
                            Don't worry, your PRO account is still safe and I will troubleshoot this issue ASAP.
                        </template>
                        <div class="mt-8 text-center text-md-left">
                            <n-link to="/account" title="Back to my account">Back to my account...</n-link>
                        </div>
                    </v-card-text>
                </v-card>

                <v-dialog v-model="unsubDialog" max-width="440" overlay-opacity="0.95">
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
                            <p class="mt-3">
                                Thanks for your support! If you don't mind, please let me know why're you're cancelling your PRO subscription (optional).
                            </p>
                            <div>
                                <v-textarea label="I'm cancelling my PRO subscription because..." v-model="unsubReason" maxlength="120" outlined></v-textarea>
                            </div>
                            <div class="text-right">
                                <v-spacer></v-spacer>
                                <v-btn class="mr-1" color="grey" title="I want to keep PRO" @click.stop="hideUnsubDialog" text rounded>
                                    <v-icon left>mdi-check</v-icon>
                                    Keep
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
            subscription: null,
            subscriptionSource: null,
            unsubscribed: false,
            unsubDialog: false,
            unsubReason: ""
        }
    },
    computed: {
        lastPaymentDate() {
            if (!this.subscription) return ""
            if (this.subscriptionSource == "friend") return "never"
            return this.$moment(this.subscription.lastPayment.date).format("ll")
        },
        nextPaymentDate() {
            if (!this.subscription) return ""
            if (this.subscriptionSource == "friend") return "maybe a beer?"
            return this.$moment(this.subscription.dateNextPayment).format("ll")
        }
    },
    async fetch() {
        try {
            const billingPlans = await this.$axios.$get("/api/paypal/billingplans")
            this.billingPlans = Object.values(billingPlans)
        } catch (ex) {
            this.$webError("Billing.fetch", ex)
        }

        try {
            const user = this.$store.state.user

            if (user && user.isPro && user.subscription) {
                this.loading = true
                const subscription = await this.$axios.$get(`/api/users/${user.id}/subscription`)
                this.loading = false

                if (subscription.friend) {
                    this.subscriptionSource = "Just a friend :-)"
                } else if (subscription.paypal) {
                    this.subscriptionSource = "PayPal"
                    this.subscription = subscription.paypal
                } else if (subscription.github) {
                    this.subscriptionSource = "GitHub"
                    this.subscription = subscription.github
                }
            }
        } catch (ex) {
            this.$webError("Billing.fetch", ex)
        }

        this.loading = false
    },
    methods: {
        async prepareSubscription(planId) {
            try {
                const subscription = await this.$axios.$post(`/api/paypal/subscribe/${planId}`)

                if (subscription && subscription.approvalUrl) {
                    document.location.href = subscription.approvalUrl
                } else if (subscription && subscription.status == "ACTIVE") {
                    this.$router.push({path: `/billing/success?fixed=${subscription.id}`})
                } else {
                    this.$webError("Billing.prepareSubscription", "Could not setup your subscription with PayPal")
                }
            } catch (ex) {
                ex.title = "Could not setup your subscription with PayPal"
                this.$webError("Billing.prepareSubscription", ex)
            }
        },
        async unsubscribe() {
            try {
                this.loading = true
                if (this.unsubReason) this.unsubReason = this.unsubReason.trim()
                await this.$axios.$post(`/api/${this.user.subscription.source}/unsubscribe`, {reason: this.unsubReason || "Default reason"})
                this.loading = false
                this.unsubscribed = true
                const subscription = JSON.parse(JSON.stringify(this.user.subscription))
                subscription.enabled = false

                this.$store.commit("setUserSubscription", subscription)
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
