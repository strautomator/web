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
                        <v-expansion-panel-header>Who's behind Strautomator?</v-expansion-panel-header>
                        <v-expansion-panel-content>
                            <p>Igor Ramadas. Pleased to meet you. You can find more about me at <a href="https://aboutigor.com" title="About Igor">aboutigor.com</a>.</p>
                            <p>Strautomator is powered by Strava, but it is <strong>not made by</strong> them.</p>
                        </v-expansion-panel-content>
                    </v-expansion-panel>
                    <v-expansion-panel>
                        <v-expansion-panel-header>Do I need Strava Summit to use it?</v-expansion-panel-header>
                        <v-expansion-panel-content>
                            <p>
                                Not at all! Strautomator also works with free Strava accounts, although some specific activity details might be available to Summit users only.
                            </p>
                        </v-expansion-panel-content>
                    </v-expansion-panel>
                    <v-expansion-panel>
                        <v-expansion-panel-header>Free vs PRO account, what's the deal?</v-expansion-panel-header>
                        <v-expansion-panel-content>
                            <p>
                                Feature-wise, they're basically the same. The free account is restricted to only 3 automations, containing a maximum of 3 conditions each. Additionally, free accounts will have a link to strautomator.com added to the
                                description of 20% of processed activites, so 1 out of 5.
                            </p>
                            <p>Supportes who <n-link :to="loggedIn ? '/donate' : '/donate/register'" title="Donate now!">donate</n-link> will get these limitations lifted. Supportes = PRO.</p>
                            <p class="font-italic">
                                While in beta, everyone gets to be a PRO regardless of any donations.
                            </p>
                        </v-expansion-panel-content>
                    </v-expansion-panel>
                    <v-expansion-panel>
                        <v-expansion-panel-header>How can I donate?</v-expansion-panel-header>
                        <v-expansion-panel-content>
                            <p>I have integrated with PayPal to make donations possible via recurring subscriptions: {{ billingPlanSummaries.join(" or ") }}. If you prefer you can also support via GitHub sponsors, or directly via bunq.</p>
                            <p>
                                <span class="font-weight-bold">Why donate, you might ask?</span> Suppose you earn 18 EUR per hour, and have on average 1 activity per day. We'll round to 350 activities / year. By using Strautomator you save that 1
                                minute hassle of opening Strava to update these activities manually. So it can potentially save you 30 cents per activity. In 1 year that's around 105 EUR.
                            </p>
                            <p>
                                The calculation above is obviously a bit silly, but you get the point. There are running costs (domain, servers, weather APIs...) and I hope to at least cover these costs with some of your donations.
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
                        </v-expansion-panel-content>
                    </v-expansion-panel>
                    <v-expansion-panel>
                        <v-expansion-panel-header>Why this instead of Commute Marker, Klimat and other tools?</v-expansion-panel-header>
                        <v-expansion-panel-content>
                            <p>
                                First let me clarify: I used both Commute Marker and Klimat, and they were in fact part my inspiration to develop Strautomator. So thumbs up to their devs for their amazing work.
                            </p>
                            <p>
                                Now most of these other Strava tools serve a very specific need. Commute Marker to mark commutes based on start and end location. Klimat to add weather data to the activity description. Then there's IFTTT to integrate
                                with other services. Strautomator is a all-in-one.
                            </p>
                        </v-expansion-panel-content>
                    </v-expansion-panel>
                </v-expansion-panels>

                <h2 class="mb-1">Automations</h2>
                <v-expansion-panels class="mb-5" hover>
                    <v-expansion-panel>
                        <v-expansion-panel-header>Metric or imperial system?</v-expansion-panel-header>
                        <v-expansion-panel-content>
                            <p>
                                Kilometers or miles? Strautomator will get the preferences you have set on your Strava account. So if you're using Strava with imperial units, your automations should also use them.
                            </p>
                        </v-expansion-panel-content>
                    </v-expansion-panel>
                    <v-expansion-panel>
                        <v-expansion-panel-header>When are activities are processed?</v-expansion-panel-header>
                        <v-expansion-panel-content>
                            <p>
                                Usually less than 5 minutes after being created or uploaded to Strava, but depending on the Strava API's load it can take longer.
                            </p>
                            <p>
                                Only new activities are processed, so if you make manual updates to an activity on Strava, these will not trigger your automations on Strautomator.
                                <span class="font-italic">In the future I might add support for automations on updated activities as well.</span>
                            </p>
                        </v-expansion-panel-content>
                    </v-expansion-panel>
                    <v-expansion-panel>
                        <v-expansion-panel-header>Why are some weather details about my activities wrong?</v-expansion-panel-header>
                        <v-expansion-panel-content>
                            <p>
                                Strautomator is using Dark Sky, Weatherbit and OpenWeatherMap for weather data. These works wonderfully well most of the times, but on certain regions on certain days they might miscalculate the weather. If you're
                                always getting wrong data, please
                                <a href="mailto:info@strautomator.com" title="Bad weather, eh?">contact me</a> and I'll sort it out.
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
                        <v-expansion-panel-header>Will my data be shared with 3rd parties?</v-expansion-panel-header>
                        <v-expansion-panel-content>
                            <p>
                                No. Not today, not tomorrow, not ever.
                            </p>
                            <p>
                                When you connect your Strava account to Strautomator, it gets some of your basic info about your Strava account (user ID, name and gear). This information is used solely to enable the automation features.
                            </p>
                            <p>
                                When Strava sends your new activities to Strautomator, it will store and parse some of the information to run your automations and create your online dashboard. If you want more technical details, please note that
                                Strautomator
                                <a href="https://github.com/strautomator" title="Strautomator on GitHub">open source</a>. Feel free to do some bug hunting or suggest things to be done differently.
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
