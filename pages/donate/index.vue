<template>
    <v-layout column>
        <v-container fluid>
            <h1 v-if="canDonate">Donate</h1>
            <div v-else class="mt-4 mb-8 text-center display-3 font-weight-black">Thank you!</div>
            <p>Hi {{ user.profile.firstName }}!</p>
            <div v-if="canDonate">
                <p>
                    Strautomator is free to use <v-icon small>mdi-emoticon-outline</v-icon> but keeping it running isn't. I don't expect to make any money out of this service, but I hope I could get enough support to keep the servers, systems and
                    domain running smoothly. Any extra will be spent back on development time and donations to climate projects.
                </p>
                <free-pro-table />
                <v-card outlined>
                    <v-card-title class="accent primary--text">Setup your donation</v-card-title>
                    <v-card-text>
                        <div class="mt-4">
                            Want to support Strautomator? The easiest way is setting up a monthly or yearly donation on PayPal.
                        </div>
                        <v-radio-group v-model="billingPlanId" :mandatory="true">
                            <template class="text-center" v-for="plan in billingPlans">
                                <v-radio :label="plan.price + ' EUR / ' + plan.frequency" :value="plan.id"></v-radio>
                            </template>
                        </v-radio-group>
                        <v-btn color="primary" title="Donate via PayPal now!" @click="prepareSubscription" x-large rounded nuxt>Donate via PayPal</v-btn>
                        <div class="caption mt-4">
                            Putting it into perspective: this is less than 1 espresso per month, or 1 nice meal per year.
                        </div>
                    </v-card-text>
                </v-card>
                <h3 class="mt-6 mb-1">Other ways to support</h3>
                <ul class="mt-0 mb-3 pl-5">
                    <li><a href="https://github.com/sponsors/igoramadas" title="Sponsor me on GitHub!">Sponsor me on GitHub</a></li>
                    <li><a href="https://bunq.me/strautomator" title="Donate via bunq">Donate via bunq</a></li>
                </ul>
                <p>
                    If you donate via GutHub or bunq, please let me know via <a title="Contact us" :href="'mailto:info@strautomator.com?subject=Donation from user ' + this.user.id">info@strautomator.com</a>
                    so I can enable your PRO account manually.
                </p>
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
            billingPlanId: null,
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
            this.billingPlanId = this.billingPlans[0]
        } catch (ex) {
            this.$webError("Billing.fetch", ex)
        }
    },
    methods: {
        async prepareSubscription() {
            try {
                const subscription = await this.$axios.$post(`/api/paypal/subscribe/${this.billingPlanId}`)

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
