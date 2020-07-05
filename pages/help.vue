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

                <v-text-field v-model="searchValue" label="Search" class="mt-2" rounded outlined></v-text-field>

                <div v-for="faq in faqList" :key="'faq-' + faq.title">
                    <h2 class="mb-1">{{ faq.title }}</h2>
                    <v-expansion-panels class="mb-5" :value="searchExpand(faq)" multiple hover>
                        <v-expansion-panel v-for="(item, index) in faq.items" :key="'faq-' + index">
                            <v-expansion-panel-header>
                                <div v-html="highlightText(item.question)"></div>
                            </v-expansion-panel-header>
                            <v-expansion-panel-content>
                                <div v-html="highlightText(item.answer)"></div>
                            </v-expansion-panel-content>
                        </v-expansion-panel>
                    </v-expansion-panels>
                </div>

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

<style>
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
.search-highlight {
    color: #ffe082;
    text-decoration: underline;
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
        const faqAbout = [
            {
                question: "What exactly can I do with Strautomator?",
                answer: `<p>
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
                        </ul>`
            },
            {
                question: "Who's behind Strautomator?",
                answer: `<p>
                            Igor Ramadas. Pleased to meet you :-) You can find more about me at <a href="https://aboutigor.com" title="About Igor">aboutigor.com</a>. And of course, I'm also on
                            <a href="https://www.strava.com/athletes/5649845" title="Igor @ Strava">Strava</a> itself.
                        </p>`
            },
            {
                question: "How does it connect to Strava?",
                answer: `<p>
                            Once you click or tap the <a title="Connect with Strava" @click="login">"Connect with Strava"</a> button, you'll be redirected to Strava to give Strautomator the necessary permissions to read and update activities on
                            your Strava account. Once permissions are given, Strava will automatically ping the Strautomator service whenever you upload or createa new activities.
                        </p>
                        <p>
                            Everything happens on the cloud, you don't need to install any software on your device(s).
                        </p>`
            },
            {
                question: "Do I need a paid Strava to use it?",
                answer: `<p>
                            Not at all! It also works with free accounts. Strava has recently made some users unhappy by making some of their features available to paid subscribers only, but that doesn't affect Strautomator.
                        </p>`
            },
            {
                question: "Why this instead of Commute Marker, Klimat and other tools?",
                answer: `<p>
                            I used both Commute Marker and Klimat in the past, and they were in fact part of my inspiration to develop Strautomator. So thumbs up to the devs for their amazing work.
                        </p>
                        <p>
                            Now most of these other Strava tools serve a very specific need. Commute Marker to mark commutes based on start and end location. Klimat to add weather data to activities. Then there's IFTTT to integrate with other
                            services. Strautomator is a all-in-one. A jack of all trades.
                        </p>
                        <p>
                            And last but not least: it's
                            <a href="https://github.com/strautomator" title="Strautomator on GitHub">open source</a>.
                        </p>`
            }
        ]

        const faqAutomations = [
            {
                question: "Which sports are supported?",
                answer: `<p>
                            Any activity type that is supported by Strava. But please keep in mind that Strava is mostly focused on cycling and running, so some of the features might make sense only with these 2 sports.
                        </p>`
            },
            {
                question: "Metric or imperial system?",
                answer: `<p>
                            Kilometers or miles? Strautomator will get the preferences you have set on your Strava account. So if you're using Strava with imperial units, so will your automations.
                        </p>
                        <p>
                            Please be aware that if you change your preferences on Strava, you'll have to update your automations to reflect the new unit. Example: an automation that has "distance > 10 miles" will need to be manually updated to
                            use "distance > 16km".
                        </p>`
            },
            {
                question: "When are activities are processed?",
                answer: `<p>
                            Usually less than 5 minutes after being created or uploaded to Strava, but depending on their API's load it can take a bit longer. Please note that only new activities are processed. If you manually update an activity
                            on Strava, it will <span class="font-weight-bold">not</span> trigger your automations on Strautomator.
                        </p>
                        <p class="font-italic">
                            In the future I might add support for automations on updated activities as well.
                        </p>`
            },
            {
                question: "Some location based automations are not working properly, why?",
                answer: `<p>
                            Strautomator uses Google Maps to translate addresses to [lat, lng] coordinates. Sometimes these coordinates might be slightly off, for example pointing to a building instead of the actual street.
                        </p>
                        <p>
                            To fix this, you can set the condition to 650m radius instead of 60m. Or you can simply type the actual (precise) coordinates of your desired location directly on the search field.
                        </p>`
            },
            {
                question: "Why are some weather details on my activities wrong?",
                answer: `<p>
                            Strautomator is using ClimaCell, Dark Sky, Weatherbit, OpenWeatherMap and WeatherAPI.com to get weather data. On free accounts the actual provider will be selected based on location and API usage. Users with PRO
                            accounts can manually set their preferred weather provider.
                        </p>`
            },
            {
                question: "I want a new feature, can you implement it?",
                answer: `<p>
                            If you want Strautomator to automatically change the visibility of some activities to "Only you", this is not possible due to limitations imposed by Strava. Auto-kudos is also not possible.
                        </p>
                        <p>
                            Now, for other requests... if it's related to automating tasks related to your Strava activities, please drop me a message via email or Twitter with your suggestion and I'll get back to you soon.
                        </p>`
            }
        ]

        const faqGearWear = [
            {
                question: "What is GearWear?",
                answer: `<p>
                            Just a fancy name for the gear mileage tracking features of Strautomator. Strava has its own mileage counter of bikes and shoes, but there's no way to track the mileage of individual components.
                        </p>
                        <p>
                            With GearWear you can track the mileage of the current chain, cassette, tires and other expendable parts of your bikes, or specific parts of your shoes. Once you reach a specific mileage, Strautomator will alert you so
                            you can have it replaced and reset the mileage once again.
                        </p>`
            },
            {
                question: "How does it work?",
                answer: `<p>
                            Every night Strautomator will fetch your Strava activities from the day before yesterday and increase the mileage of the gear set for each of these activites.
                        </p>
                        <p>
                            Why have a 2 days delay, you might ask? This is to give you plenty of time to have your activities manually updated with the correct gear, in case it wasn't done automatically via one of your automations. This also
                            mean that if you have multiple bikes and shoes, you must make sure that all your activities have the correct gear assigned, otherwise the mileage might count towards the wrong one.
                        </p>`
            },
            {
                question: "How does it work?",
                answer: `<p>
                            Every night Strautomator will fetch your Strava activities from the day before yesterday and increase the mileage of the gear set for each of these activites.
                        </p>
                        <p>
                            Why have a 2 days delay, you might ask? This is to give you plenty of time to have your activities manually updated with the correct gear, in case it wasn't done automatically via one of your automations. This also
                            mean that if you have multiple bikes and shoes, you must make sure that all your activities have the correct gear assigned, otherwise the mileage might count towards the wrong one.
                        </p>`
            },
            {
                question: "Doesn't Strava have its own gear mileage alert?",
                answer: `<p>
                            Yes, but unfortunately only for shoes. And believe it or not, there are shoes out there with replaceable soles, so you might want to zero the mileage instead of creating a new gear on Strava.
                        </p>
                        <p>
                            Strautomator's mileage alert is more useful than Strava's (for bikes and shoes), yet still extremely simple to use.
                        </p>`
            },
            {
                question: "Can I track different wheelsets / tires for the same bike?",
                answer: `<p>
                            Unfortunately no. Strautomator does not keep the full history of your activities, therefore it can't correlate specific activities with specific components. For now I'm choosing simplicity over complexity, but if
                            there's enough demand I might change this in the future.
                        </p>
                        <p>
                            A simple workaround is to register 2 (or more) bikes on Strava, one for each different wheelset.
                        </p>`
            },
            {
                question: "Why is Strautomator showing a different total mileage for my gear?",
                answer: `<p>
                            The total mileage is not updated in real-time, and it might a few hours behind the official Strava stats. So if you just had a long activity some moments ago, the displayed total mileage of your bike or shoes might be
                            slightly less than the real value.
                        </p>`
            }
        ]

        const faqSubscription = [
            {
                question: "Free vs. PRO, what's the deal?",
                answer: `<p>
                            Feature-wise they're almost the same. The free account is restricted to ${this.$store.state.freePlanDetails.maxRecipes} automations, containing a maximum of ${this.$store.state.freePlanDetails.maxConditions} conditions
                            each, and a maximum of ${this.$store.state.freePlanDetails.maxGearWear} GearWear configurations. Additionally, free accounts will have a link to strautomator.com added to the description of
                            ${this.$store.state.linksOnPercent}% of processed activites (1 out of 5) by default. You can change this value on your account preferences.
                        </p>
                        <p>
                            Users who subscribe to PRO will have unlimited automations and GearWear configurations, no backlinks added to activity descriptions, and access to extra features like choosing their weather provider and using webhooks.
                        </p>
                        <p>
                            PRO costs $${this.$store.state.proPlanDetails.price.year.toFixed(2)} / year via PayPal or $${this.$store.state.proPlanDetails.githubPrice.toFixed(2)} / month via GitHub.
                        </p>`
            },
            {
                question: "Why should I pay to get PRO?",
                answer: `<p>
                            <span class="font-weight-bold">A valid question!</span>
                            The free account should be sufficient to the vast majority of users. But if you have dozens of weekly activities and want to automate them to the fullest, PRO is the way to go.
                        </p>
                        <p>
                            Suppose you earn $15 per hour, and have on average 1 activity per day. Let's round to 350 activities / year. By using Strautomator, you save that 1 minute hassle of opening Strava to update these activities manually.
                            So it can potentially save you around 25 cents per activity. If half of your activities are automated, in 1 year that's around $44.
                        </p>
                        <p>
                            The calculation above is obviously a bit silly, but you get the point. There are running costs (domain, servers, weather APIs...) and I hope to at least cover these costs with a few PRO subscribers.
                        </p>`
            },
            {
                question: "Can I get PRO for free?",
                answer: `<p>
                            Kind of. You can grab the
                            <a href="https://github.com/strautomator" title="Strautomator @ GitHub">source code</a> and deploy your own instance of Strautomator. I will be glad to help if you want to get it running on your own server.
                        </p>`
            }
        ]

        const faqSecurity = [
            {
                question: "Can Strautomator mess up my Strava?",
                answer: `<p>
                            If you connect with your Strava account, Strautomator will have permissions to read and update your activities. The service can't delete existing activities, nor create new ones.
                        </p>
                        <p>
                            But of course you have to be reasonable with your automations. If you create a recipe with a single condition to update rides longer than 1km, for instance, it will very likely update all your future rides.
                        </p>`
            },
            {
                question: "Are my GPS coordinates stored by Strautomator?",
                answer: `<p>
                            No. Strautomator might process the "start" and "end" locations of your activities in memory, if you have automations based on these conditions. But it won't store the activity coordinates anywhere.
                        </p>`
            },
            {
                question: "Will my data be shared with 3rd parties?",
                answer: `<p>
                            No. Not today, not tomorrow, not ever.
                        </p>
                        <p>
                            When you connect your Strava account to Strautomator, it gets some of your basic info about your Strava account (user ID, name, gears, etc), and this information is used solely within the service.
                        </p>
                        <p>
                            When Strava sends your activities to Strautomator, it will parse some of the information to run your automations and create your online dashboard. After parsing, the basic details about the activity (mostly the ID,
                            name and date) will be stored on the service database for historical purposes.
                        </p>`
            },
            {
                question: "What happens when I close my account?",
                answer: `<p>
                            If you decide to close your Strautomator account, there's no way to restore any of the data that the system had previously processed. All your recipes will vanish into thin air. The connection we have will be killed
                            and Strautomator will be deauthorized from your Strava account. If you have a running PRO subscription on PayPal, this will also be cancelled.
                        </p>
                        <p>
                            And if there's any feedback you might want to share, I'm all ears.
                        </p>`
            }
        ]

        // Combine all FAQs.
        const faqList = [
            {expanded: [], title: "About", items: faqAbout},
            {expanded: [], title: "Automations", items: faqAutomations},
            {expanded: [], title: "GearWear", items: faqGearWear},
            {expanded: [], title: "Free and PRO accounts", items: faqSubscription},
            {expanded: [], title: "Security and privacy", items: faqSecurity}
        ]

        return {
            searchValue: "",
            faqList: faqList,
            loggedIn: this.$store.state.oauth && this.$store.state.user,
            billingPlanSummaries: [],
            panel: null
        }
    },
    computed: {
        searchQuery() {
            return this.searchValue.toLowerCase()
        }
    },
    mounted() {
        let parent = this.$parent.$parent

        while (parent && !parent.$data.activeNavBtn) {
            parent = parent.$parent
        }

        if (parent && parent.$data.activeNavBtn) {
            parent.$data.activeNavBtn = "/help"
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
        },
        highlightText(text) {
            const iQuery = new RegExp(this.searchQuery, "ig")
            return text.replace(iQuery, function(matchedTxt, a, b) {
                return "<span class='search-highlight'>" + matchedTxt + "</span>"
            })
        },
        searchExpand(faq) {
            const result = []

            if (this.searchQuery == "") {
                return result
            }

            for (let i = 0; i < faq.items.length; i++) {
                const question = faq.items[i].question
                const answer = faq.items[i].answer

                if (question.indexOf(this.searchQuery) >= 0 || answer.indexOf(this.searchQuery) >= 0) {
                    result.push(i)
                }
            }

            return result
        }
    }
}
</script>
