<template>
    <v-content fluid>
        <div class="stripe"></div>
        <div class="py-2"></div>

        <v-container class="text-center" fluid>
            <div class="home-wrapper">
                <h1 class="font-weight-light mt-1 mb-2" :class="$breakpoint.mdAndUp ? 'display-1' : 'headline'">
                    Automate your Strava activities
                </h1>
                <div>with</div>
                <h2 class="display-2 font-weight-bold mb-4">Strautomator</h2>

                <v-card color="black" class="mb-5 home-panel">
                    <v-card-text>
                        <div class="home-faq mt-6 px-1 text-left">
                            <h2>How does it work?</h2>
                            <div>
                                <p>
                                    First you connect Strautomator to your Strava account. Then you can create automations to automagically update your activities based on any of its properties, including weather conditions.
                                </p>
                                <p>
                                    Like IFTTT, but for Strava. And it's open source.
                                </p>
                            </div>
                            <h2>Is it free?</h2>
                            <div>
                                <p>
                                    Yes, for up to {{ $store.state.freePlanDetails.maxRecipes }} automation recipes. Unlimited recipes and extra features are available to PRO subscribers for ${{ $store.state.proPlanDetails.price.year }}
                                    / year, paid via PayPal.
                                </p>
                            </div>
                            <h2>Ready?</h2>
                            <div>
                                <p>
                                    Start by connecting your Strava account...
                                </p>
                            </div>
                        </div>

                        <div class="mt-6 mb-8">
                            <a title="Connect with Strava..." @click="login()"><img class="strava-connect" src="/images/strava-connect.svg"/></a>
                        </div>

                        <h3 class="mt-10">Want to know more?</h3>
                        <div>
                            <p>
                                <n-link to="/help" title="Strautomator's Help">Check the help section</n-link>
                            </p>
                        </div>

                        <h2 class="display-1 font-weight-light mt-8 mb-4">Automation ideas</h2>

                        <v-responsive>
                            <div class="fade-out-in" v-for="(sample, index) in samples" :key="`sample-${index}`">
                                <div class="home-chip" :class="sampleAlignClass(index)">
                                    <span class="if primary--text" v-if="sample.condition">If</span>
                                    <span class="condition" v-if="sample.condition">{{ sample.condition }}<br v-if="$breakpoint.mdAndUp"/></span>
                                    <span class="then primary--text" v-if="sample.condition">then</span>
                                    <span class="primary--text" v-else>Always</span>
                                    <span class="action">{{ sample.action }}</span>
                                </div>
                            </div>
                        </v-responsive>
                    </v-card-text>
                </v-card>
            </div>
        </v-container>
    </v-content>
</template>

<style>
.home-wrapper {
    max-width: 660px;
    margin: auto;
    position: relative;
    z-index: 99;
}

.home-panel {
    box-shadow: 0 0 1px 0 #ffa000;
}

.home-chip {
    background: rgb(33, 33, 33);
    border-radius: 6px;
    clear: both;
    display: inline-block;
    margin: 5px 10px 5px 10px;
    max-width: 460px;
    padding: 8px 14px 8px 14px;
    position: relative;
}

.home-chip .if,
.home-chip .then {
    font-weight: bold;
}

.home-faq h2 {
    margin-left: -1px;
    margin-bottom: 5px;
}

.home-faq div {
    margin-bottom: 20px;
}
</style>

<script>
import _ from "lodash"

export default {
    layout: "landing",
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
                action: "add weather data to activity descriptions"
            },
            {
                action: "link your blog on the activity description"
            }
        ]

        return {
            samples: _.sampleSize(allSamples, 5)
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
        }
    }
}
</script>
