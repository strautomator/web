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
                        <h3 class="error--text mb-2">Your subscription was cancelled!</h3>
                        <div>Your account will be downgraded back to the free version. Thanks for your previous support, and remember that you can always subscribe again if you wish to have all all the bells and whistles on Strautomator.</div>
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

                <p v-else-if="subscription.status != 'CANCELLED'">Thank you for subscribing and becoming a <strong>PRO</strong>! Your support is truly appreciated <v-icon small>mdi-emoticon-outline</v-icon></p>
                <p v-else>Your account will be switched from <strong>PRO</strong> to <strong>Free</strong> on {{ nextPaymentDate }}.</p>

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
                            <div>Next payment: {{ subscription.status == "CANCELLED" ? "cancelled" : nextPaymentDate }}</div>
                            <div v-if="subscriptionSource != 'Friend'">Last payment: {{ lastPaymentDate }}</div>
                            <div class="mt-6 text-center text-md-left" v-if="subscription.status != 'CANCELLED'">
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
                                <v-btn class="mr-1" color="grey" title="I want to keep PRO" @click.stop="hideUnsubDialog" text rounded>
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
                <p>
                    Strautomator is free to use <v-icon small>mdi-emoticon-outline</v-icon> but keeping it alive isn't. I don't expect to make any money out of the service, but the PRO subscription of a few users should be enough to offset the costs
                    and give me the motivation to keep adding new features.
                </p>
                <div class="mt-4 mb-6">You can subscribe via PayPal or GitHub.</div>
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
            if (this.subscriptionSource == "Friend") return "never"
            if (this.subscriptionSource == "Revolut") return "never"
            return this.$dayjs(this.subscription.lastPayment.date).format("ll")
        },
        nextPaymentDate() {
            if (!this.subscription) return ""
            if (this.subscriptionSource == "Friend") return "maybe a beer?"
            if (this.subscriptionSource == "Revolut") return "when the universe ends"
            return this.$dayjs(this.subscription.lastPayment.date).add(1, "year").format("ll")
        }
    },
    async fetch() {
        try {
            const billingPlans = await this.$axios.$get(`/api/paypal/${this.user.id}/billingplans`)
            this.billingPlans = Object.values(billingPlans)
        } catch (ex) {
            this.$webError("Billing.fetch", ex)
        }

        try {
            if (this.user.isPro && this.user.subscription) {
                this.loading = true
                const subscription = await this.$axios.$get(`/api/users/${this.user.id}/subscription`)
                this.loading = false

                if (subscription.friend) {
                    this.subscriptionSource = "Friend"
                    this.subscription = subscription.friend
                } else if (subscription.github) {
                    this.subscriptionSource = "GitHub"
                    this.subscription = subscription.github
                } else if (subscription.paypal) {
                    this.subscriptionSource = "PayPal"
                    this.subscription = subscription.paypal
                } else if (subscription.revolut) {
                    this.subscriptionSource = "Revolut"
                    this.subscription = subscription.revolut
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
                const subscription = await this.$axios.$post(`/api/paypal/${this.user.id}/subscribe/${planId}`)

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
                await this.$axios.$post(`/api/${this.user.subscription.source}/${this.user.id}/unsubscribe`, {reason: this.unsubReason || null})

                this.loading = false
                this.unsubscribed = true

                const subscription = JSON.parse(JSON.stringify(this.user.subscription, null, 0))
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
