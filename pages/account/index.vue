<template>
    <v-layout column>
        <v-container fluid>
            <h1>Account</h1>
            <div class="text-center text-md-left">
                <div class="mt-3">{{ user.profile.firstName }} {{ user.profile.lastName }}</div>
                <div>Account ID {{ user.id }}</div>
                <div>Units: {{ user.profile.units }}</div>
                <div>Registered on {{ dateRegistered }}</div>
                <p class="mt-3 caption">
                    <a :href="stravaProfileUrl" target="strava" title="Go to my profile on Strava..."><v-icon color="primary" small>mdi-open-in-new</v-icon> Open my Strava profile... </a>
                </p>
            </div>
            <h3 class="mt-5 mb-3">My preferences</h3>
            <v-card>
                <v-card-text>
                    <div class="d-flex" :class="{'flex-column': !$breakpoint.mdAndUp}">
                        <div class="flex-grow-1">
                            <v-select label="Preferred weather provider" v-model="weatherProvider" :items="listWeatherProviders" :class="{'mr-1': $breakpoint.mdAndUp}" outlined rounded></v-select>
                        </div>
                        <div class="flex-grow-1">
                            <v-select label="Temperature unit" v-model="weatherUnit" :items="listWeatherUnits" :class="{'ml-1': $breakpoint.mdAndUp}" outlined rounded></v-select>
                        </div>
                    </div>
                    <div class="mb-8 mt-n2 text-center text-md-left">
                        <n-link title="Help me selecting a weather provider" to="/weather/select" nuxt router>
                            <v-icon color="primary" small>mdi-information-outline</v-icon>
                            Need help choosing a help provider?
                        </n-link>
                    </div>
                    <div class="mt-n2">
                        <h3 class="mb-2">Hashtag preference</h3>
                        <div class="body-2">
                            A link back to Strautomator will be added to {{ $store.state.linksOnPercent }}% of processed activities.
                            <br />
                            Do you prefer using hashtags on activity names instead of an URL on activity descriptions?
                        </div>
                        <v-switch class="mt-2" title="Hashtag preference" v-model="activityHashtag" :label="activityHashtag ? 'Yes, use a hashtag on activity names' : 'No, use a link on descriptions'"></v-switch>
                    </div>
                    <div class="mt-2">
                        <h3 class="mb-2">Twitter sharing</h3>
                        <div class="body-2">
                            Opt-in to have your processed activities occasionally shared on Strautomator's twitter account.
                        </div>
                        <v-switch class="mt-2" title="Twitter sharing" v-model="twitterShare" :label="twitterShare ? 'Yes, share some of my activities' : 'No, do not share any of my activities'"></v-switch>
                    </div>
                </v-card-text>
            </v-card>
            <h3 class="mt-5 mb-3">Status: {{ $store.state.user.isPro ? "PRO" : "Free" }} account</h3>
            <free-pro-table />
            <div class="mt-4 text-center text-md-left">
                <v-btn color="primary" to="/donate" title="Donate and become a PRO!" rounded nuxt>
                    <v-icon left>mdi-credit-card-outline</v-icon>
                    Donate now
                </v-btn>
            </div>
            <div class="mt-6 text-center text-md-left">
                <v-btn color="red" title="Time to say goodbye?" to="/account/goodbye" small outlined rounded nuxt>
                    <v-icon left>mdi-cancel</v-icon>
                    Close my account
                </v-btn>
            </div>
        </v-container>
    </v-layout>
</template>

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
            title: "Account"
        }
    },
    created() {
        this.delaySavePreferences = _.debounce(this.savePreferences, 3000)
    },
    data() {
        const user = this.$store.state.user
        const hashtag = user && user.preferences ? user.preferences.activityHashtag : false
        const twitterShare = user && user.preferences ? user.preferences.twitterShare : false
        const weatherProvider = user && user.preferences ? user.preferences.weatherProvider : null
        const weatherUnit = user && user.preferences ? user.preferences.weatherUnit || "c" : "c"

        return {
            savePending: false,
            activityHashtag: hashtag,
            twitterShare: twitterShare,
            weatherProvider: weatherProvider,
            weatherUnit: weatherUnit,
            listWeatherProviders: _.cloneDeep(this.$store.state.weatherProviders),
            listWeatherUnits: [
                {value: "c", text: "Celsius"},
                {value: "f", text: "Fahrenheit"}
            ]
        }
    },
    computed: {
        dateRegistered() {
            return moment(this.user.dateRegistered).format("LL")
        },
        stravaProfileUrl() {
            return `https://www.strava.com/athletes/${this.user.id}`
        }
    },
    watch: {
        activityHashtag(newValue, oldValue) {
            if (newValue != oldValue) {
                this.savePending = true
                this.delaySavePreferences()
            }
        },
        weatherProvider(newValue, oldValue) {
            if (newValue != oldValue) {
                this.savePending = true
                this.delaySavePreferences()
            }
        },
        weatherUnit(newValue, oldValue) {
            if (newValue != oldValue) {
                this.savePending = true
                this.delaySavePreferences()
            }
        },
        twitterShare(newValue, oldValue) {
            if (newValue != oldValue) {
                this.savePending = true
                this.delaySavePreferences()
            }
        }
    },
    beforeDestroy() {
        this.delaySavePreferences.cancel()

        if (this.savePending) {
            this.savePreferences()
        }
    },
    methods: {
        async savePreferences() {
            this.savePending = false

            try {
                const data = {
                    activityHashtag: this.activityHashtag,
                    twitterShare: this.twitterShare,
                    weatherProvider: this.weatherProvider,
                    weatherUnit: this.weatherUnit
                }

                this.$store.commit("setUserPreferences", data)

                await this.$axios.$post(`/api/users/${this.user.id}/preferences`, data)
            } catch (ex) {
                this.$webError("Account.savePreferences", ex)
            }
        }
    }
}
</script>
