<template>
    <v-main fluid>
        <div class="stripe"></div>
        <div class="py-2"></div>

        <v-container class="text-center" fluid>
            <div class="home-wrapper">
                <h1 class="font-weight-light mt-1 mb-2" :class="$breakpoint.mdAndUp ? 'display-1' : 'headline'">
                    Auto-incrementing activity counter
                </h1>
                <div>with</div>
                <h2 class="display-2 font-weight-bold mb-4">Strautomator</h2>

                <v-card color="black" class="mb-4 home-panel">
                    <v-card-text>
                        <div class="text-left">
                            <p>
                                Strautomator can automatically add a counter to your regular or repeating activities. For instance you could name your regular bakery rides as "Cake ride #1" and "#2, #3, #4" and so on.
                            </p>

                            <h2 class="mb-2">1. First, define the conditions</h2>
                            <v-img class="mb-2" src="/images/feature/condition-end-location.png"></v-img>
                            <div class="mb-8">Define what should trigger this automation. Here we're using a "Passes on location", stating the address of a favourite bakery.</div>

                            <h2 class="mb-2">2. Then, create a name action</h2>
                            <v-img class="mb-2" src="/images/feature/action-counter.png"></v-img>
                            <div class="mb-8">Here we're using a "Set activity name" action, and adding the counter to the end of the activity name. The tag <code>${counter}</code> will be replaced with the actual counter.</div>

                            <h2 class="mb-2">3. Review your automation</h2>
                            <v-img class="mb-2" src="/images/feature/counter-automation.png"></v-img>
                            <div class="mb-2">Review the automation conditions and actions, save, and you're good to go! Also note that you if you're using a counter, you can change its current value at any time.</div>
                        </div>
                    </v-card-text>
                </v-card>

                <div class="mt-6 mb-2">
                    <div v-if="$store.state.user">
                        <v-btn color="primary" to="/automations" title="My Automations" rounded nuxt>
                            <v-icon left>mdi-link</v-icon>
                            Go to My Automations
                        </v-btn>
                    </div>
                    <div v-else>
                        <a title="Connect with Strava..." @click="login()"><img class="strava-connect" src="/images/strava-connect.svg"/></a>
                    </div>
                </div>

                <feature-links />
            </div>
        </v-container>
    </v-main>
</template>

<script>
import FeatureLinks from "~/components/FeatureLinks.vue"

export default {
    layout: "landing",
    components: {FeatureLinks},
    head() {
        return {
            title: "Auto-incrementing activity counter"
        }
    },
    methods: {
        login() {
            this.$login()
        }
    }
}
</script>
