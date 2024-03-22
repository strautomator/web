<template>
    <v-btn color="primary" to="/calendar" title="Calendar" rounded nuxt v-if="$store?.state.user">
        <v-icon left>mdi-link</v-icon>
        Go to Calendar
    </v-btn>
    <connect-strava v-else />
</template>

<script>
import ConnectStrava from "~/components/buttons/ConnectStrava.vue"

export default {
    components: {ConnectStrava}
}
</script>
