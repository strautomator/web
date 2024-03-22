<template>
    <v-btn color="primary" to="/automations" title="My Automations" rounded nuxt v-if="$store?.state.user">
        <v-icon left>mdi-link</v-icon>
        Go to My Automations
    </v-btn>
    <connect-strava v-else />
</template>

<script>
import ConnectStrava from "~/components/buttons/ConnectStrava.vue"

export default {
    components: {ConnectStrava}
}
</script>
