<template>
    <v-card class="mt-4" outlined>
        <v-card-text class="pb-md-0">
            <p>
                If you don't know the current distance of the components, Strautomator can calculate it for you based on your past activities. Enter the date when you last swapped (at least some) of the components, up to 2 years ago.
            </p>
            <div class="d-flex text-center text-md-left" :class="{'flex-column': !$breakpoint.mdAndUp}">
                <div class="flex-grow-0">
                    <v-menu v-model="dateMenu" :close-on-content-click="false" :nudge-right="40" transition="scale-transition" offset-y min-width="290px">
                        <template v-slot:activator="{on, attrs}">
                            <v-text-field v-model="dateSince" v-bind="attrs" v-on="on" width="200px" label="Since date" type="text" prepend-icon="mdi-calendar" :loading="pastLoading" outlined readonly rounded dense></v-text-field>
                        </template>
                        <v-date-picker v-model="dateSince" :min="dateSinceMin" :max="dateSinceMax" @input="dateMenu = false"></v-date-picker>
                    </v-menu>
                </div>
                <div class="flex-grow-0">
                    <v-btn elevation="1" color="primary" class="ml-2" title="Get distance from Strava activities" @click="getPastUsage" :disabled="pastLoading || !dateSince" rounded>
                        Get expected usage
                    </v-btn>
                </div>
            </div>
        </v-card-text>

        <v-snackbar v-model="pastUsageAlert" class="text-left" color="success" :timeout="5000" rounded bottom>
            <span v-if="pastActivities > 0">Got {{ pastUsage }} for {{ pastActivities }} activities since {{ formatDateSince }}.</span>
            <span v-else>No activities found since {{ formatDateSince }} for that gear.</span>

            <template v-slot:action="{attrs}">
                <v-icon v-bind="attrs" @click="pastUsageAlert = false">mdi-close-circle</v-icon>
            </template>
        </v-snackbar>
    </v-card>
</template>

<script>
import userMixin from "~/mixins/userMixin.js"

export default {
    props: ["gearwear-config"],
    mixins: [userMixin],
    data() {
        const dateSinceMin = this.$moment().subtract(1, "year")
        const dateSinceMax = this.$moment()

        return {
            dateSince: null,
            dateSinceMin: dateSinceMin.format("YYYY-MM-DD"),
            dateSinceMax: dateSinceMax.format("YYYY-MM-DD"),
            dateMenu: false,
            pastActivities: 0,
            pastUsage: "",
            pastUsageAlert: false,
            pastLoading: false
        }
    },
    computed: {
        formatDateSince() {
            return this.$moment(this.dateSince).format("ll")
        }
    },
    methods: {
        async getPastUsage() {
            try {
                this.pastLoading = true

                const timestamp = this.$moment(this.dateSince).unix()
                const activities = await this.$axios.$get(`/api/strava/activities/since/${timestamp}?gear=${this.gearwearConfig.id}`)

                let distance = 0
                let elapsedTime = 0
                let hours

                for (let a of activities) {
                    if (a.distance && a.distance > 0) {
                        distance += a.distance
                    }
                    if (a.movingTime && a.movingTime > 0) {
                        elapsedTime += a.movingTime
                    } else if (a.totalTime && a.totalTime > 0) {
                        elapsedTime += a.totalTime
                    }
                }

                distance = Math.round(distance)
                hours = Math.round(elapsedTime / 3600)

                if (distance > 0) {
                    for (let comp of this.gearwearConfig.components) {
                        comp.currentDistance = distance
                    }
                }

                if (hours > 0) {
                    for (let comp of this.gearwearConfig.components) {
                        comp.currentTime = elapsedTime
                    }
                }

                this.pastActivities = activities.length
                this.pastUsage = `${distance} ${this.distanceUnits}, ${hours} hours`
                this.pastUsageAlert = true
            } catch (ex) {
                this.$webError("GearPastUsagePanel.getPastUsage", ex)
            }

            this.pastLoading = false
        }
    }
}
</script>
