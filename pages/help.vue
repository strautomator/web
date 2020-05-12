<template>
    <v-layout column>
        <v-container class="text-center" fluid>
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
                                You can automatically update the name, description, gear, commute flag and some other details of your Strava activities, based on "recipes" that you create. Each recipe can have multiple conditions, for example
                                distance, average or max speed, power, moving time, start and end location, day of week, weather, GPS device used... and so on.
                            </p>
                            <p>
                                Some common use cases:
                            </p>
                            <ul>
                                <li>Mark rides as commute if going from point A to point B</li>
                                <li>Mark runs as commute if recorded with a specific GPS device</li>
                                <li>Set the correct bike based on ride speed</li>
                                <li>Add weather details to the activity name</li>
                            </ul>
                        </v-expansion-panel-content>
                    </v-expansion-panel>
                    <v-expansion-panel>
                        <v-expansion-panel-header>Who's behind Strautomator?</v-expansion-panel-header>
                        <v-expansion-panel-content>
                            <p>Igor Ramadas. Pleased to meet you. You can find more about me at <a href="https://aboutigor.com" title="About Igor">aboutigor.com</a>.</p>
                            <p>Strautomator is powered by Strava, but it is <strong>not made by</strong> them.</p>
                        </v-expansion-panel-content>
                    </v-expansion-panel>
                    <v-expansion-panel>
                        <v-expansion-panel-header>How does the connection with Strava work?</v-expansion-panel-header>
                        <v-expansion-panel-content>
                            <p>
                                Once you click or tap the <a title="Connect with Strava" @click="login">"Connect with Strava"</a> button, you'll be redirected to Strava to give Strautomator the necessary permissions to read and update activities on
                                your Strava account. Once permissions are given, Strava will automatically ping the Strautomator service whenever you upload or createa new activity.
                            </p>
                            <p>
                                Everything happens on the cloud. You don't need to install any extra software on your devices.
                            </p>
                        </v-expansion-panel-content>
                    </v-expansion-panel>
                    <v-expansion-panel>
                        <v-expansion-panel-header>Do I need Strava Summit to use it?</v-expansion-panel-header>
                        <v-expansion-panel-content>
                            <p>
                                Not at all! Strautomator also works with free Strava accounts.
                            </p>
                        </v-expansion-panel-content>
                    </v-expansion-panel>
                    <v-expansion-panel>
                        <v-expansion-panel-header>Why this instead of Commute Marker, Klimat and other tools?</v-expansion-panel-header>
                        <v-expansion-panel-content>
                            <p>
                                First let me clarify: I used both Commute Marker and Klimat, and they were in fact part of my inspiration to develop Strautomator. So thumbs up to their devs for their amazing work.
                            </p>
                            <p>
                                Now most of these other Strava tools serve a very specific need. Commute Marker to mark commutes based on start and end location. Klimat to add weather data to the activity description. Then there's IFTTT to integrate
                                with other services. Strautomator is a all-in-one.
                            </p>
                            <p>
                                And finally: Strautomator is
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
                                At the moment Strautomator is mostly focused on cycling and running, but in theory it should support all activity types. If you have issues (or suggestions) with a specific sport, please let me know.
                            </p>
                        </v-expansion-panel-content>
                    </v-expansion-panel>
                    <v-expansion-panel>
                        <v-expansion-panel-header>Metric or imperial system?</v-expansion-panel-header>
                        <v-expansion-panel-content>
                            <p>
                                Kilometers or miles? Strautomator will get the preferences you have set on your Strava account. So if you're using Strava with imperial units, your automations should also use them.
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
                                on Strava, it will not trigger your automations on Strautomator.
                            </p>
                            <p class="font-italic">In the future I might add support for automations on updated activities as well.</p>
                        </v-expansion-panel-content>
                    </v-expansion-panel>
                    <v-expansion-panel>
                        <v-expansion-panel-header>Why are some weather details on my activities wrong?</v-expansion-panel-header>
                        <v-expansion-panel-content>
                            <p>
                                Strautomator is using Dark Sky, Weatherbit and OpenWeatherMap for weather data. These works wonderfully well most of the time, but on certain regions on certain days they might miscalculate the weather.
                            </p>
                            <p>
                                You can set your preferred weather provider on your Account page.
                            </p>
                        </v-expansion-panel-content>
                    </v-expansion-panel>
                </v-expansion-panels>

                <h2 class="mb-1">Donations and PRO</h2>
                <v-expansion-panels class="mb-5" hover>
                    <v-expansion-panel>
                        <v-expansion-panel-header>Free vs PRO account, what's the deal?</v-expansion-panel-header>
                        <v-expansion-panel-content>
                            <p>
                                Feature-wise, they're basically the same. The forever-free account is restricted to only 3 automations, containing a maximum of 3 conditions each. Additionally, free accounts will have a link to strautomator.com added
                                to the description of {{ $store.state.linksOnPercent }}% of processed activites (1 out of 5).
                            </p>
                            <p>
                                Users who <n-link :to="loggedIn ? '/donate' : '/donate/register'" title="Donate now!">donate</n-link>
                                will get a PRO account with no limits and no automated links.
                            </p>
                        </v-expansion-panel-content>
                    </v-expansion-panel>
                    <v-expansion-panel>
                        <v-expansion-panel-header>Why should I donate?</v-expansion-panel-header>
                        <v-expansion-panel-content>
                            <p>
                                <span class="font-weight-bold">A valid question!</span> Suppose you earn 18 EUR per hour, and have on average 1 activity per day. We'll round to 350 activities / year. By using Strautomator you save that 1 minute
                                hassle of opening Strava to update these activities manually. So it can potentially save you 30 cents per activity. In 1 year that's around 105 EUR.
                            </p>
                            <p>
                                The calculation above is obviously a bit silly, but you get the point. There are running costs (domain, servers, weather APIs...) and I hope to at least cover these costs with some of your donations.
                            </p>
                        </v-expansion-panel-content>
                    </v-expansion-panel>
                    <v-expansion-panel>
                        <v-expansion-panel-header>How can I donate?</v-expansion-panel-header>
                        <v-expansion-panel-content>
                            <p>
                                I have integrated with PayPal to make donations as friction-free as possible, via recurring subscriptions: {{ billingPlanSummaries.join(" or ") }}. PayPal is very popular and trusted by many people. And I won't need to
                                know any of your payment details.
                            </p>
                            <p>
                                If you prefer you can also support via <a href="https://github.com/sponsors/igoramadas" title="Sponsor me @ GitHub">GitHub sponsors</a>, or directly via
                                <a href="https://bunq.me/strautomator" title="Donate via bunq">bunq</a>.
                            </p>
                        </v-expansion-panel-content>
                    </v-expansion-panel>
                    <v-expansion-panel>
                        <v-expansion-panel-header>Can I get a PRO account without a donation?</v-expansion-panel-header>
                        <v-expansion-panel-content>
                            <p>
                                If you have a good reason... and as long as the that reason can help me maintain or improve the service... then yeah, sure, just
                                <a href="mailto:info@strautomator.com?subject=Strautomator PRO" title="Wanna be a PRO?">drop me an email</a> and I'll think about it.
                            </p>
                            <p>
                                Or you can simply grab the
                                <a href="https://github.com/strautomator" title="Strautomator @ GitHub">source code</a> and deploy your own version. It's free.
                            </p>
                        </v-expansion-panel-content>
                    </v-expansion-panel>
                </v-expansion-panels>

                <h2 class="mb-1">Security and privacy</h2>
                <v-expansion-panels hover>
                    <v-expansion-panel>
                        <v-expansion-panel-header>Can Strautomator mess up with my Strava account?</v-expansion-panel-header>
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
                                and Strautomator will be deauthorized from your Strava account. If you have a running donation on PayPal, this will also be cancelled.
                            </p>
                            <p>
                                And if there's any feedback you might want to share, I'm all ears.
                            </p>
                        </v-expansion-panel-content>
                    </v-expansion-panel>
                </v-expansion-panels>

                <div class="mt-10 text-center" v-if="!loggedIn">
                    <a title="Connect with Strava..." @click="login()"><img src="/images/strava-connect.svg"/></a>
                </div>

                <div class="mt-10 mb-4 text-center" title="Back to Strautomator home..." v-if="!loggedIn">
                    <v-btn color="primary" @click="backHome" rounded>Back to home...</v-btn>
                </div>
            </div>
        </v-container>
    </v-layout>
</template>

<style scoped>
.v-expansion-panel-header {
    line-height: 22px;
}
.v-expansion-panel-header--active {
    font-weight: bold;
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
            panel: 0
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
