<template>
    <v-layout column>
        <v-container fluid>
            <h1>{{ loggedIn ? "Help" : "Strautomator Help" }}</h1>

            <h2 class="mb-1">About</h2>
            <v-expansion-panels class="mb-5">
                <v-expansion-panel>
                    <v-expansion-panel-header>Who's behind Strautomator?</v-expansion-panel-header>
                    <v-expansion-panel-content>
                        <p>Igor Ramadas. You can find more about him at <a href="https://aboutigor.com" title="About Igor">aboutigor.com</a>.</p>
                        <p>Strautomator is powered by Strava, but it is <strong>not made by</strong> them.</p>
                    </v-expansion-panel-content>
                </v-expansion-panel>
                <v-expansion-panel>
                    <v-expansion-panel-header>Do I need Strava Summit to use it?</v-expansion-panel-header>
                    <v-expansion-panel-content>
                        <p>
                            No. Strautomator also works with free Strava accounts, although some specific activity details might be available to Summit users only.
                        </p>
                    </v-expansion-panel-content>
                </v-expansion-panel>
                <v-expansion-panel>
                    <v-expansion-panel-header>Free vs Pro account, what's the deal?</v-expansion-panel-header>
                    <v-expansion-panel-content>
                        <p>
                            The free account is restricted to only 2 automations, containing a maximum of 2 conditions each.
                        </p>
                        <p>
                            Additionally, free accounts will have a link to strautomator.com added to the description of 20% of processed activites, so 1 out of 5.
                        </p>
                        <p class="font-italic">
                            While we're in beta, everyone gets to try all Pro features for free.
                        </p>
                    </v-expansion-panel-content>
                </v-expansion-panel>
                <v-expansion-panel>
                    <v-expansion-panel-header>How much will it cost?</v-expansion-panel-header>
                    <v-expansion-panel-content>
                        <p>
                            Price not defined yet. Should be around 1 EUR / month or 10 EUR / year. Think that is expensive? Let's do some math...
                        </p>
                        <p>
                            Suppose you earn 20 EUR per hour, and have on average 10 activities per week. Let's round this to 500 activities / year. By using Strautomator you save the 1 minute hassle of opening Strava to update these activities
                            manually. So Strautomator "saves" you 33 cents per activity. In 1 year that's 165 EUR.
                        </p>
                        <p>
                            The calculation above is obviously for fun, but you get the point. We have running costs (domain, servers, weather subscription...) and we hope to cover these by having a few Pro subscriptions running.
                        </p>
                    </v-expansion-panel-content>
                </v-expansion-panel>
            </v-expansion-panels>

            <h2 class="mb-1">Security and privacy</h2>
            <v-expansion-panels class="mb-5">
                <v-expansion-panel>
                    <v-expansion-panel-header>Can Strautomator mess up with my Strava account?</v-expansion-panel-header>
                    <v-expansion-panel-content>
                        <p>
                            Right now we need only 2 set of permissions: read your activities, and write to your activities. We can't delete existing activities, nor create new ones.
                        </p>
                    </v-expansion-panel-content>
                </v-expansion-panel>
                <v-expansion-panel>
                    <v-expansion-panel-header>Will my data be shared with 3rd parties?</v-expansion-panel-header>
                    <v-expansion-panel-content>
                        <p>
                            No. Not now, not ever.
                        </p>
                        <p>
                            When you connect your Strava account to Strautomator, we get some of your basic info (user ID, name and gear) and save it in our own database.
                        </p>
                        <p>
                            When Strava sends us your new activities, we'll store and parse some of its information to run your automations and create your dashboard.
                        </p>
                        <p>
                            If you want more technical details, please note that Strautomator fully
                            <a href="https://github.com/strautomator" title="Strautomator on GitHub">open source</a>.
                        </p>
                    </v-expansion-panel-content>
                </v-expansion-panel>
            </v-expansion-panels>

            <h2 class="mb-1">Automations</h2>
            <v-expansion-panels>
                <v-expansion-panel>
                    <v-expansion-panel-header>When are activities are processed?</v-expansion-panel-header>
                    <v-expansion-panel-content>
                        <p>
                            Activities are processed usually within a few minutes after being created or uploaded to Strava, but depending on the Strava API's load it can take some minutes.
                        </p>
                        <p>
                            Only new activities are processed, so if you make manual updates to an activity on Strava, these will not trigger your automations on Strautomator.
                        </p>
                        <p>
                            In the future we might add support for automations on updated activities as well.
                        </p>
                    </v-expansion-panel-content>
                </v-expansion-panel>
                <v-expansion-panel>
                    <v-expansion-panel-header>The weather details for my activity are wrong.</v-expansion-panel-header>
                    <v-expansion-panel-content>
                        <p>
                            We use Dark Sky, Weatherbit and OpenWeatherMap for weather data. These works wonderfully well most of the times, but on certain regions on certain days a data source might miscalculate the weather. If you're always getting
                            wrong data, please
                            <a href="mailto:info@strautomator.com" title="Bad weather, eh?">contact us</a> and we'll troubleshoot.
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
        </v-container>
    </v-layout>
</template>

<style>
.landing .v-content {
    margin: auto;
    max-width: 600px;
}
.landing .v-content h1 {
    margin-top: 40px;
}
.v-expansion-panel-header {
    line-height: 22px;
}
.v-expansion-panel-header--active {
    font-weight: bold;
}
</style>

<script>
import moment from "moment"

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
            loggedIn: this.$store.state.user
        }
    },
    methods: {
        backHome() {
            document.location.href = "/home"
        }
    }
}
</script>
