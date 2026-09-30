<template>
    <v-layout column :class="{'site-page': !loggedIn}">
        <div class="site-glow site-glow-top" v-if="!loggedIn"></div>
        <v-container class="text-center" fluid>
            <div :class="{'home-wrapper': !loggedIn, 'text-left': loggedIn}">
                <site-header v-if="!loggedIn" header=" Help" lead="Ask our AI assistant anything about Strautomator, or browse the FAQ." />
                <h1 v-else>Help</h1>

                <div :class="{'site-card pa-0 overflow-hidden': !loggedIn}">
                    <iframe frameborder="0" src="https://www.chatbase.co/neTz5lyyofpBTh8BNF1kf/help" style="display: block; width: 100%; min-height: 650px"></iframe>
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
        return {
            loading: false,
            streaming: false,
            message: "",
            answer: null,
            loggedIn: this.$store.state.oauth && this.$store.state.user
        }
    },
    async fetch() {
        try {
            if (this.$route.query?.q) {
                this.message = decodeURIComponent(this.$route.query.q)
                this.getAnswer()
            }
        } catch (ex) {
            this.$webError(this, "Help.fetch", ex)
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
    methods: {
        backHome() {
            document.location.href = "/home"
        },
        login() {
            this.$login()
        },
        async getAnswer() {
            try {
                this.loading = true

                const body = JSON.stringify({message: this.message}, null, 0)
                const response = await fetch("/api/help/chat", {body, method: "POST", headers: {"Content-Type": "application/json"}})
                const reader = response.body.getReader()
                const decoder = new TextDecoder()

                this.answer = ""

                this.streaming = true
                while (this.streaming) {
                    const {done, value} = await reader.read()
                    if (done) {
                        this.streaming = false
                    } else {
                        this.answer += decoder.decode(value)
                    }
                }
            } catch (ex) {
                this.$webError(this, "Help.getAnswer", ex)
            } finally {
                this.loading = false
                this.streaming = false
            }
        }
    }
}
</script>
