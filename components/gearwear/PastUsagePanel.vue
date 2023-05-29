<template>
    <v-card class="mt-4" outlined>
        <v-card-text class="pb-md-0">
            <h3 v-if="isNew">Don't know the current usage of the components above?</h3>
            <h3 v-else>Lost track of the usage for this gear?</h3>
            <p class="mt-1">Strautomator can calculate it for you! Enter the date when you last swapped the component(s), up to 2 years. ago.</p>
            <div class="d-flex text-center text-md-left" :class="{'flex-column': !$breakpoint.mdAndUp}">
                <div class="flex-grow-0">
                    <v-menu v-model="dateMenu" :close-on-content-click="false" :nudge-right="40" transition="scale-transition" min-width="290px" offset-y>
                        <template v-slot:activator="{on, attrs}">
                            <v-text-field v-model="dateSince" v-bind="attrs" v-on="on" width="200px" label="Since date" type="text" prepend-icon="mdi-calendar" :loading="pastLoading" outlined readonly rounded dense></v-text-field>
                        </template>
                        <v-date-picker v-model="dateSince" :min="dateSinceMin" :max="dateSinceMax" @input="dateMenu = false"></v-date-picker>
                    </v-menu>
                </div>
                <div class="flex-grow-0">
                    <v-btn color="primary" class="ml-md-2" title="Get distance and hours from Strava activities" @click="getPastUsage" :disabled="pastLoading || !dateSince" rounded>
                        <v-icon left>mdi-calculator</v-icon>
                        Get expected usage
                    </v-btn>
                </div>
            </div>
            <v-alert border="top" color="accent" v-if="!isNew && pastActivities > 0">
                Since {{ formatDateSince }} this gear has been used for {{ pastUsage }}.<br />
                You can manually update the relevant components with these values now.
            </v-alert>
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
    props: ["gearwear-config", "is-new"],
    mixins: [userMixin],
    data() {
        const dateSinceMin = this.$dayjs().subtract(2, "years")
        const dateSinceMax = this.$dayjs()

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
            return this.$dayjs(this.dateSince).format("ll")
        }
    },
    methods: {
        async getPastUsage() {
            try {
                this.pastLoading = true

                const timestamp = this.$dayjs(this.dateSince).unix()
                const activities = await this.$axios.$get(`/api/strava/${this.user.id}/activities/since/${timestamp}?gear=${this.gearwearConfig.id}`)

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

                // Only update if it's a new GearWear config.
                if (this.isNew) {
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
                }

                this.pastActivities = activities.length
                this.pastUsage = `${distance} ${this.distanceUnits} and ${hours} hours`
                this.pastUsageAlert = true
            } catch (ex) {
                this.$webError(this, "GearPastUsagePanel.getPastUsage", ex)
            }

            this.pastLoading = false
        }
    }
}
</script>
