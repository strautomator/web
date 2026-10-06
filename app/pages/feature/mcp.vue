<template>
    <v-main fluid>
        <feature-title header="Connect AI clients to your account" />

        <v-card color="black" class="mb-4 home-panel">
            <v-card-text>
                <div class="text-left">
                    <p>Strautomator has its own MCP server so you can connect Claude, ChatGPT, Grok and many other AI clients and agents to your account. Ask about your activities, automations, gear and records, and more!.</p>

                    <h2 class="mb-2">1. Connect to our MCP endpoint</h2>
                    <v-alert class="font-weight-bold mt-2">https://strautomator.com/mcp</v-alert>

                    <h2 class="mb-2">2. Sign in and authorize</h2>
                    <div class="mb-8">Sign in with Strava if you are not already logged in, then review the consent screen and authorize the client connection.</div>

                    <h2 class="mb-2">3. Use the provided tools</h2>
                    <div class="mb-8">Ask your AI client to use Strautomator's data as you wish!</div>

                    <h2 class="mb-2">What can the client do?</h2>
                    <ul class="ml-n2 mb-6">
                        <li>Read your account, processed activities, automations and their stats</li>
                        <li>Create, update and delete automations</li>
                        <li>Run your automations on an activity</li>
                        <li>Check gear configurations and toggle components</li>
                        <li>Access personal records, calendar metadata and notifications</li>
                        <li>Estimate your FTP from recent rides</li>
                    </ul>

                    <p>Strautomator gives the client its own access token. Your Strava tokens are not shared with the AI client, and the client can only see and change your own account.</p>
                    <p>The MCP server is available to PRO accounts only.</p>
                </div>
            </v-card-text>
        </v-card>

        <div class="mt-6 mb-2">
            <btn-account />
        </div>
    </v-main>
</template>

<script>
import FeatureTitle from "~/components/FeatureTitle.vue"
import BtnAccount from "~/components/buttons/Account.vue"

export default {
    layout: "feature",
    components: {FeatureTitle, BtnAccount},
    head() {
        return {
            title: "Connect Cursor, Claude and other AI clients to Strautomator"
        }
    },
    methods: {
        login() {
            this.$login()
        }
    }
}
</script>
