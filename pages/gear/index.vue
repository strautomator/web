<template>
    <v-layout column>
        <v-container fluid>
            <h1>
                My Gear
                <v-chip color="accent" class="ml-1 mt-n1">BETA</v-chip>
            </h1>
            <template v-if="!isLoading && !hasGearWear">
                <p>
                    With GearWear you can set up automated alerts for your expendable parts when they reach a certain mileage. To start, please create specific GearWear to your desired bikes and/or shoes below.
                </p>
            </template>
            <template v-if="!isLoading && bikes.length == 0 && shoes.length == 0">
                <v-alert class="text-center text-md-left">
                    You don't have bikes or shoes registered on your Strava account. Please register them there first, and then refresh this page.
                    <div class="mt-4">
                        <a href="https://www.strava.com/settings/gear" target="strava">
                            <v-btn color="primary" title="Manage my gear on Strava" rounded>
                                <v-icon left>mdi-open-in-new</v-icon>
                                Manage gear on Strava
                            </v-btn>
                        </a>
                    </div>
                </v-alert>
            </template>
            <template v-else>
                <v-alert class="text-center text-md-left " v-if="!user.email">
                    <p>To get GearWear mileage alerts, Strautomator needs to know your email address first.</p>
                    <v-btn color="primary" title="Set your email address now" @click="emailDialog = true" rounded>Set my email address</v-btn>
                    <email-dialog :show-dialog="emailDialog" @closed="hideEmailDialog" />
                </v-alert>
                <div class="mt-5 mb-2" v-if="isLoading">
                    <v-progress-circular class="mr-1 mt-n1" size="16" width="2" indeterminate></v-progress-circular>
                    Loading bikes and shoes...
                </div>
                <template v-else>
                    <div v-for="gear in bikes" :key="gear.id">
                        <gear-card gear-type="bike" :gear="gear" :gearwear-config="gearwearConfigs[gear.id]" :needs-pro="needsPro" />
                    </div>
                    <div v-for="gear in shoes" :key="gear.id">
                        <gear-card gear-type="shoes" :gear="gear" :gearwear-config="gearwearConfigs[gear.id]" :needs-pro="needsPro" />
                    </div>
                </template>
                <v-alert class="mt-5 text-center text-md-left" border="top" color="primary" v-if="needsPro" colored-border>
                    <p>
                        You have reached the limit of {{ $store.state.freePlanDetails.maxGearWear }}
                        GearWear configurations on your free account.
                        <br v-if="$breakpoint.mdAndUp" />
                        To use this feature with more bikes or shoes, you'll need a PRO account, or simply delete an existing configuration.
                    </p>
                    <v-btn color="primary" to="/billing" title="Subscribe to get a PRO account!" rounded nuxt>
                        <v-icon left>mdi-credit-card</v-icon>
                        Subscribe to PRO
                    </v-btn>
                </v-alert>
            </template>
            <div class="mt-4" v-if="!needsPro && (bikes.length > 0 || shoes.length > 0)">
                <a href="https://www.strava.com/settings/gear" title="Manage my gear on Strava" target="strava">
                    <v-btn color="primary" rounded>
                        <v-icon left>mdi-open-in-new</v-icon>
                        Manage gear on Strava
                    </v-btn>
                </a>
            </div>
        </v-container>
        <v-snackbar v-model="emailSaved" class="text-left" color="success" :timeout="5000" rounded bottom>
            Your email was set to {{ $store.state.user.email }}!
            <template v-slot:action="{attrs}">
                <v-icon v-bind="attrs" @click="emailSaved = false">mdi-close-circle</v-icon>
            </template>
        </v-snackbar>
        <v-snackbar v-if="$route.query.new" v-model="alertNew" class="text-left" color="success" :timeout="5000" rounded bottom>
            GearWear configuration for "{{ alertGearTitle }}" created!
            <template v-slot:action="{attrs}">
                <v-icon v-bind="attrs" @click="closeAlert">mdi-close-circle</v-icon>
            </template>
        </v-snackbar>
        <v-snackbar v-if="$route.query.deleted" v-model="alertDeleted" class="text-left" color="error" :timeout="5000" rounded bottom>
            GearWear configuration for "{{ alertGearTitle }}" deleted!
            <template v-slot:action="{attrs}">
                <v-icon v-bind="attrs" @click="closeAlert">mdi-close-circle</v-icon>
            </template>
        </v-snackbar>
    </v-layout>
</template>

<script>
import _ from "lodash"
import userMixin from "~/mixins/userMixin.js"
import GearCard from "~/components/gearwear/GearCard.vue"
import EmailDialog from "~/components/account/EmailDialog.vue"

export default {
    authenticated: true,
    components: {GearCard, EmailDialog},
    mixins: [userMixin],
    head() {
        return {
            title: "Gear"
        }
    },
    data() {
        const bikes = this.$store.state.user.profile.bikes
        const shoes = this.$store.state.user.profile.shoes

        return {
            isLoading: true,
            emailDialog: false,
            emailSaved: false,
            alertNew: false,
            alertDeleted: false,
            alertGearTitle: "",
            bikes: bikes || [],
            shoes: shoes || [],
            gearwearConfigs: {}
        }
    },
    computed: {
        needsPro() {
            if (!this.user || !this.gearwearConfigs) return false
            return !this.user.isPro && Object.keys(this.gearwearConfigs).length >= this.$store.state.freePlanDetails.maxGearWear
        },
        hasGearWear() {
            return Object.keys(this.gearwearConfigs).length > 0
        }
    },
    async fetch() {
        try {
            this.$axios.setToken(this.$store.state.oauth.accessToken)

            const gearwearConfigs = {}

            // Get GearWear configurations, and populate the gearwearConfigs list.
            const list = await this.$axios.$get(`/api/gearwear/${this.user.id}`)
            for (let config of list) {
                gearwearConfigs[config.id] = config
            }

            this.gearwearConfigs = gearwearConfigs

            // Update count on user store.
            this.$store.commit("setGearWearCount", list.length)
        } catch (ex) {
            this.$webError("Gear.fetch", ex)
        }

        this.isLoading = false
    },
    mounted() {
        if (this.$route.query.new) {
            this.alertGearTitle = this.getGearName(this.$route.query.new)
            this.alertNew = true
        } else if (this.$route.query.deleted) {
            this.alertGearTitle = this.getGearName(this.$route.query.deleted)
            this.alertDeleted = true
        }
    },
    methods: {
        hideEmailDialog(emailSaved) {
            this.emailDialog = false
            this.emailSaved = emailSaved
        },
        getGearName(id) {
            let gear = _.find(this.bikes, {id: id}) || _.find(this.shoes, {id: id})
            return gear ? gear.name : "gear"
        },
        closeAlert() {
            this.alertNew = false
            this.alertDeleted = false
        }
    }
}
</script>
