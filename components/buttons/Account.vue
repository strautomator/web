<template>
    <v-btn color="primary" to="/account" title="My Account" rounded nuxt v-if="$store?.state.user">
        <v-icon left>mdi-link</v-icon>
        Go to My Account
    </v-btn>
    <connect-strava v-else />
</template>

<script>
import ConnectStrava from "~/components/buttons/ConnectStrava.vue"

export default {
    components: {ConnectStrava}
}
</script>
