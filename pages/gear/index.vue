<template>
    <v-layout column>
        <v-container fluid>
            <h1>
                My Gear
                <v-chip color="accent" class="ml-1 mt-1">BETA</v-chip>
            </h1>
            <template v-if="!isLoading && !hasGearWear">
                <p>
                    With GearWear you can set up automated alerts for your expendable parts when they reach a certain mileage.
                </p>
            </template>
            <template v-if="!isLoading && bikes.length == 0 && shoes.length == 0">
                <v-alert class="text-center text-md-left">
                    You don't have bikes or shoes registered on your Strava. Please register them first.
                    <div class="mt-4">
                        <a href="https://www.strava.com/settings/gear" target="strava"><v-btn color="primary" title="Manage my gear on Strava" rounded>My gear on Strava</v-btn></a>
                    </div>
                </v-alert>
            </template>
            <template v-else>
                <v-alert class="text-center text-md-left pb-md-0" :color="emailSaved ? 'success' : ''" v-if="!user.email">
                    <v-form v-model="emailValid" v-if="!emailSaved" ref="emailForm">
                        <p>To get GearWear mileage alerts, Strautomator needs to know your email address first.</p>
                        <div class="d-flex flex-column flex-md-row mb-0 pb-0">
                            <div class="flex-grow-1">
                                <v-text-field v-model="userEmail" label="Your email address" maxlength="150" :rules="[emailRules.required, emailRules.email]" validate-on-blur dense outlined rounded></v-text-field>
                            </div>
                            <div class="flex-grow-1 ml-2 mr-2">
                                <v-btn color="primary" title="Set your email address" :disabled="userEmail.length < 6" @click="saveEmail" rounded>Save email</v-btn>
                            </div>
                        </div>
                    </v-form>
                    <div class="pb-md-3" v-else>Email saved: {{ userEmail }}!</div>
                </v-alert>
                <div class="mt-5 mb-2" v-if="isLoading">
                    <v-progress-circular class="mr-1 mt-n1" size="16" width="2" indeterminate></v-progress-circular>
                    Loading bikes and shoes...
                </div>
                <template v-else>
                    <v-card class="mb-5" outlined>
                        <v-card-title class="accent">
                            <v-icon class="ml-n1 mr-2">mdi-bike</v-icon>
                            <span>Bikes</span>
                        </v-card-title>
                        <v-card-text class="pl-0 pr-0">
                            <v-simple-table>
                                <thead v-if="$breakpoint.mdAndUp">
                                    <tr>
                                        <th>Name</th>
                                        <th>Mileage</th>
                                        <th>Components</th>
                                        <th>Strava</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="bike in bikes" :key="bike.id">
                                        <td class="pt-4 pt-md-0">
                                            <n-link :to="'/gear/edit?id=' + bike.id" :title="`Edit GearWear for ${bike.name}`">{{ bike.name }}</n-link>
                                            <div class="mt-1" v-if="!$breakpoint.mdAndUp">
                                                <template v-if="gearwearConfigs[bike.id]">
                                                    <v-chip class="mt-md-2 mr-2" v-for="comp in gearwearConfigs[bike.id].components" small>
                                                        <v-icon class="mr-1" color="warning" v-if="comp.currentMileage >= comp.alertMileage" small>mdi-sync-alert</v-icon>
                                                        {{ comp.name }}
                                                    </v-chip>
                                                </template>
                                                <div class="grey--text" v-else>
                                                    No GearWear configured
                                                </div>
                                            </div>
                                        </td>
                                        <td v-if="$breakpoint.mdAndUp">{{ bike.mileage }} {{ units }}</td>
                                        <td v-if="$breakpoint.mdAndUp">
                                            <template v-if="gearwearConfigs[bike.id]">
                                                <v-chip class="mt-md-2 mr-2" v-for="comp in gearwearConfigs[bike.id].components" small>
                                                    <v-icon class="mr-1" color="warning" v-if="comp.currentMileage >= comp.alertMileage" small>mdi-sync-alert</v-icon>
                                                    {{ comp.name }}
                                                </v-chip>
                                            </template>
                                            <div class="grey--text" v-else>
                                                No GearWear configured
                                            </div>
                                        </td>
                                        <td width="1" v-if="$breakpoint.mdAndUp">
                                            <a :href="`https://www.strava.com/bikes/${bike.id.substring(1)}`" :title="`Edit ${bike.name} on Strava`" target="strava"><v-icon color="primary" class="mt-n1">mdi-open-in-new</v-icon></a>
                                        </td>
                                    </tr>
                                </tbody>
                            </v-simple-table>
                        </v-card-text>
                    </v-card>
                    <v-card class="mb-5" outlined>
                        <v-card-title class="accent">
                            <v-icon class="ml-n1 mr-2">mdi-shoe-print</v-icon>
                            <span>Shoes</span>
                        </v-card-title>
                        <v-card-text class="pl-0 pr-0">
                            <v-simple-table>
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Components</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="shoe in shoes" :key="shoe.id">
                                        <td width="40%">
                                            <n-link :to="'/gear/edit?id=' + shoe.id" :title="`Edit GearWear for ${shoe.name}`">{{ shoe.name }}</n-link>
                                        </td>
                                        <td v-if="gearwearConfigs[shoe.id]">
                                            {{ gearwearConfigs[bike.id].components.map((c) => c.name).join(", ") }}
                                        </td>
                                        <td class="grey--text" v-else>
                                            No GearWear configuration
                                        </td>
                                    </tr>
                                </tbody>
                            </v-simple-table>
                        </v-card-text>
                    </v-card>
                </template>
                <div class="mt-4 text-center text-md-left">
                    <a href="https://www.strava.com/settings/gear" target="strava"><v-btn color="primary" title="Manage my gear on Strava" rounded>Manage gear on Strava</v-btn></a>
                </div>
            </template>
        </v-container>
    </v-layout>
</template>

<script>
import _ from "lodash"
import userMixin from "~/mixins/userMixin.js"

export default {
    authenticated: true,
    mixins: [userMixin],
    head() {
        return {
            title: "Gear"
        }
    },
    data() {
        const bikes = this.$store.state.user.profile.bikes
        const shoes = this.$store.state.user.profile.shoes

        // Email validation.
        const emailRules = {
            required: (value) => !!value || "Email is required",
            email: (value) => {
                const pattern = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
                return pattern.test(value) || "Invalid email address"
            }
        }

        return {
            isLoading: true,
            units: this.user && this.user.profile.units == "imperial" ? "mi" : "km",
            userEmail: "",
            emailValid: false,
            emailSaved: false,
            bikes: bikes || [],
            shoes: shoes || [],
            gearwearConfigs: {},
            emailRules: emailRules
        }
    },
    computed: {
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
    methods: {
        async saveEmail() {
            try {
                if (this.$refs.emailForm.validate()) {
                    await this.$axios.$post(`/api/users/${this.user.id}/email`, {email: this.userEmail})
                    this.emailSaved = true
                }
            } catch (ex) {
                this.$webError("Gear.saveEmail", ex)
            }
        },
        getCompStatus(gearwearConfig) {
            if (!gearwearConfig) return ""

            const needsReplacing = []

            for (let comp of gearwearConfig.components) {
                if (comp.currentMileage >= comp.alertMileage) {
                    needsReplacing.push(comp.name)
                }
            }

            if (needsReplacing.length == 0) {
                return "All good"
            } else {
                return `Needs replacing: ${needsReplacing.join(", ")}`
            }
        }
    }
}
</script>
