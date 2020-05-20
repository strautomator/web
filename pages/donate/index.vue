<template>
    <v-layout column>
        <v-container fluid>
            <h1 v-if="canDonate">Donate</h1>
            <div v-else class="mt-4 mb-8 text-center display-3 font-weight-black">Thank you!</div>
            <p>Hi {{ user.profile.firstName }}!</p>
            <div v-if="canDonate">
                <p>
                    Strautomator is free to use <v-icon small>mdi-emoticon-outline</v-icon> but keeping it running isn't. I don't expect to make any money out of the service, but I hope I could get support to at least keep the servers, systems and
                    domain running smoothly.
                </p>
                <div class="mt-4 mb-6">
                    You can donate via PayPal or GitHub.
                </div>
                <v-card class="mb-8" outlined>
                    <v-card-title class="accent primary--text">Setup your donation</v-card-title>
                    <v-card-text>
                        <v-row class="mt-6" no-gutters>
                            <v-col class="text-center mb-6">
                                <template v-for="plan in billingPlans">
                                    <v-btn color="primary" title="Donate via PayPal" @click="prepareSubscription(plan.id)" x-large rounded nuxt>
                                        <v-icon left>mdi-credit-card-outline</v-icon>
                                        {{ plan.price + " EUR / " + plan.frequency }} via PayPal
                                    </v-btn>
                                </template>
                            </v-col>
                            <v-col class="text-center mb-2">
                                <a href="https://github.com/sponsors/igoramadas" title="Sponsor me on GitHub!">
                                    <v-btn color="primary" title="Sponsorship via GitHub" x-large rounded nuxt>
                                        <v-icon left>mdi-github</v-icon>
                                        $1.00 / month via GitHub
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
                <p>Thanks for donating and becoming a <strong>PRO</strong>! Your support is truly appreciated <v-icon small>mdi-emoticon-outline</v-icon></p>
                <p class="mb-8">
                    If for some reason you want to stop donating, I'm still grateful for your support.
                </p>
                <div class="text-center text-md-left">
                    <v-btn color="red" title="Confirm and unsubscribe" @click.stop="showUnsubDialog" rounded>Stop donating</v-btn>
                </div>
                <v-dialog v-model="unsubDialog" max-width="440" overlay-opacity="0.94">
                    <v-card>
                        <v-toolbar color="red darken-4">
                            <v-toolbar-title>Stop donating</v-toolbar-title>
                            <v-spacer></v-spacer>
                            <v-toolbar-items>
                                <v-btn icon @click.stop="hideUnsubDialog">
                                    <v-icon>mdi-close</v-icon>
                                </v-btn>
                            </v-toolbar-items>
                        </v-toolbar>
                        <v-card-text>
                            <p class="mt-2">
                                Thanks for your support! If you don't mind, please let me know why're you're cancelling the donation (optional).
                            </p>
                            <div>
                                <v-textarea label="I will stop donating because..." v-model="unsubReason" maxlength="120" outlined></v-textarea>
                            </div>
                            <div class="text-right">
                                <v-spacer></v-spacer>
                                <v-btn class="mr-1" color="success" title="I want to keep donating" @click.stop="hideUnsubDialog" text rounded>Back</v-btn>
                                <v-btn color="red" title="Confirm and unsubscribe" @click="unsubscribe" rounded>Stop donating</v-btn>
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
            title: "Donate"
        }
    },
    data() {
        return {
            billingPlans: [],
            unsubDialog: false,
            unsubReason: ""
        }
    },
    computed: {
        canDonate() {
            return !this.user.isPro || !this.user.subscription || !this.user.subscription.enabled
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
    },
    methods: {
        async prepareSubscription(planId) {
            try {
                const subscription = await this.$axios.$post(`/api/paypal/subscribe/${planId}`)

                if (subscription && subscription.approvalUrl) {
                    document.location.href = subscription.approvalUrl
                } else {
                    this.$webError("Donate.prepareSubscription", "Could not setup a donation with PayPal")
                }
            } catch (ex) {
                ex.title = "Could not setup a donation with PayPal"
                this.$webError("Donate.prepareSubscription", ex)
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
