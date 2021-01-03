<template>
    <v-layout column>
        <v-container fluid>
            <h1>Account</h1>
            <div>
                <div class="mt-3">{{ user.profile.firstName }} {{ user.profile.lastName }}</div>
                <div class="mb-3">
                    <span class="mr-1" v-if="user.email">{{ user.email }}</span>
                    <br v-if="$breakpoint.mdAndDown" />
                    <v-btn class="ml-n1 ml-md-0" title="Set your email address" :color="user.email ? '' : 'primary'" @click="emailDialog = true" rounded x-small>{{ user.email ? "change email" : "add email address" }}</v-btn>
                </div>
                <div>Account ID {{ user.id }}</div>
                <div>Registered on {{ dateRegistered }}</div>
                <div>Units: {{ user.profile.units }}</div>
                <p class="mt-1 caption">
                    <a :href="stravaProfileUrl" target="strava" title="Go to my profile on Strava..."><v-icon color="primary" small>mdi-open-in-new</v-icon> Open my Strava profile</a>
                </p>
                <p class="mt-3 text-center text-md-left">
                    <v-btn color="primary" to="/calendar" title="Calendar subscription" nuxt rounded>
                        <v-icon left>mdi-calendar-month</v-icon>
                        My calendar
                    </v-btn>
                    <v-btn class="ml-2" color="primary" to="/account/notifications" title="My notifications" nuxt rounded>
                        <v-icon left>mdi-bell</v-icon>
                        My notifications
                    </v-btn>
                </p>
            </div>
            <v-card class="mt-5" outlined>
                <v-card-title class="accent">
                    My preferences
                </v-card-title>
                <v-card-text>
                    <div class="mt-6 d-flex" :class="{'flex-column': !$breakpoint.mdAndUp}">
                        <div class="flex-grow-1">
                            <v-select label="Preferred weather provider" v-model="weatherProvider" :items="listWeatherProviders" :class="{'mr-1': $breakpoint.mdAndUp}" outlined rounded></v-select>
                        </div>
                        <div class="flex-grow-1">
                            <v-select label="Temperature unit" v-model="weatherUnit" :items="listWeatherUnits" :class="{'ml-1': $breakpoint.mdAndUp}" outlined rounded></v-select>
                        </div>
                    </div>
                    <div v-if="user.isPro" class="mb-8 mt-n2 text-center text-md-left">
                        <n-link title="Help me selecting a weather provider" to="/weather/select" nuxt router>
                            <v-icon color="primary" small>mdi-information-outline</v-icon>
                            Need help choosing a weather provider?
                        </n-link>
                    </div>
                    <div class="mt-n1">
                        <h3 class="mb-2">Linkback preference</h3>
                        <div class="body-2">
                            <span v-if="linksOn == 1">A linkback will be added to all activities processed by Strautomator.</span>
                            <span v-else-if="linksOn > 0">A linkback {{ user.isPro ? "can" : "will" }} be added to {{ 100 / linksOn }}% of the activities processed by Strautomator.</span>
                            <span v-else>A linkback won't be added to any of your activities.</span>
                            <v-radio-group v-model="linksOn" row>
                                <v-radio label="100%" :value="1"></v-radio>
                                <v-radio label="50%" :value="2"></v-radio>
                                <v-radio label="20%" :value="5"></v-radio>
                                <v-radio label="10%" :value="10"></v-radio>
                                <v-radio class="mt-2 mt-md-0" :value="0" :label="user.isPro ? 'No links' : 'No links (PRO only)'" :disabled="!user.isPro"></v-radio>
                            </v-radio-group>
                        </div>
                    </div>
                    <div class="mt-4" v-if="linksOn > 0">
                        <h3 class="mb-2">Hashtag preference</h3>
                        <div class="body-2">
                            Do you prefer using hashtags on activity names instead of an URL on activity descriptions for linkbacks?
                        </div>
                        <v-switch class="mt-2" title="Hashtag preference" v-model="activityHashtag" :label="activityHashtag ? 'Yes, use a hashtag on activity names' : 'No, use a link on descriptions'"></v-switch>
                    </div>
                    <div class="mt-4">
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
                <v-btn color="primary" to="/billing" title="PRO Subscription" rounded nuxt>
                    <v-icon left>mdi-credit-card-outline</v-icon>
                    {{ user.isPro ? "View my subscription" : "Subscribe to PRO" }}
                </v-btn>
            </div>
            <div class="mt-6 text-center text-md-left">
                <v-btn color="removal" title="Time to say goodbye?" to="/account/goodbye" small outlined rounded nuxt>
                    <v-icon left>mdi-cancel</v-icon>
                    Close my account
                </v-btn>
            </div>
            <email-dialog :show-dialog="emailDialog" @closed="hideEmailDialog" />
            <v-snackbar v-model="emailSaved" class="text-left" color="success" :timeout="5000" rounded bottom>
                Your email was updated to {{ $store.state.user.email }}!
                <template v-slot:action="{attrs}">
                    <v-icon v-bind="attrs" @click="emailSaved = false">mdi-close-circle</v-icon>
                </template>
            </v-snackbar>
        </v-container>
    </v-layout>
</template>

<script>
import _ from "lodash"
import EmailDialog from "~/components/account/EmailDialog.vue"
import FreeProTable from "~/components/FreeProTable.vue"
import userMixin from "~/mixins/userMixin.js"

export default {
    authenticated: true,
    components: {EmailDialog, FreeProTable},
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
        const defaultLinksOn = user && user.isPro ? 0 : this.$store.state.linksOnPercent
        const linksOn = user && user.preferences ? user.preferences.linksOn : defaultLinksOn
        const hashtag = user && user.preferences ? user.preferences.activityHashtag : false
        const twitterShare = user && user.preferences ? user.preferences.twitterShare : false
        const weatherProvider = user && user.preferences ? user.preferences.weatherProvider || null : null
        const weatherUnit = user && user.preferences ? user.preferences.weatherUnit || "c" : "c"
        const listWeatherProviders = _.cloneDeep(this.$store.state.weatherProviders)

        if (!user.isPro) {
            for (let wp of listWeatherProviders) {
                if (wp.value) {
                    wp.disabled = true
                    wp.text += " (PRO only)"
                }
            }
        }

        return {
            savePending: false,
            emailDialog: false,
            emailSaved: false,
            linksOn: linksOn || defaultLinksOn,
            activityHashtag: hashtag,
            twitterShare: twitterShare,
            weatherProvider: weatherProvider,
            weatherUnit: weatherUnit,
            listWeatherProviders: listWeatherProviders,
            listWeatherUnits: [
                {value: "c", text: "Celsius"},
                {value: "f", text: "Fahrenheit"}
            ]
        }
    },
    computed: {
        dateRegistered() {
            return this.$moment(this.user.dateRegistered).format("ll")
        },
        stravaProfileUrl() {
            return `https://www.strava.com/athletes/${this.user.id}`
        }
    },
    watch: {
        linksOn(newValue, oldValue) {
            if (newValue != oldValue) {
                this.savePending = true
                this.delaySavePreferences()
            }
        },
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
        hideEmailDialog(emailSaved) {
            this.emailDialog = false
            this.emailSaved = emailSaved
        },
        async savePreferences() {
            this.savePending = false

            try {
                const data = {
                    linksOn: this.linksOn,
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
