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
                            <td>iCalendar days</td>
                            <td class="text-center">{{ $store.state.freePlanDetails.maxCalendarDays }}</td>
                            <td class="text-center">{{ $store.state.proPlanDetails.maxCalendarDays }}</td>
                        </tr>
                        <tr>
                            <td>iCalendar template</td>
                            <td class="text-center"><v-icon>mdi-checkbox-blank-circle-outline</v-icon></td>
                            <td class="text-center"><v-icon>mdi-checkbox-marked-circle-outline</v-icon></td>
                        </tr>
                        <tr>
                            <td>FTP auto update</td>
                            <td class="text-center"><v-icon>mdi-checkbox-blank-circle-outline</v-icon></td>
                            <td class="text-center"><v-icon>mdi-checkbox-marked-circle-outline</v-icon></td>
                        </tr>
                        <tr>
                            <td>Webhooks</td>
                            <td class="text-center"><v-icon>mdi-checkbox-blank-circle-outline</v-icon></td>
                            <td class="text-center"><v-icon>mdi-checkbox-marked-circle-outline</v-icon></td>
                        </tr>
                        <tr>
                            <td>No linkbacks *</td>
                            <td class="text-center"><v-icon>mdi-checkbox-blank-circle-outline</v-icon></td>
                            <td class="text-center"><v-icon>mdi-checkbox-marked-circle-outline</v-icon></td>
                        </tr>

                        <tr v-if="!noPrice">
                            <td>Price</td>
                            <td class="text-center">Free</td>
                            <td class="text-center">
                                <n-link to="/billing" v-if="$store.state.user && !$store.state.user.isPro" nuxt>${{ $store.state.proPlanDetails.price.year }} / year</n-link>
                                <span v-else>${{ $store.state.proPlanDetails.price.year }} / year</span>
                            </td>
                        </tr>
                    </tbody>
                </v-simple-table>
            </v-card-text>
        </v-card>
        <ul class="caption mt-2 mb-5 pl-4" v-if="!$store.state.user || !$store.state.user.isPro">
            <li>A link to strautomator.com is added to {{ $store.state.linksOnPercent }}% of processed activities by default. PRO users can disable these links.</li>
        </ul>
    </div>
</template>

<script>
export default {
    props: ["no-price"]
}
</script>
