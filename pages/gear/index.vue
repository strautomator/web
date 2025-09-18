<template>
    <v-layout column>
        <v-container fluid>
            <h1>My Gear</h1>
            <template v-if="!isLoading && gearWithConfig.length == 0">
                <p>With GearWear you can set up automated alerts for your expendable parts when they reach the target usage (distance or hours). To start, please create specific GearWear to your desired bikes and/or shoes below.</p>
            </template>
            <template v-if="!isLoading && noGear">
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
                <v-alert class="text-center text-md-left" v-if="!user.email">
                    <p>To get GearWear distance alerts, Strautomator needs to know your email address first.</p>
                    <v-btn color="primary" title="Set your email address now" @click="emailDialog = true" rounded small>Set my email address</v-btn>
                    <email-dialog :show-dialog="emailDialog" @closed="hideEmailDialog" />
                </v-alert>
                <div class="mt-5 mb-2" v-if="isLoading">
                    <v-progress-circular class="mr-1 mt-n1" size="16" width="2" indeterminate></v-progress-circular>
                    Loading bikes and shoes...
                </div>
                <template v-else>
                    <div v-for="gear in gearWithConfig" :key="gear.id">
                        <gear-card :gear="gear" :gearwear-config="gearwearConfigs[gear.id]" />
                    </div>

                    <div v-if="batteryTracker?.devices?.length > 0">
                        <v-card class="mb-5" outlined>
                            <v-hover v-slot:default="{hover}">
                                <v-card-title class="accent">
                                    <v-icon class="ml-n1 mr-2">mdi-battery-charging-medium</v-icon>
                                    <span>Device batteries</span>
                                </v-card-title>
                            </v-hover>
                            <v-card-text class="pa-0 white--text">
                                <v-simple-table class="mt-2">
                                    <tbody>
                                        <tr v-for="device in batteryTracker.devices" :key="device.id">
                                            <td class="pr-0 pl-4">
                                                <v-hover v-slot:default="{hover}">
                                                    <a title="Rename this device" @click="showFitDeviceNameDialog(device.id)" small rounded text>
                                                        {{ getFitDeviceName(device.id) || getDeviceIdName(device.id) }}
                                                        <v-icon class="ml-1" v-show="hover" small>mdi-pencil-outline</v-icon>
                                                    </a>
                                                </v-hover>
                                            </td>
                                            <td class="text-right">
                                                <v-chip class="text-uppercase" :color="getBatteryColor(device)" small>{{ device.status }}</v-chip>
                                            </td>
                                            <td width="1" class="nowrap pl-0 text-right">{{ $dayjs(device.dateUpdated).format($breakpoint.mdAndUp ? "lll" : "ll") }}</td>
                                        </tr>
                                    </tbody>
                                </v-simple-table>
                                <fit-device-name-dialog :device-id="fitDeviceId" :device-name="fitDeviceName" :show-dialog="fitDeviceNameDialog" @closed="hideFitDeviceNameDialog" />
                            </v-card-text>
                        </v-card>
                    </div>

                    <v-card class="mt-2" v-if="gearWithoutConfig.length > 0" outlined>
                        <v-card-title>
                            <span>{{ gearWithConfig.length > 0 ? "Gear with no configuration" : "Your Strava gear" }}</span>
                        </v-card-title>
                        <v-card-text class="pa-0 white--text">
                            <v-simple-table>
                                <tbody>
                                    <tr v-for="gear in gearWithoutConfig" :key="gear.id">
                                        <td class="pl-0 pr-0">
                                            <v-btn color="primary" :to="'/gear/edit?id=' + gear.id" :title="`Create GearWear for ${gear.name}`" :disabled="gearwearRemaining < 1" nuxt text rounded small>
                                                <v-icon class="mr-2">mdi-plus-circle</v-icon>
                                                <v-icon class="mr-2" small>{{ getGearIcon(gear) }}</v-icon>
                                                {{ gear.name }}
                                            </v-btn>
                                        </td>
                                        <td v-if="$breakpoint.mdAndUp">
                                            <v-chip class="text-lowercase" v-if="gear.primary" outlined small>Primary {{ getGearType(gear) }}</v-chip>
                                        </td>
                                        <td class="pl-0 text-right">{{ gear.distance }} {{ distanceUnits }}</td>
                                    </tr>
                                </tbody>
                            </v-simple-table>
                            <div class="mt-4 mb-4 ml-md-4 text-center text-md-left">
                                <v-btn color="primary" href="https://www.strava.com/settings/gear" target="strava" title="Manage my gear on Strava" small rounded>
                                    <v-icon left>mdi-open-in-new</v-icon>
                                    Manage gear on Strava
                                </v-btn>
                            </div>
                        </v-card-text>
                    </v-card>
                    <v-alert class="mt-5 text-center text-md-left" v-if="!batteryTracker && !user.preferences.privacyMode">
                        <div class="mt-2 mt-md-0" v-if="user.isPro && !noGear">
                            Want to keep track of your connected sensor batteries as well?
                            <br />
                            Simply link your <n-link to="/account?garmin=link" title="Link your Garmin account" nuxt>Garmin</n-link> or <n-link to="/account?wahoo=link" title="Link your Wahoo account" nuxt>Wahoo</n-link>
                            account, and you'll see a list of all your device sensors here.
                        </div>
                        <div class="mt-2 mt-md-0" v-else-if="!user.isPro">
                            Want to keep track of your connected sensor batteries as well?
                            <br />
                            <n-link to="/billing" title="Manual automation trigger" nuxt>Get a PRO subscription</n-link> and link your Garmin or Wahoo accounts.
                        </div>
                    </v-alert>
                    <v-alert class="mt-4 text-center text-md-left text-caption" v-if="!noGear && delayDays > 0">
                        Please note that the gear tracking happens with a {{ delayDays == 1 ? "1 day" : `${delayDays} days` }} delay, so you have plenty of time to set the correct bike or shoes on your recent activities. You can change the delay on
                        your <n-link to="/account" title="My account" nuxt>account preferences</n-link>.
                        <div class="mt-1">Today's activities will be processed on {{ trackingDay }}.</div>
                    </v-alert>
                </template>
                <v-alert class="mt-5 text-center text-md-left" border="top" color="primary" v-if="gearwearRemaining == 0" colored-border>
                    <p>
                        You have reached the limit of {{ $store.state.freePlanDetails.maxGearWear }}
                        GearWear configurations on your free account.
                        <br v-if="$breakpoint.mdAndUp" />
                        To use this feature with more bikes or shoes you'll need a PRO account.
                    </p>
                    <v-btn color="primary" to="/billing" title="Subscribe to get a PRO account!" rounded nuxt>
                        <v-icon left>mdi-credit-card</v-icon>
                        Subscribe to PRO
                    </v-btn>
                </v-alert>
                <v-alert class="mt-5 text-center text-md-left" border="top" color="error" v-if="gearwearRemaining < 0" colored-border>
                    <p>
                        You are over the limit of {{ $store.state.freePlanDetails.maxGearWear }}
                        GearWear configurations on your free account.
                        <br v-if="$breakpoint.mdAndUp" />
                        Please upgrade your account, or remove the exceeding configurations to keep a maximum of {{ $store.state.freePlanDetails.maxGearWear }}, as some might not be updated.
                    </p>
                    <v-btn color="primary" to="/billing" title="Subscribe to get a PRO account!" rounded nuxt>
                        <v-icon left>mdi-credit-card</v-icon>
                        Subscribe to PRO
                    </v-btn>
                </v-alert>
            </template>
        </v-container>
        <v-snackbar v-model="alertEmailSaved" class="text-left" color="success" :timeout="5000" rounded bottom>
            Your email was set to {{ $store.state.user.email }}!
            <template v-slot:action="{attrs}">
                <v-icon v-bind="attrs" @click="closeAlert">mdi-close-circle</v-icon>
            </template>
        </v-snackbar>
        <v-snackbar v-model="alertFitDevice" class="text-left" :color="fitDeviceDialogAction" :timeout="5000" rounded bottom>
            {{ fitDeviceDialogAction == "success" ? `Device ${fitDeviceId} saved.` : `Device ${fitDeviceId} removed.` }}
            <template v-slot:action="{attrs}">
                <v-icon v-bind="attrs" @click="closeAlert">mdi-close-circle</v-icon>
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
import gearwearMixin from "~/mixins/gearwearMixin.js"
import EmailDialog from "~/components/account/EmailDialog.vue"
import FitDeviceNameDialog from "~/components/gearwear/FitDeviceNameDialog.vue"
import GearCard from "~/components/gearwear/GearCard.vue"

export default {
    authenticated: true,
    components: {EmailDialog, FitDeviceNameDialog, GearCard},
    mixins: [userMixin, gearwearMixin],
    head() {
        return {
            title: "Gear"
        }
    },
    data() {
        const user = this.$store.state.user
        const now = this.$dayjs()
        const delayDays = user.preferences.gearwearDelayDays || 2

        return {
            delayDays: delayDays,
            isLoading: true,
            hasManyBikes: false,
            emailDialog: false,
            alertEmailSaved: false,
            alertNew: false,
            alertDeleted: false,
            alertFitDevice: false,
            alertGearTitle: "",
            gearWithConfig: [],
            gearWithoutConfig: [],
            gearwearConfigs: {},
            batteryTracker: null,
            fitDeviceId: null,
            fitDeviceName: null,
            fitDeviceNameDialog: false,
            fitDeviceDialogAction: "",
            trackingDay: now.add(delayDays, "days").format("ddd Do")
        }
    },
    computed: {
        needsPro() {},
        noGear() {
            return this.gearWithConfig.length == 0 && this.gearWithoutConfig.length == 0
        }
    },
    async fetch() {
        try {
            const gearwearConfigs = {}

            // Force trigger a refresh of gear details?
            const queryRefresh = this.$route.query && this.$route.query.refresh ? "?refresh=1" : ""

            // Get GearWear configurations, and populate the gearwearConfigs list.
            const result = await this.$axios.$get(`/api/gearwear/${this.user.id}${queryRefresh}`)
            for (let config of result.configs) {
                gearwearConfigs[config.id] = config
            }

            this.gearwearConfigs = gearwearConfigs
            this.$store.commit("setGearWear", result.configs)

            // Get list of bikes and shoes with and without GearWear configuration.
            const bikes = this.$store.state.user.profile.bikes || []
            const shoes = this.$store.state.user.profile.shoes || []
            const gearWithConfig = _.concat(bikes, shoes)
            const gearWithoutConfig = _.remove(gearWithConfig, (g) => !this.gearwearConfigs[g.id])

            this.gearWithConfig = gearWithConfig
            this.gearWithoutConfig = gearWithoutConfig
            this.hasManyBikes = bikes.length > 1

            // Battery tracker.
            if (result.batteryTracker) {
                this.batteryTracker = result.batteryTracker
            }
        } catch (ex) {
            this.$webError(this, "Gear.fetch", ex)
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
        hideEmailDialog(saved) {
            this.emailDialog = false
            this.alertEmailSaved = saved
        },
        showFitDeviceNameDialog(id) {
            this.fitDeviceId = id
            this.fitDeviceName = this.getFitDeviceName(id)
            this.fitDeviceNameDialog = true
        },
        hideFitDeviceNameDialog(action) {
            if (action == "removal") {
                this.batteryTracker.devices = this.batteryTracker.devices.filter((d) => d.id != this.fitDeviceId)
                this.batteryTracker = this.batteryTracker
            }

            this.fitDeviceNameDialog = false
            this.fitDeviceDialogAction = action || ""
            this.alertFitDevice = action ? true : false
        },
        getGearName(id) {
            let gear = _.find(this.$store.state.user.profile.bikes, {id: id})
            if (gear) return gear.name
            gear = _.find(this.$store.state.user.profile.shoes, {id: id})
            if (gear) return gear.name
            return this.getGearType(id).toLowerCase()
        },
        getBatteryColor(device) {
            if (device.status == "unknown") return "accent"
            if (device.status == "low") return "error"
            if (device.status == "critical") return "removal"
            return "success"
        },
        closeAlert() {
            this.alertNew = false
            this.alertDeleted = false
            this.alertFitDevice = false
            this.alertEmailSaved = false
        }
    }
}
</script>
