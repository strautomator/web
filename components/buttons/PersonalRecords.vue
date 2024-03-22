<template>
    <v-btn color="primary" to="/dashboard/records" title="Personal Records" rounded nuxt v-if="$store?.state.user">
        <v-icon left>mdi-link</v-icon>
        Go to Personal Records
    </v-btn>
    <connect-strava v-else />
</template>

<script>
import ConnectStrava from "~/components/buttons/ConnectStrava.vue"

export default {
    components: {ConnectStrava}
}
</script>
