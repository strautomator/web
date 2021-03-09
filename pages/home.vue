<template>
    <v-main fluid>
        <div class="stripe"></div>
        <div class="py-2"></div>

        <v-container class="text-center" fluid>
            <div class="home-wrapper">
                <h1 class="font-weight-light mt-1 mb-2" :class="$breakpoint.mdAndUp ? 'display-1' : 'headline'">
                    Automate your Strava
                </h1>
                <div>with</div>
                <h2 class="display-2 font-weight-bold mb-4">Strautomator</h2>

                <div class="mt-6 mb-2">
                    <a title="Connect with Strava..." @click="login()"><img class="strava-connect" src="/images/strava-connect.svg"/></a>
                </div>

                <v-card color="black" class="mb-2 home-panel">
                    <v-card-text>
                        <div class="home-faq mt-2 px-1 text-left">
                            <h2>How does it work?</h2>
                            <div>
                                <p>
                                    First you connect Strautomator to your Strava account. Then you create automations to automagically update your activities based on its properties like distance, speed, heart rate, time, location, weather, and many
                                    more.
                                </p>
                                <p>
                                    You can also register your bike components to get an email letting you know when it's time to replace them. Never forget to swap a chain again!
                                </p>
                                <p>
                                    New features and automation possibilities are being constantly added!
                                </p>
                            </div>
                        </div>

                        <v-responsive>
                            <div class="fade-out-in" v-for="(sample, index) in samples" :key="`sample-${index}`">
                                <div class="home-chip" :class="sampleAlignClass(index)">
                                    <span class="c-if primary--text">If</span>
                                    <span class="condition">{{ sample.condition }}<br v-if="$breakpoint.mdAndUp"/></span>
                                    <span class="c-then primary--text">then</span>
                                    <span class="action">{{ sample.action }}</span>
                                </div>
                            </div>
                        </v-responsive>

                        <div class="home-faq mt-8 px-1 text-left">
                            <h2>Is it free?</h2>
                            <div>
                                <p>
                                    Yes, for up to {{ $store.state.freePlanDetails.maxRecipes }} automation and {{ $store.state.freePlanDetails.maxGearWear }} GearWear configurations, which should be enough for the vast majority of users. Unlimited
                                    automations, GearWear and extra other features can be unlocked with a PRO subscription for ${{ $store.state.proPlanDetails.price.year }}
                                    / year, paid via PayPal.
                                </p>
                            </div>
                            <free-pro-table />
                        </div>

                        <div class="mt-6 mb-6">
                            <a title="Connect with Strava..." @click="login()"><img class="strava-connect" src="/images/strava-connect.svg"/></a>
                        </div>
                    </v-card-text>
                </v-card>

                <feature-links />

                <h2 class="display-1 font-weight-light mt-8 mb-4">Screenshots</h2>

                <v-carousel height="600" :interval="5500" cycle continuous hide-delimiter-background show-arrows-on-hover>
                    <v-carousel-item>
                        <img class="home-screenshot" src="/images/screenshot-1.jpg" />
                    </v-carousel-item>
                    <v-carousel-item>
                        <img class="home-screenshot" src="/images/screenshot-2.jpg" />
                    </v-carousel-item>
                    <v-carousel-item>
                        <img class="home-screenshot" src="/images/screenshot-3.jpg" />
                    </v-carousel-item>
                    <v-carousel-item>
                        <img class="home-screenshot" src="/images/screenshot-4.jpg" />
                    </v-carousel-item>
                    <v-carousel-item>
                        <img class="home-screenshot" src="/images/screenshot-5.jpg" />
                    </v-carousel-item>
                </v-carousel>

                <h3 class="mt-8">Want to know more?</h3>
                <div>
                    <v-btn class="mt-2 mb-2" color="primary" to="/help" nuxt rounded>Help Section</v-btn>
                </div>
            </div>
        </v-container>
        <div id="cookie-panel" class="hidden">
            <div class="wrapper columns">
                <div class="column has-text-left-tablet">
                    <span class="is-size-7"></span>
                </div>
                <div class="column is-one-fifth">
                    <button id="but-cookie" class="button is-rounded is-pulled-right-mobile-only is-size-7">Accept cookies</button>
                </div>
            </div>
        </div>
        <v-snackbar v-model="showCookieConsent" color="accent" class="caption" :timeout="600000" multi-line bottom>
            This website is using cookies!
            <template v-slot:action="{attrs}">
                <v-btn v-bind="attrs" @click="acceptCookies" title="Alright, sir!">Accept</v-btn>
            </template>
        </v-snackbar>
    </v-main>
</template>

<script>
import _ from "lodash"
import FeatureLinks from "~/components/FeatureLinks.vue"
import FreeProTable from "~/components/FreeProTable.vue"

export default {
    layout: "landing",
    components: {FeatureLinks, FreeProTable},
    head() {
        return {
            title: "Automate your Strava"
        }
    },
    data() {
        const allSamples = [
            {
                condition: "ride starts at Alexanderplatz, ends at Potsdam",
                action: "mark it as commute and set bike to 'Cityrad'"
            },
            {
                condition: "run is recorded with a Polar device",
                action: "mark it as commute and set name to 'Run2work'"
            },
            {
                condition: "avg. power is higher than 300 watts",
                action: "name the activity 'Suffer test'"
            },
            {
                condition: "avg. speed higher than 35kph on Monday",
                action: "set bike to 'Aero', activity name to 'Fast Mondays'"
            },
            {
                condition: "activity starts before 6AM",
                action: "set the activity name to 'Early bird'"
            },
            {
                condition: "ride is recorded with a Garmin Edge 130",
                action: "mark it as commute and name it 'B2W'"
            },
            {
                condition: "ride distance is around 300km",
                action: "set the activity name to 'Audax 300'"
            },
            {
                condition: "ride ends at the beach house",
                action: "set the activity name to 'Beach time!'"
            },
            {
                condition: "ride passes on Central Park and has more than 20km",
                action: "set the activity name to 'Central Park loops'"
            },
            {
                condition: "temperature is under 0°C and avg. speed under 20kph",
                action: "set the activity name to 'Frosty commute'"
            },
            {
                condition: "wind speed higher than 20 m/s",
                action: "set the description to 'Windy as hell'"
            },
            {
                condition: "activity is a bike ride",
                action: "add weather data to activity descriptions"
            },
            {
                condition: "activity passes on a specific location",
                action: "append a link on the activity description"
            },
            {
                condition: "bike chain reaches 4000km",
                action: "alert me to swap it via email"
            },
            {
                condition: "bike tires reaches 8500km",
                action: "alert me to swap it via email"
            },
            {
                condition: "bike cassette reaches 12000km",
                action: "alert me to swap it via email"
            },
            {
                condition: "temperature is over 30°C",
                action: "append a weather icon to the activity name"
            },
            {
                condition: "activity is a virtual ride",
                action: "prepend the weather details to the activity name"
            },
            {
                condition: "bike chain has over 5000km",
                action: "alert me via email"
            },
            {
                condition: "bike chain has over 5000km",
                action: "alert me via email"
            },
            {
                condition: "bike tires were used for longer than 2 years",
                action: "alert me via email"
            },
            {
                condition: "activity passes on my favourite bakery",
                action: "name it Cake Ride with an auto-incrementing counter"
            },
            {
                condition: "short rides to work",
                action: "mark as commute and add a counter to the activity name"
            },
            {
                condition: "no hard efforts during the past weeks",
                action: "decrease my FTP setting on Strava"
            }
        ]

        let displayCookieConsent = true
        try {
            displayCookieConsent = !(this.$cookies.get("cookie-consent", {parseJSON: false}) || false)
        } catch (ex) {}

        return {
            showCookieConsent: displayCookieConsent,
            samples: _.sampleSize(allSamples, 7),
            screenshot: 0
        }
    },
    methods: {
        login() {
            this.$login()
        },
        sampleAlignClass(index) {
            if (index % 3 == 0) {
                return "float-left text-left"
            }
            if (index % 3 == 1) {
                return "float-right text-right"
            }
            return "text-center"
        },
        acceptCookies() {
            try {
                this.$cookies.set("cookie-consent", true, {
                    path: "/",
                    maxAge: 60 * 60 * 24 * 365 * 10
                })

                this.showCookieConsent = false
            } catch (ex) {}
        },
        nextScreenshot() {
            this.screenshot = this.screenshot + 1 === this.length ? 0 : this.screenshot + 1
        },
        prevScreenshot() {
            this.screenshot = this.screenshot - 1 < 0 ? this.length - 1 : this.screenshot - 1
        }
    }
}
</script>
