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
                    <td class="text-center">3</td>
                    <td class="text-center">Unlimited</td>
                </tr>
                <tr>
                    <td>Conditions</td>
                    <td class="text-center">3</td>
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
                    <td class="text-center">Donation</td>
                </tr>
            </tbody>
        </v-simple-table>
        <ul class="caption mt-2 mb-5 pl-4">
            <li>While in beta, everyone is a PRO <v-icon x-small>mdi-emoticon-outline</v-icon></li>
            <li class="beta">Free accounts are limited to only 3 conditions per automation.</li>
            <li class="beta">Free accounts will have a link to Strautomator on the description of 20% of processed activities.</li>
        </ul>
    </div>
</template>
