<template>
    <v-main fluid>
        <div class="stripe"></div>
        <div class="py-2"></div>

        <v-container class="text-center" fluid>
            <div class="home-wrapper">
                <h1 class="font-weight-light mt-1 mb-2" :class="$breakpoint.mdAndUp ? 'display-1' : 'headline'">
                    Track your equipment mileage
                </h1>
                <div>with</div>
                <h2 class="display-2 font-weight-bold mb-4">Strautomator</h2>

                <v-card color="black" class="mb-4 home-panel">
                    <v-card-text>
                        <div class="text-left">
                            <p>
                                With Strautomator you can easily track the mileage and usage of your bike components, and get an alert when it's time to change.
                            </p>

                            <h2 class="mb-2">1. Create a new configuration</h2>
                            <v-img class="mb-2" src="/images/feature/gearwear-list.png"></v-img>
                            <div class="mb-8">On the Gear view, you'll see the list of your current GearWear configurations. To create a new one, tap on the + sign next to the gear which you want to configure.</div>

                            <h2 class="mb-2">2. Define the components</h2>
                            <v-img class="mb-2" src="/images/feature/gearwear-new.png"></v-img>
                            <div class="mb-8">Each GearWear configuration can have as many components as needed. You can start with the defaults and also use the "Since date" field to calculate the usage since a specific date.</div>

                            <h2 class="mb-2">3. Edit individual components</h2>
                            <v-img class="mb-2" src="/images/feature/gearwear-edit-component.png"></v-img>
                            <div class="mb-8">You can easily change the component tracking and alert thresholds whenever you wish.</div>

                            <h2 class="mb-2">4. Review your components</h2>
                            <v-img class="mb-2" src="/images/feature/gearwear-components.png"></v-img>
                            <div class="mb-8">Review the components, save, and you're good to go!</div>

                            <h2 class="mb-2">Tracking and alerting</h2>
                            <div class="mb-2">
                                <p>
                                    The usage (distance and time) of the components will be updated automatically with each activity, having a delay of 2 days from the time of the activity till the update. This is to ensure that you have plenty of
                                    time to set the correct gear on the activities.
                                </p>
                                <p>
                                    When a component hits the specified alert threshold, you'll get an email to remind you that it's time to swap it. Reminders will be sent out every few days until you swap the component and trigger the mileage reset
                                    using the link provided on the email (or directly on the Strautomator website).
                                </p>
                            </div>
                        </div>
                    </v-card-text>
                </v-card>

                <div class="mt-6 mb-2">
                    <div v-if="$store.state.user">
                        <v-btn color="primary" to="/gearwear" title="GearWear" rounded nuxt>
                            <v-icon left>mdi-link</v-icon>
                            Go to GearWear
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
            title: "Track your equipment mileage"
        }
    },
    methods: {
        login() {
            this.$login()
        }
    }
}
</script>
