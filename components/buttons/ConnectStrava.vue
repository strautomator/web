<template>
    <a title="Connect with Strava..." @click="login()"><img class="strava-connect" src="/images/strava-connect.svg" /></a>
</template>

<script>
export default {
    methods: {
        login() {
            this.$login()
        }
    }
}
</script>
