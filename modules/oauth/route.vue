<template>
    <div class="text-center mt-2">
        <h2 class="mt-10 mb-10">
            {{ $route.name != "oauth-logout" ? "Connecting to Strava..." : "Disconnecting from Strava..." }}
        </h2>
        <v-progress-circular indeterminate></v-progress-circular>
    </div>
</template>

<script>
export default {
    layout: "landing",
    mounted() {
        if (this.$route.name != "oauth-logout") {
            window.location.reload()
        } else {
            window.location.href = "/home"
        }
    }
}
</script>
