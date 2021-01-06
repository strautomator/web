<template>
    <v-layout column>
        <v-container fluid>
            <h1>Weather comparison</h1>
            <template v-if="user && !user.isPro">
                <p>
                    The full selection of weather providers is available to PRO accounts only.
                </p>
                <div class="mt-6 text-center text-md-left">
                    <v-btn elevation="1" color="primary" to="/billing" title="Subscribe and become a PRO!" rounded nuxt>
                        <v-icon left>mdi-credit-card-outline</v-icon>
                        Subscribe to PRO
                    </v-btn>
                </div>
            </template>
            <template v-else-if="weatherSummaries.length == 0">
                <p>
                    Not sure which weather provider is the best on your area? Strautomator can query all of them for the current weather conditions on your location, and then you can select the provider with the most accurate results.
                </p>
                <div :class="{'text-center mt-6': !$breakpoint.mdAndUp}">
                    <v-btn elevation="1" class="mr-2" color="primary" title="Get weather for my current location" v-if="!loading" @click="getPosition" rounded>
                        <v-icon left>mdi-weather-sunset-down</v-icon>
                        Get weather
                    </v-btn>
                    <v-progress-circular size="32" width="2" v-if="loading" indeterminate></v-progress-circular>
                </div>
            </template>
            <template v-else>
                <p>
                    So, which provider has the most accurate conditions?
                </p>
                <v-radio-group v-model="weatherProvider">
                    <v-simple-table v-if="$breakpoint.mdAndUp">
                        <thead>
                            <tr>
                                <th>Provider</th>
                                <th></th>
                                <th>Temperature</th>
                                <th>Humidity</th>
                                <th>Wind</th>
                                <th>Precipitation</th>
                                <th>Selected</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr :class="{'primary--text': weatherProvider == summary.id}" v-for="summary in weatherSummaries" :key="summary.id">
                                <td>{{ summary.name }}</td>
                                <td>{{ summary.icon }}</td>
                                <td>{{ summary.temperature }}</td>
                                <td>{{ summary.humidity }}</td>
                                <td>{{ summary.windSpeed }}</td>
                                <td>{{ summary.precipType || "-" }}</td>
                                <td><v-radio :title="`Click to select ${summary.name}`" :value="summary.id"></v-radio></td>
                            </tr>
                        </tbody>
                    </v-simple-table>
                    <div v-else>
                        <v-card class="mb-2" v-for="summary in weatherSummaries" :key="summary.id">
                            <v-card-text>
                                <div class="subtitle-1">
                                    <span :class="{'primary--text': weatherProvider == summary.id}">{{ summary.name }}</span>
                                    <div class="float-right mt-1">
                                        <v-radio :value="summary.id"></v-radio>
                                    </div>
                                </div>
                                <div class="d-flex pa-0">
                                    <div class="mr-3">
                                        {{ summary.icon }}
                                    </div>
                                    <div class="mr-3">
                                        <v-icon small>mdi-thermometer</v-icon>
                                        {{ summary.temperature }}
                                    </div>
                                    <div class="mr-3">
                                        <v-icon small>mdi-water-percent</v-icon>
                                        {{ summary.humidity }}
                                    </div>
                                    <div class="mr-3">
                                        <v-icon small>mdi-weather-windy</v-icon>
                                        {{ summary.windSpeed }}
                                    </div>
                                    <div>
                                        {{ summary.precipType || "" }}
                                    </div>
                                </div>
                            </v-card-text>
                        </v-card>
                    </div>
                </v-radio-group>
                <div class="mt-2">
                    <v-btn elevation="1" color="primary" title="Save weather provider" @click="saveAndExit" rounded nuxt>
                        <v-icon left>mdi-check</v-icon>
                        Use {{ weatherProvider }}
                    </v-btn>
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
            title: "Weather comparison"
        }
    },
    data() {
        return {
            loading: false,
            saved: false,
            weatherProvider: this.$store.state.user.preferences ? this.$store.state.user.preferences.weatherProvider || "darksky" : "darksky",
            weatherSummaries: []
        }
    },
    beforeDestroy() {
        if (!this.saved) {
            this.savePreferences()
        }
    },
    methods: {
        getPosition() {
            this.loading = true
            navigator.geolocation.getCurrentPosition(this.getWeather, this.positionError)
        },
        positionError(err) {
            this.$webError("Weather.getPosition", err)
        },
        async getWeather(position) {
            try {
                const summaries = []
                const latitude = position.coords.latitude
                const longitude = position.coords.longitude

                const result = await this.$axios.$get(`/api/weather/${latitude.toFixed(4)},${longitude.toFixed(4)}`)

                // Iterate weather summaries to set the provider name and append to the weatherSummaries list.
                for (let id of Object.keys(result)) {
                    result[id].id = id
                    result[id].name = _.find(this.$store.state.weatherProviders, {value: id}).text
                    summaries.push(result[id])
                }

                this.weatherSummaries = summaries

                this.loading = false
            } catch (ex) {
                this.$webError("Weather.getWeather", ex)
            }
        },
        async savePreferences() {
            try {
                const userId = this.$store.state.user.id
                const data = {
                    weatherProvider: this.weatherProvider
                }

                await this.$axios.$post(`/api/users/${userId}/preferences`, data)
                this.$store.commit("setUserPreferences", data)
                this.saved = true
            } catch (ex) {
                this.$webError("Weather.savePreferences", ex)
            }
        },
        async saveAndExit() {
            await this.savePreferences()
            this.$router.push({path: "/account"})
        }
    }
}
</script>
