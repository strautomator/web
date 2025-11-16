<template>
    <v-main fluid>
        <div class="stripe"></div>
        <div class="py-2"></div>

        <v-container class="text-center" fluid>
            <div class="home-wrapper">
                <h1 class="font-weight-light mt-1 mb-2" :class="$breakpoint.mdAndUp ? 'display-1' : 'headline'">Enhance your Strava</h1>
                <div>with</div>
                <h2 class="display-2 font-weight-bold mb-4">Strautomator</h2>

                <div class="mt-6 mb-2">
                    <a title="Connect with Strava..." @click="login()"><img class="strava-connect" src="/images/strava-connect.svg" /></a>
                </div>

                <v-card color="black" class="mb-2 home-panel">
                    <v-card-text>
                        <div class="home-faq mt-4 px-1 text-left">
                            <h2>What can it do?</h2>
                            <div>
                                <ul class="ml-4 pl-0">
                                    <li>Tag your commutes.</li>
                                    <li>Set the correct gear based on the activity metadata, date, sensors and more.</li>
                                    <li>Set the default shoes for runs, walks and hikes, or bike for rides, MTB and gravel.</li>
                                    <li>Add detailed weather information to activity names and descriptions.</li>
                                    <li>Give your activities super cool and unique names, generated using AI.</li>
                                    <li>Get personalized insights and suggestions about your activities, powered by AI.</li>
                                    <li>Add the Spotify tracks (or lyrics) that you were listening to during your workouts.</li>
                                    <li>Track the usage and get notified when you need to replace your bike components.</li>
                                    <li>Export your past activities and upcoming club events to .ics calendars.</li>
                                    <li>Show your upcoming club events directly on a map, with weather forecasts.</li>
                                    <li>Estimate and automatically update your FTP based on your recent performance.</li>
                                    <li>And a lot more!</li>
                                </ul>
                            </div>
                        </div>

                        <div class="home-faq mt-2 px-1 text-left">
                            <h2>How does it work?</h2>
                            <div>
                                <p>All you need to do is connect your Strava account to Strautomator and start using its features.</p>
                            </div>
                        </div>

                        <v-responsive>
                            <div class="fade-out-in">
                                <div v-for="(sample, index) in samples" :key="`sample-${index}`">
                                    <div class="home-chip" :class="sampleAlignClass(index)">
                                        <span class="c-if primary--text">If</span>
                                        <span class="condition">{{ sample.condition }}<br v-if="$breakpoint.mdAndUp" /></span>
                                        <span class="c-then primary--text">then</span>
                                        <span class="action">{{ sample.action }}</span>
                                    </div>
                                </div>
                            </div>
                        </v-responsive>

                        <div class="home-faq mt-8 px-1 text-left">
                            <h2>Is it free?</h2>
                            <div>
                                <p>
                                    The basic features, including {{ $store.state.freePlanDetails.maxRecipes }} automations and {{ $store.state.freePlanDetails.maxGearWear }} gear configurations, are free. Unlimited automations, gears and more
                                    advanced features can be unlocked with a paid PRO subscription.
                                </p>
                            </div>
                            <free-pro-table />
                        </div>

                        <div class="mt-6">
                            <a title="Connect with Strava..." @click="login()"><img class="strava-connect" src="/images/strava-connect.svg" /></a>
                        </div>
                    </v-card-text>
                </v-card>

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
                    <v-btn class="mt-2 mb-2" color="primary" to="/help" nuxt rounded>
                        <v-icon left>mdi-help-circle</v-icon>
                        Help section
                    </v-btn>
                </div>

                <feature-links />
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
            },
            {
                condition: "virtual rides using Zwift",
                action: "add my Spotify playlist to the activity description"
            },
            {
                condition: "sport type is ride or gravel ride",
                action: "generate the activity name using AI"
            },
            {
                condition: "sport type is run or hike",
                action: "generate the activity description using AI"
            }
        ]

        let displayCookieConsent = true
        try {
            displayCookieConsent = !(this.$cookies.get("cookie-consent", {parseJSON: false}) || false)
        } catch (ex) {}

        return {
            showCookieConsent: displayCookieConsent,
            allSamples: allSamples,
            samples: _.sampleSize(allSamples, 6),
            timerSamples: null,
            screenshot: 0
        }
    },
    mounted() {
        const domRef = document.getElementsByClassName("fade-out-in")[0]
        const refreshSamples = () => {
            const hide = () => domRef.classList.add("hidden")
            const show = () => {
                this.samples = _.sampleSize(this.allSamples, 6)
                domRef.classList.remove("hidden")
            }
            hide()
            setTimeout(show, 1000)
        }
        this.timerSamples = setInterval(refreshSamples, 8000)
    },
    unmounted() {
        clearInterval(this.timerSamples)
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
