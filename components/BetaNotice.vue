<template>
    <v-card v-if="$store.state.beta" class="mb-4" outlined>
        <v-card-text class="pa-4 text-left">
            <ul class="pl-3">
                <li>Only available to PRO users.</li>
                <li>Unused beta accounts will be deleted regularly.</li>
                <li>Not possible (and not actually needed) to subscribe to PRO via PayPal.</li>
                <li>Beta profiles and configurations are independent and will not affect the production accounts.</li>
                <li>The Spotify integration is restricted, please get in touch if you want to use it in Beta.</li>
                <li>GearWear calculations and notifications are not guaranteed to work.</li>
                <li>The FTP auto update feature is disabled.</li>
                <li>Expect things to break!</li>
            </ul>
        </v-card-text>
    </v-card>
</template>
