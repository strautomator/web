<template>
    <v-layout column>
        <v-container fluid>
            <h1>My Gear</h1>
            <template v-if="!hasGearWear">
                <p>
                    With GearWear you can set up automated alerts for your expendable parts when they reach a certain mileage.
                </p>
            </template>
            <template v-if="bikes.length == 0 && shoes.length == 0">
                <v-alert class="text-center text-md-left" round>
                    You don't have bikes or shoes registered on your Strava. Please register them first.
                    <div class="mt-4">
                        <a href="https://www.strava.com/settings/gear" target="strava"><v-btn color="primary" title="Manage my gear on Strava" rounded>My gear on Strava</v-btn></a>
                    </div>
                </v-alert>
            </template>
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
                                    <th>Components</th>
                                    <th>Strava</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="bike in bikes" :key="bike.id">
                                    <td width="40%">
                                        <n-link :to="'/gear/edit?id=' + bike.id" :title="`Edit GearWear for ${bike.name}`">{{ bike.name }}</n-link>
                                    </td>
                                    <td v-if="gearwearConfigs[bike.id]">
                                        {{ gearwearConfigs[bike.id].components.map((c) => c.name).join(", ") }}
                                    </td>
                                    <td v-else>
                                        No GearWear configuration
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
                                    <td v-if="gearwearConfigs[shoe.id]">Has config</td>
                                    <td v-else>No configuration set</td>
                                </tr>
                            </tbody>
                        </v-simple-table>
                    </v-card-text>
                </v-card>
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

        return {
            bikes: bikes || [],
            shoes: shoes || [],
            gearwearConfigs: {}
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
            const list = await this.$axios.$get(`/api/users/${this.user.id}/gearwear`)
            for (let config of list) {
                gearwearConfigs[config.id] = config
            }

            this.gearwearConfigs = gearwearConfigs

            // Update count on user store.
            this.$store.commit("setGearWearCount", list.length)
        } catch (ex) {
            this.$webError("Gear.fetch", ex)
        }
    }
}
</script>
