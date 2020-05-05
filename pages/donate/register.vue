<template>
    <v-layout column>
        <v-container class="text-center" fluid>
            <div class="width-wrapper text-center">
                <h1 class="mt-10">Want do donate to Strautomator?</h1>

                <p>
                    Although you could in theory donate withour registering to the service, I suppose you would prefer at least to try it out first :-)
                </p>
                <p>
                    Please connect with Strava using the button below:
                </p>

                <div class="mt-10 text-center">
                    <a title="Connect with Strava..." @click="login()"><img src="/images/strava-connect.svg"/></a>
                </div>
            </div>
        </v-container>
    </v-layout>
</template>

<style>
.v-expansion-panel-header {
    line-height: 22px;
}
.v-expansion-panel-header--active {
    font-weight: bold;
}
</style>

<script>
export default {
    authenticated: false,
    layout({store}) {
        if (!store.state.oauth || !store.state.user) {
            return "landing"
        } else {
            return "default"
        }
    },
    head() {
        return {
            title: "Register to donate"
        }
    },
    mounted() {
        if (this.$store.state.oauth || this.$store.state.user) {
            document.location.href = "/donate"
        }
    },
    methods: {
        login() {
            this.$login()
        }
    }
}
</script>
