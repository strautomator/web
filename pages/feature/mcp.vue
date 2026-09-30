<template>
    <v-main fluid>
        <feature-title header="Connect AI clients to your account" />

        <v-card color="black" class="mb-4 home-panel">
            <v-card-text>
                <div class="text-left">
                    <p>Strautomator includes an MCP server so Cursor, Claude and other AI clients can work with your account. Ask about your activities, automations, gear and records, or let the client make the same kind of changes you can already make in the app.</p>

                    <h2 class="mb-2">1. Copy the server URL</h2>
                    <v-alert class="font-weight-bold">https://strautomator.com/mcp</v-alert>
                    <div class="mb-8">Go to My Account and copy the URL from the MCP card, or use the address above.</div>

                    <h2 class="mb-2">2. Add it to your AI client</h2>
                    <div class="mb-8">In Cursor, Claude or another MCP client, add a remote MCP server and paste that URL. The client will open Strautomator in your browser.</div>

                    <h2 class="mb-2">3. Sign in and authorize</h2>
                    <div class="mb-8">Sign in with Strava if you are not already logged in, then review the consent screen and authorize the client. Only continue if you started the connection yourself and you recognize where you will be sent back.</div>

                    <h2 class="mb-2">What can the client do?</h2>
                    <ul class="ml-n2 mb-6">
                        <li>Read your account, processed activities, automations and their stats</li>
                        <li>Create, update and delete automations</li>
                        <li>Run your automations on an activity</li>
                        <li>Check GearWear, personal records, calendars and notifications</li>
                        <li>Estimate your FTP from recent rides, and save a new estimate to Strava</li>
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
