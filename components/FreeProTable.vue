<template>
    <div>
        <v-card outlined>
            <v-card-text class="pa-0">
                <v-simple-table>
                    <thead class="accent">
                        <tr>
                            <th>Features</th>
                            <th class="text-center">FREE</th>
                            <th class="text-center">PRO</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Automations</td>
                            <td class="text-center">{{ $store.state.freePlanDetails.maxRecipes }}</td>
                            <td class="text-center">Unlimited</td>
                        </tr>
                        <tr>
                            <td>GearWear</td>
                            <td class="text-center">{{ $store.state.freePlanDetails.maxGearWear }}</td>
                            <td class="text-center">Unlimited</td>
                        </tr>
                        <tr>
                            <td>Weather providers</td>
                            <td class="text-center">1</td>
                            <td class="text-center">6</td>
                        </tr>
                        <tr>
                            <td>Personal records</td>
                            <td class="text-center">Bike, Run</td>
                            <td class="text-center">All sports</td>
                        </tr>
                        <tr>
                            <td>Batch processing</td>
                            <td class="text-center">{{ $store.state.freePlanDetails.batchDays }} days</td>
                            <td class="text-center">{{ $store.state.proPlanDetails.batchDays }} days</td>
                        </tr>
                        <tr>
                            <td>Calendar range</td>
                            <td class="text-center">
                                -{{ $store.state.freePlanDetails.pastCalendarDays }}{{ dayText }}<br />
                                +{{ $store.state.freePlanDetails.futureCalendarDays }}{{ dayText }}
                            </td>
                            <td class="text-center">
                                -{{ $store.state.proPlanDetails.pastCalendarDays }}{{ dayText }}<br />
                                +{{ $store.state.proPlanDetails.futureCalendarDays }}{{ dayText }}
                            </td>
                        </tr>
                        <tr>
                            <td>Calendar customization</td>
                            <td class="text-center">Limited</td>
                            <td class="text-center"><v-icon>mdi-checkbox-marked-circle-outline</v-icon></td>
                        </tr>
                        <tr>
                            <td>AI integration</td>
                            <td class="text-center">Limited</td>
                            <td class="text-center"><v-icon>mdi-checkbox-marked-circle-outline</v-icon></td>
                        </tr>
                        <tr>
                            <td>Shared automations</td>
                            <td class="text-center"><v-icon>mdi-checkbox-blank-circle-outline</v-icon></td>
                            <td class="text-center"><v-icon>mdi-checkbox-marked-circle-outline</v-icon></td>
                        </tr>
                        <tr>
                            <td>FTP auto update</td>
                            <td class="text-center"><v-icon>mdi-checkbox-blank-circle-outline</v-icon></td>
                            <td class="text-center"><v-icon>mdi-checkbox-marked-circle-outline</v-icon></td>
                        </tr>
                        <tr>
                            <td>Garmin sensors</td>
                            <td class="text-center"><v-icon>mdi-checkbox-blank-circle-outline</v-icon></td>
                            <td class="text-center"><v-icon>mdi-checkbox-marked-circle-outline</v-icon></td>
                        </tr>
                        <tr>
                            <td>Wahoo sensors</td>
                            <td class="text-center"><v-icon>mdi-checkbox-blank-circle-outline</v-icon></td>
                            <td class="text-center"><v-icon>mdi-checkbox-marked-circle-outline</v-icon></td>
                        </tr>
                        <tr>
                            <td>Spotify lyrics</td>
                            <td class="text-center"><v-icon>mdi-checkbox-blank-circle-outline</v-icon></td>
                            <td class="text-center"><v-icon>mdi-checkbox-marked-circle-outline</v-icon></td>
                        </tr>
                        <tr>
                            <td>Webhooks</td>
                            <td class="text-center"><v-icon>mdi-checkbox-blank-circle-outline</v-icon></td>
                            <td class="text-center"><v-icon>mdi-checkbox-marked-circle-outline</v-icon></td>
                        </tr>
                        <tr>
                            <td>No linkbacks</td>
                            <td class="text-center"><v-icon>mdi-checkbox-blank-circle-outline</v-icon></td>
                            <td class="text-center"><v-icon>mdi-checkbox-marked-circle-outline</v-icon></td>
                        </tr>
                        <tr>
                            <td>No website ads</td>
                            <td class="text-center"><v-icon>mdi-checkbox-blank-circle-outline</v-icon></td>
                            <td class="text-center"><v-icon>mdi-checkbox-marked-circle-outline</v-icon></td>
                        </tr>
                    </tbody>
                </v-simple-table>
            </v-card-text>
        </v-card>
    </div>
</template>

<script>
import subscriptionMixin from "~/mixins/subscriptionMixin.js"
import userMixin from "~/mixins/userMixin.js"

export default {
    mixins: [subscriptionMixin, userMixin],
    computed: {
        dayText() {
            return this.$breakpoint.mdAndUp ? " days" : "d"
        }
    }
}
</script>
