vue
<template>
    <v-main fluid>
        <feature-title header="Track your personal records" />

        <v-card color="black" class="mb-4 home-panel">
            <v-card-text>
                <div class="text-left">
                    <p>Strautomator can keep tabs on your personal records on Strava! Track the longest distance, speed, power, heart rate and more for your rides, runs or any other activities.</p>
                    <v-img class="mb-5" src="/images/feature/records-ride.png"></v-img>

                    <p>And you can also use activity records as part of automaton conditions:</p>
                    <v-img class="mb-5" src="/images/feature/records-condition.png"></v-img>

                    <p>Personal records will be updated whenever you hit new targets on your Strava activities.</p>
                </div>
            </v-card-text>
        </v-card>

        <div class="mt-6 mb-2">
            <btn-records />
        </div>
    </v-main>
</template>

<script>
import FeatureTitle from "~/components/FeatureTitle.vue"
import BtnPersonalRecords from "~/components/buttons/PersonalRecords.vue"

export default {
    layout: "feature",
    components: {FeatureTitle, BtnPersonalRecords},
    head() {
        return {
            title: "Track your personal Strava records"
        }
    },
    methods: {
        login() {
            this.$login()
        }
    }
}
</script>
