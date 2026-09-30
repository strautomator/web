<template>
    <v-layout column :class="{'site-page': !loggedIn}">
        <div class="site-glow site-glow-top" v-if="!loggedIn"></div>
        <v-container class="text-center" fluid>
            <div class="text-left" :class="{'home-wrapper': !loggedIn}">
                <site-header v-if="!loggedIn" header="FAQ" />
                <h1 v-else>FAQ</h1>

                <v-text-field v-model="searchValue" :loading="loading" @input="debounceSearch" label="Strautomator FAQ search" class="mt-2" rounded outlined></v-text-field>

                <div class="text-center text-caption mt-n4">Use the field above to search by keywords.</div>
                <div class="text-center text-caption mb-6">If you're interested you can also view the <n-link to="/changelog" title="Strautomator updates" nuxt>changelog</n-link>.</div>
                <div v-for="group in groupedQuestions" :key="group.title">
                    <h2 :class="loggedIn ? 'mb-1 ml-1' : 'site-subheading mt-6 mb-2'">{{ group.title }}</h2>
                    <v-alert class="ma-0" v-if="groupedQuestions[0].questions.length == 0">No results found.</v-alert>
                    <v-expansion-panels class="mb-4" :value="expandedPanels" multiple hover>
                        <v-expansion-panel v-for="(item, index) in group.questions" :key="'faq-' + index">
                            <v-expansion-panel-header>
                                <div v-html="highlightText(item.question)"></div>
                            </v-expansion-panel-header>
                            <v-expansion-panel-content>
                                <div v-html="highlightText(item.answer)"></div>
                            </v-expansion-panel-content>
                        </v-expansion-panel>
                    </v-expansion-panels>
                </div>
                <div class="text-center text-md-left">Still can't find what you're looking for? Drop an email to <a href="mailto:info@strautomator.com" title="Email support">info@strautomator.com</a>.</div>

                <div class="mt-10 text-center" v-if="!loggedIn">
                    <a title="Connect with Strava..." @click="login()"><img class="strava-connect" src="/images/strava-connect.svg" /></a>
                </div>

                <div class="mt-10 mb-4 text-center" title="Back to Strautomator home..." v-if="!loggedIn">
                    <v-btn color="primary" @click="backHome" rounded>
                        <v-icon left>mdi-home</v-icon>
                        Back to home
                    </v-btn>
                </div>

                <feature-links />
            </div>
        </v-container>
    </v-layout>
</template>

<script>
import _ from "lodash"
import FeatureLinks from "~/components/FeatureLinks.vue"
import SiteHeader from "~/components/SiteHeader.vue"

export default {
    authenticated: false,
    components: {FeatureLinks, SiteHeader},
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
        const categories = [
            {tag: "about", title: "About"},
            {tag: "security", title: "Security and privacy"},
            {tag: "subscription", title: "Free vs. PRO"},
            {tag: "automations", title: "Automations"},
            {tag: "gearwear", title: "GearWear"},
            {tag: "calendar", title: "Calendar"},
            {tag: "records", title: "Personal records"},
            {tag: "performance", title: "Performance estimation"},
            {tag: "ai", title: "AI integration"},
            {tag: "garmin", title: "Garmin integration"},
            {tag: "wahoo", title: "Wahoo integration"},
            {tag: "spotify", title: "Spotify integration"},
            {tag: "issues", title: "Common issues"}
        ]

        return {
            loading: true,
            categories: categories,
            faq: [],
            expandedPanels: [],
            searchValue: "",
            searchQuery: "",
            loggedIn: this.$store.state.oauth && this.$store.state.user,
            panel: null
        }
    },
    computed: {
        groupedQuestions() {
            const results = []
            const query = this.searchValue.trim()

            if (query.length >= 2) {
                const escapedQuery = this.searchQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
                const regex = new RegExp(escapedQuery, "i")
                const filterTitle = (item) => item.question.search(regex) >= 0
                const filterContent = (item) => item.tags.indexOf(query) >= 0 || item.answer.search(regex) >= 0
                const questions = _.filter(this.faq, filterTitle).concat(_.filter(this.faq, filterContent))
                results.push({title: `Search results: ${query}`, questions: _.uniqBy(questions, "question")})
            } else {
                for (let category of this.categories) {
                    const questions = _.filter(this.faq, (q) => q.tags.indexOf(category.tag) == 0)
                    results.push({title: category.title, questions: questions})
                }
            }

            return results
        }
    },
    async fetch() {
        try {
            this.faq = await this.$axios.$get("/api/help/faq")

            // Search query or auto expand panel passed via the URL?
            if (this.$route.query) {
                if (this.$route.query.q) {
                    this.searchValue = decodeURIComponent(this.$route.query.q)
                    this.searchQuery = this.searchValue
                }
                if (this.$route.query.expand) {
                    this.expandedPanels = [...Array(999).keys()]
                }
            }
        } catch (ex) {
            this.$webError(this, "FAQ.fetch", ex)
        }

        this.loading = false
    },
    mounted() {
        let parent = this.$parent.$parent

        while (parent && !parent.$data.activeNavBtn) {
            parent = parent.$parent
        }

        if (parent && parent.$data.activeNavBtn) {
            parent.$data.activeNavBtn = "/help"
        }

        if (!window.chatbase || window.chatbase("getState") !== "initialized") {
            window.chatbase = (...args) => {
                if (!window.chatbase.q) {
                    window.chatbase.q = []
                }
                window.chatbase.q.push(args)
            }
            window.chatbase = new Proxy(window.chatbase, {
                get(target, prop) {
                    if (prop === "q") {
                        return target.q
                    }
                    return (...args) => target(prop, ...args)
                }
            })

            const onLoad = function () {
                const script = document.createElement("script")
                script.src = "https://www.chatbase.co/embed.min.js"
                script.id = "neTz5lyyofpBTh8BNF1kf"
                script.domain = "www.chatbase.co"
                document.body.appendChild(script)
            }
            if (document.readyState === "complete") {
                onLoad()
            } else {
                window.addEventListener("load", onLoad)
            }
        } else {
            document.getElementById("chatbase-bubble-window").style.visibility = "visible"
            document.getElementById("chatbase-bubble-button").style.visibility = "visible"
            document.getElementById("chatbase-message-bubbles").style.visibility = "visible"
        }
    },
    beforeDestroy() {
        document.getElementById("chatbase-bubble-window").style.visibility = "hidden"
        document.getElementById("chatbase-bubble-button").style.visibility = "hidden"
        document.getElementById("chatbase-message-bubbles").style.visibility = "hidden"
    },
    methods: {
        backHome() {
            document.location.href = "/home"
        },
        login() {
            this.$login()
        },
        highlightText(text) {
            if (this.searchQuery.length < 2) {
                return text
            }

            const escapedQuery = this.searchQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
            const iQuery = new RegExp("\\b " + escapedQuery + " \\b", "ig")
            return text.replace(iQuery, function (matchedTxt, a, b) {
                return " <span class='search-highlight'>" + matchedTxt.trim() + "</span> "
            })
        },
        debounceSearch: _.debounce(async function () {
            this.loading = true
            this.searchQuery = this.searchValue
            this.expandedPanels = []
            this.loading = false
        }, 600)
    }
}
</script>
