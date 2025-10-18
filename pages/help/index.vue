<template>
    <v-layout column>
        <div class="stripe" v-if="!loggedIn"></div>
        <v-container class="text-center" :class="{'help-wrapper': !loggedIn}" fluid>
            <div :class="{'width-wrapper': !loggedIn, 'text-left': loggedIn}">
                <h1 :class="{'mt-10': !loggedIn, 'text-center': !loggedIn}">{{ loggedIn ? "Help" : "Strautomator Help" }}</h1>

                <iframe frameborder="0" src="https://www.chatbase.co/neTz5lyyofpBTh8BNF1kf/help" style="width: 100%; min-height: 650px"></iframe>

                <feature-links />
            </div>
        </v-container>
    </v-layout>
</template>

<style>
.help-wrapper {
    position: relative;
    z-index: 99;
}
</style>

<script>
import _ from "lodash"
import FeatureLinks from "~/components/FeatureLinks.vue"

export default {
    authenticated: false,
    components: {FeatureLinks},
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
