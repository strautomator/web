<template>
    <v-layout column>
        <v-container fluid>
            <h1 v-if="!user.isPro">Billing</h1>
            <div v-else class="mt-4 mb-8 text-center display-3 font-weight-black">Thank you!</div>
            <p>Hi {{ user.profile.firstName }}!</p>
            <div v-if="!user.isPro">
                <p>
                    Strautomator is free to use <v-icon small>mdi-emoticon-outline</v-icon> but keeping it alive isn't. I don't expect to make any money out of the service, but the subscription of a few power users out there should help with running
                    costs and my development time for features and bug fixes.
                </p>
                <div class="mt-4 mb-6">
                    You can subscribe via PayPal or GitHub.
                </div>
                <v-card class="mb-8" outlined>
                    <v-card-title class="accent primary--text">PRO subscription</v-card-title>
                    <v-card-text>
                        <v-row class="mt-6" no-gutters>
                            <v-col class="text-center mb-6">
                                <template v-for="plan in billingPlans">
                                    <v-btn color="primary" title="Subscribe via PayPal" @click="prepareSubscription(plan.id)" x-large rounded nuxt>
                                        <v-icon left>mdi-credit-card-outline</v-icon>
                                        ${{ plan.price.toFixed(2) + " / " + plan.frequency }} via PayPal
                                    </v-btn>
                                </template>
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
                <p>
                    How do the free and the PRO accounts compare?
                </p>
                <free-pro-table />
            </div>
            <div v-else>
                <p>Thank you for subscribing and becoming a <strong>PRO</strong>! Your support is truly appreciated <v-icon small>mdi-emoticon-outline</v-icon></p>

                <v-card>
                    <v-card-text>
                        <template v-if="loading">
                            <v-progress-circular size="32" width="2" v-if="loading" indeterminate></v-progress-circular>
                            <span class="ml-4">Loading subscription details...</span>
                        </template>
                        <template v-else-if="!subscription">
                            <div>Subscription method: {{ subscriptionSource }}</div>
                            <div>Next payment: {{ nextPaymentDate }}</div>
                            <div>Last payment: {{ lastPaymentDate }} - ${{ subscription.lastPayment.amount.toFixed(2) }}</div>
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

                <v-dialog v-model="unsubDialog" max-width="440" overlay-opacity="0.94">
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
                            <p class="mt-2">
                                Thanks for your support! If you don't mind, please let me know why're you're cancelling your PRO subscription (optional).
                            </p>
                            <div>
                                <v-textarea label="I'm cancelling my PRO subscription because..." v-model="unsubReason" maxlength="120" outlined></v-textarea>
                            </div>
                            <div class="text-right">
                                <v-spacer></v-spacer>
                                <v-btn class="mr-1" color="success" title="I want to keep PRO" @click.stop="hideUnsubDialog" text rounded>Back</v-btn>
                                <v-btn color="removal" title="Confirm and unsubscribe" @click="unsubscribe" rounded>Cancel subscription</v-btn>
                            </div>
                        </v-card-text>
                    </v-card>
                </v-dialog>
            </div>
        </v-container>
    </v-layout>
</template>

<style></style>

<script>
import _ from "lodash"
import moment from "moment"
import FreeProTable from "~/components/FreeProTable.vue"
import userMixin from "~/mixins/userMixin.js"

export default {
    authenticated: true,
    components: {
        FreeProTable
    },
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
            unsubDialog: false,
            unsubReason: ""
        }
    },
    computed: {
        lastPaymentDate() {
            if (!this.subscription) return ""
            return moment(this.subscription.lastPayment.date).format("LL")
        },
        nextPaymentDate() {
            if (!this.subscription) return ""
            return moment(this.subscription.dateNextPayment).format("LL")
        }
    },
    async fetch() {
        try {
            this.$axios.setToken(this.$store.state.oauth.accessToken)
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

                if (subscription.paypal) {
                    this.subscriptionSource = "PayPal"
                    this.subscription = subscription.paypal
                } else {
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
                } else {
                    this.$webError("Billing.prepareSubscription", "Could not setup your subscription with PayPal")
                }
            } catch (ex) {
                ex.title = "Could not setup your subscription with PayPal"
                this.$webError("Billing.prepareSubscription", ex)
            }
        },
        showUnsubDialog() {
            this.unsubDialog = true
        },
        hideUnsubDialog() {
            this.unsubDialog = false
        },
        async unsubscribe() {
            try {
                if (this.unsubReason) this.unsubReason = this.unsubReason.trim()
                await this.$axios.$post(`/api/${this.user.subscription.source}/unsubscribe`, {reason: this.unsubReason || "Default reason"})

                const subscription = JSON.parse(JSON.stringify(this.user.subscription))
                subscription.enabled = false

                this.$store.commit("setUserSubscription", subscription)
            } catch (ex) {
                ex.title = "Error trying to unsubscribe your account"
                this.$webError(ex)
            }

            this.unsubDialog = false
        }
    }
}
</script>
