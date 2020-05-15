<template>
    <div>
        <v-simple-table>
            <thead>
                <tr>
                    <th>Features</th>
                    <th class="text-center">FREE</ht>
                    <th class="text-center">PRO</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Automations</td>
                    <td class="text-center"><span class="beta">-3-</span></td>
                    <td class="text-center">Unlimited</td>
                </tr>
                <tr>
                    <td>Conditions</td>
                    <td class="text-center"><span class="beta">-3-</span></td>
                    <td class="text-center">Unlimited</td>
                </tr>
                <tr>
                    <td>No Links</td>
                    <td class="text-center"><v-icon>mdi-checkbox-blank-circle-outline</v-icon></td>
                    <td class="text-center"><v-icon>mdi-checkbox-marked-circle-outline</v-icon></td>
                </tr>
                <tr>
                    <td>How much?</td>
                    <td class="text-center">Free</td>
                    <td class="text-center">
                        <n-link to="/donate" v-if="$nuxt.$route.path.indexOf('donate') < 0">Donation</n-link>
                        <span v-else>Donation</span>
                    </td>
                </tr>
            </tbody>
        </v-simple-table>
        <ul class="caption mt-2 mb-5 pl-4">
            <li class="beta">Free accounts are limited to only 3 conditions per automation.</li>
            <li>Free accounts will have a link to Strautomator on the description of {{ $store.state.linksOnPercent }}% of processed activities.</li>
        </ul>
    </div>
</template>
