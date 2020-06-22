<template>
    <v-layout column>
        <div class="stripe" v-if="!loggedIn"></div>
        <v-container class="text-center" :class="{'help-wrapper': !loggedIn}" fluid>
            <div :class="{'width-wrapper': !loggedIn, 'text-left': loggedIn}">
                <h1 :class="{'mt-10': !loggedIn, 'text-center': !loggedIn}">{{ loggedIn ? "Help" : "Strautomator Help" }}</h1>

                <p>
                    "I" on the questions = you, the user.<br />
                    "I" on the answers = me, Igor.
                </p>

                <h2 class="mb-1">About</h2>
                <v-expansion-panels v-model="panel" class="mb-5" hover>
                    <v-expansion-panel>
                        <v-expansion-panel-header>What exactly can I do with Strautomator?</v-expansion-panel-header>
                        <v-expansion-panel-content>
                            <p>
                                You can automatically update the name, description, gear, commute flag and some other details of your Strava activities, based on your own automation recipes. Each recipe can have multiple conditions, for example
                                distance, average or max speed, power, moving time, start and end location, day of week, weather, GPS device used... and so on.
                            </p>
                            <p>
                                Some common use cases:
                            </p>
                            <ul>
                                <li>Mark rides as commute if going from point A to point B</li>
                                <li>Mark runs as commute if recorded with a specific GPS device</li>
                                <li>Set activity names with distance, power, weather and other data</li>
                                <li>Set the correct bike based on average speed</li>
                                <li>Add weather details to the activity name</li>
                            </ul>
                        </v-expansion-panel-content>
                    </v-expansion-panel>
                    <v-expansion-panel>
                        <v-expansion-panel-header>Who's behind Strautomator?</v-expansion-panel-header>
                        <v-expansion-panel-content>
                            <p>
                                Igor Ramadas. Pleased to meet you :-) You can find more about me at <a href="https://aboutigor.com" title="About Igor">aboutigor.com</a>. And of course, I'm also on
                                <a href="https://www.strava.com/athletes/5649845" title="Igor @ Strava">Strava</a> itself.
                            </p>
                        </v-expansion-panel-content>
                    </v-expansion-panel>
                    <v-expansion-panel>
                        <v-expansion-panel-header>How does it connect to Strava?</v-expansion-panel-header>
                        <v-expansion-panel-content>
                            <p>
                                Once you click or tap the <a title="Connect with Strava" @click="login">"Connect with Strava"</a> button, you'll be redirected to Strava to give Strautomator the necessary permissions to read and update activities on
                                your Strava account. Once permissions are given, Strava will automatically ping the Strautomator service whenever you upload or createa new activities.
                            </p>
                            <p>
                                Everything happens on the cloud, you don't need to install any software on your device(s).
                            </p>
                        </v-expansion-panel-content>
                    </v-expansion-panel>
                    <v-expansion-panel>
                        <v-expansion-panel-header>Do I need a paid Strava to use it?</v-expansion-panel-header>
                        <v-expansion-panel-content>
                            <p>
                                Not at all! It also works with free accounts. Strava has recently made some users unhappy by making some of their features available to paid subscribers only, but that doesn't affect Strautomator.
                            </p>
                        </v-expansion-panel-content>
                    </v-expansion-panel>
                    <v-expansion-panel>
                        <v-expansion-panel-header>Why this instead of Commute Marker, Klimat and other tools?</v-expansion-panel-header>
                        <v-expansion-panel-content>
                            <p>
                                First let me clarify: I used both Commute Marker and Klimat, and they were in fact part of my inspiration to develop Strautomator. So thumbs up to the devs for their amazing work.
                            </p>
                            <p>
                                Now most of these other Strava tools serve a very specific need. Commute Marker to mark commutes based on start and end location. Klimat to add weather data to activities. Then there's IFTTT to integrate with other
                                services. Strautomator is a all-in-one. A jack of all trades.
                            </p>
                            <p>
                                And last but not least: it's
                                <a href="https://github.com/strautomator" title="Strautomator on GitHub">open source</a>.
                            </p>
                        </v-expansion-panel-content>
                    </v-expansion-panel>
                </v-expansion-panels>

                <h2 class="mb-1">Automations</h2>
                <v-expansion-panels class="mb-5" hover>
                    <v-expansion-panel>
                        <v-expansion-panel-header>Which sports are supported?</v-expansion-panel-header>
                        <v-expansion-panel-content>
                            <p>
                                Any activity type that is supported by Strava. But please keep in mind that Strava is mostly focused on cycling and running, so some of the features might make sense only with these 2 sports.
                            </p>
                        </v-expansion-panel-content>
                    </v-expansion-panel>
                    <v-expansion-panel>
                        <v-expansion-panel-header>Metric or imperial system?</v-expansion-panel-header>
                        <v-expansion-panel-content>
                            <p>
                                Kilometers or miles? Strautomator will get the preferences you have set on your Strava account. So if you're using Strava with imperial units, so will your automations.
                            </p>
                            <p>
                                Please be aware that if you change your preferences on Strava, you'll have to update your automations to reflect the new unit. Example: an automation that has "distance > 10 miles" will need to be manually updated to
                                use "distance > 16km".
                            </p>
                        </v-expansion-panel-content>
                    </v-expansion-panel>
                    <v-expansion-panel>
                        <v-expansion-panel-header>When are activities are processed?</v-expansion-panel-header>
                        <v-expansion-panel-content>
                            <p>
                                Usually less than 5 minutes after being created or uploaded to Strava, but depending on their API's load it can take a bit longer. Please note that only new activities are processed. If you manually update an activity
                                on Strava, it will <span class="font-weight-bold">not</span> trigger your automations on Strautomator.
                            </p>
                            <p class="font-italic">In the future I might add support for automations on updated activities as well.</p>
                        </v-expansion-panel-content>
                    </v-expansion-panel>
                    <v-expansion-panel>
                        <v-expansion-panel-header>Some location based automations are not working properly, why?</v-expansion-panel-header>
                        <v-expansion-panel-content>
                            <p>
                                Strautomator uses Google Maps to translate addresses to [lat, lng] coordinates. Sometimes these coordinates might be slightly off, for example pointing to a building instead of the actual street.
                            </p>
                            <p>
                                To fix this, you can set the condition to 650m radius instead of 60m. Or you can simply type the actual (precise) coordinates of your desired location directly on the search field.
                            </p>
                        </v-expansion-panel-content>
                    </v-expansion-panel>
                    <v-expansion-panel>
                        <v-expansion-panel-header>Why are some weather details on my activities wrong?</v-expansion-panel-header>
                        <v-expansion-panel-content>
                            <p>
                                Strautomator is using ClimaCell, Dark Sky, Weatherbit, OpenWeatherMap and WeatherAPI.com to get weather data. On free accounts the actual provider will be selected based on location and API usage. Users with PRO
                                accounts can manually set their preferred weather provider.
                            </p>
                        </v-expansion-panel-content>
                    </v-expansion-panel>
                    <v-expansion-panel>
                        <v-expansion-panel-header>I want a new feature, can you implement it?</v-expansion-panel-header>
                        <v-expansion-panel-content>
                            <p>
                                If it's related to automating tasks related to your Strava activities... then likely, yes. Just drop me a message via email or Twitter with your suggestion, and I'll get back to you soon.
                            </p>
                        </v-expansion-panel-content>
                    </v-expansion-panel>
                </v-expansion-panels>

                <h2 class="mb-1">Free vs. PRO accounts</h2>
                <v-expansion-panels class="mb-5" hover>
                    <v-expansion-panel>
                        <v-expansion-panel-header>Free vs. PRO, what's the deal?</v-expansion-panel-header>
                        <v-expansion-panel-content>
                            <p>
                                Feature-wise they're almost the same. The free account is restricted to {{ $store.state.freePlanDetails.maxRecipes }} automations, containing a maximum of {{ $store.state.freePlanDetails.maxConditions }} conditions
                                each. Additionally, free accounts will have a link to strautomator.com added to the description of {{ $store.state.linksOnPercent }}% of processed activites (1 out of 5) by default. You can change this value on your
                                account preferences.
                            </p>
                            <p>
                                Users who subscribe to PRO will have no limits on automations or conditions, no backlinks added to activity descriptions, and access to extra features like choosing their weather provider and using webhooks.
                            </p>
                            <p>PRO costs ${{ $store.state.proPlanDetails.price.year.toFixed(2) }} / year via PayPal or ${{ $store.state.proPlanDetails.githubPrice.toFixed(2) }} / month via GitHub.</p>
                        </v-expansion-panel-content>
                    </v-expansion-panel>
                    <v-expansion-panel>
                        <v-expansion-panel-header>Why should I pay to get PRO?</v-expansion-panel-header>
                        <v-expansion-panel-content>
                            <p>
                                <span class="font-weight-bold">A valid question!</span>
                                The free account should be sufficient to the vast majority of users. But if you have dozens of weekly activities and want to automate them to the fullest, PRO is the way to go.
                            </p>
                            <p>
                                Suppose you earn $15 per hour, and have on average 1 activity per day. Let's round to 350 activities / year. By using Strautomator, you save that 1 minute hassle of opening Strava to update these activities manually.
                                So it can potentially save you around 25 cents per activity. If half of your activities are automated, in 1 year that's around $44.
                            </p>
                            <p>
                                The calculation above is obviously a bit silly, but you get the point. There are running costs (domain, servers, weather APIs...) and I hope to at least cover these costs with a few PRO subscribers.
                            </p>
                        </v-expansion-panel-content>
                    </v-expansion-panel>
                    <v-expansion-panel>
                        <v-expansion-panel-header>Can I get PRO for free?</v-expansion-panel-header>
                        <v-expansion-panel-content>
                            <p>
                                Kind of. You can grab the
                                <a href="https://github.com/strautomator" title="Strautomator @ GitHub">source code</a> and deploy your own instance of Strautomator. I will be glad to help if you want to get it running on your own server.
                            </p>
                        </v-expansion-panel-content>
                    </v-expansion-panel>
                </v-expansion-panels>

                <h2 class="mb-1">Security and privacy</h2>
                <v-expansion-panels hover>
                    <v-expansion-panel>
                        <v-expansion-panel-header>Can Strautomator mess up my Strava?</v-expansion-panel-header>
                        <v-expansion-panel-content>
                            <p>
                                If you connect with your Strava account, Strautomator will have permissions to read and update your activities. The service can't delete existing activities, nor create new ones.
                            </p>
                            <p>
                                But of course you have to be reasonable with your automations. If you create a recipe with a single condition to update rides longer than 1km, for instance, it will very likely update all your future rides.
                            </p>
                        </v-expansion-panel-content>
                    </v-expansion-panel>
                    <v-expansion-panel>
                        <v-expansion-panel-header>Are my GPS coordinates stored by Strautomator?</v-expansion-panel-header>
                        <v-expansion-panel-content>
                            <p>
                                No. Strautomator might process the "start" and "end" locations of your activities in memory, if you have automations based on these conditions. But it won't store the activity coordinates anywhere.
                            </p>
                        </v-expansion-panel-content>
                    </v-expansion-panel>
                    <v-expansion-panel>
                        <v-expansion-panel-header>Will my data be shared with 3rd parties?</v-expansion-panel-header>
                        <v-expansion-panel-content>
                            <p>
                                No. Not today, not tomorrow, not ever.
                            </p>
                            <p>
                                When you connect your Strava account to Strautomator, it gets some of your basic info about your Strava account (user ID, name, gears, etc), and this information is used solely within the service.
                            </p>
                            <p>
                                When Strava sends your activities to Strautomator, it will parse some of the information to run your automations and create your online dashboard. After parsing, the basic details about the activity (mostly the ID,
                                name and date) will be stored on the service database for historical purposes.
                            </p>
                        </v-expansion-panel-content>
                    </v-expansion-panel>
                    <v-expansion-panel>
                        <v-expansion-panel-header>What happens when I close my account?</v-expansion-panel-header>
                        <v-expansion-panel-content>
                            <p>
                                If you decide to cancel your Strautomator account, there's no way to restore any of the data that the system had previously processed. All your recipes will vanish into thin air. The connection we have will be killed
                                and Strautomator will be deauthorized from your Strava account. If you have a running PRO subscription on PayPal, this will also be cancelled.
                            </p>
                            <p>
                                And if there's any feedback you might want to share, I'm all ears.
                            </p>
                        </v-expansion-panel-content>
                    </v-expansion-panel>
                </v-expansion-panels>

                <div class="mt-10 text-center" v-if="!loggedIn">
                    <a title="Connect with Strava..." @click="login()"><img class="strava-connect" src="/images/strava-connect.svg"/></a>
                </div>

                <div class="mt-10 mb-4 text-center" title="Back to Strautomator home..." v-if="!loggedIn">
                    <v-btn color="primary" @click="backHome" rounded>Back to home...</v-btn>
                </div>
            </div>
        </v-container>
    </v-layout>
</template>

<style scoped>
.help-wrapper {
    position: relative;
    z-index: 99;
}
.v-expansion-panel-header {
    line-height: 22px;
}
.v-expansion-panel-header--active {
    font-weight: bold;
}
.v-expansion-panel-content {
    padding-top: 8px;
}
</style>

<script>
export default {
    authenticated: false,
    layout({store}) {
        if (!store.state.oauth || !store.state.user) {
            return "landing"
        } else {
            return "default"
        }
    },
    head() {
        return {
            title: "Help"
        }
    },
    data() {
        return {
            loggedIn: this.$store.state.oauth && this.$store.state.user,
            billingPlanSummaries: [],
            panel: null
        }
    },
    async fetch() {
        try {
            const billingPlans = Object.values(await this.$axios.$get("/api/paypal/billingplans"))
            this.billingPlanSummaries = []
            for (let plan of billingPlans) {
                this.billingPlanSummaries.push(`${plan.price} / ${plan.frequency}`)
            }
        } catch (ex) {
            this.$webError("Help.fetch", ex)
        }
    },
    methods: {
        backHome() {
            document.location.href = "/home"
        },
        login() {
            this.$login()
        }
    }
}
</script>
