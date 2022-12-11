<template>
    <v-layout column>
        <div class="stripe" v-if="!loggedIn"></div>
        <v-container class="text-center" :class="{'help-wrapper': !loggedIn}" fluid>
            <div :class="{'width-wrapper': !loggedIn, 'text-left': loggedIn}">
                <h1 :class="{'mt-10': !loggedIn, 'text-center': !loggedIn}">{{ loggedIn ? "Help" : "Strautomator Help" }}</h1>

                <v-text-field v-model="searchValue" :loading="loading" @input="debounceSearch" label="Keyword search" class="mt-2" rounded outlined></v-text-field>

                <div class="text-center text-caption mt-n4">Use the field above to search by keywords.<br v-if="!$breakpoint.mdAndUp" />The most common questions are listed below.</div>
                <div class="text-center text-caption mb-6">If you're interested you can also view the <n-link to="/changelog" title="Changelog" nuxt>Changelog</n-link>.</div>
                <div v-for="group in groupedQuestions" :key="group.title">
                    <h2 class="mb-1 ml-1">{{ group.title }}</h2>
                    <v-alert class="ma-0" v-if="groupedQuestions[0].questions.length == 0"> No results found. </v-alert>
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

                <ads-panel />
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
    color: #fff8e1;
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
import _ from "lodash"
import AdsPanel from "~/components/AdsPanel.vue"
import FeatureLinks from "~/components/FeatureLinks.vue"

export default {
    authenticated: false,
    components: {AdsPanel, FeatureLinks},
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
            {tag: "automations", title: "Automations"},
            {tag: "gearwear", title: "GearWear"},
            {tag: "calendar", title: "Calendar"},
            {tag: "records", title: "Personal records"},
            {tag: "ftp", title: "FTP estimation"},
            {tag: "subscription", title: "Free vs. PRO"},
            {tag: "spotify", title: "Spotify integration"},
            {tag: "security", title: "Security and privacy"},
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
            billingPlanSummaries: [],
            panel: null
        }
    },
    computed: {
        groupedQuestions() {
            const results = []
            const query = this.searchValue.trim()

            if (query.length >= 2) {
                const regex = new RegExp(this.searchQuery, "i")
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
            const billingPlans = Object.values(await this.$axios.$get("/api/paypal/billingplans"))
            this.billingPlanSummaries = []
            for (let plan of billingPlans) {
                this.billingPlanSummaries.push(`${plan.price} / ${plan.frequency}`)
            }

            // Get all questions and answers.
            this.faq = await this.$axios.$get("/api/faq")

            // Search query or auto expand panel passed via the URL?
            if (this.$route.query) {
                if (this.$route.query.q) {
                    this.searchValue = decodeURIComponent(this.$route.query.q)
                    this.searchQuery = this.searchValue
                }
                if (this.$route.query.expand) {
                    this.expandedPanels = [...Array(this.groupedQuestions.length).keys()]
                }
            }
        } catch (ex) {
            this.$webError("Help.fetch", ex)
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

            const iQuery = new RegExp("\\b " + this.searchQuery + " \\b", "ig")
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
