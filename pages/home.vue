<template>
    <v-content fluid>
        <div class="py-2"></div>

        <v-container class="text-center" fluid>
            <h1 class=" font-weight-light display-2 mt-10 mb-10 pb-10 pt-10">
                Automate your Strava activities!
            </h1>

            <div class="home-wrapper">
                <v-card color="black" class="mb-5">
                    <v-card-text>
                        <h2 class="display-2 font-weight-bold">Strautomator</h2>
                        <h5 class="beta">BETA</h5>
                        <v-responsive class="mx-auto mb-8" width="280">
                            <v-divider class="mb-1"></v-divider>
                            <v-divider></v-divider>
                        </v-responsive>
                        <v-responsive class="mx-auto font-weight-light mb-8">
                            <div>Rename and set the right bike on your commutes.</div>
                            <div>Set fun activity names based on the activity effort.</div>
                            <div>Add weather information to your activity description.</div>
                            <div>And much, much more!</div>
                            <div class="mt-5">Strautomator is like IFTTT, but for Strava.</div>
                        </v-responsive>
                        <div class="mt-4">
                            <a title="Connect with Strava..." @click="login()"><img src="/images/strava-connect.svg"/></a>
                        </div>
                    </v-card-text>
                </v-card>

                <div class="faq mt-6 px-1 text-left">
                    <h3>How does it work?</h3>
                    <div>
                        <p></p>
                        Once you authorize and connect Strautomator to your Strava account, we'll setup a callback with them. Then we'll process activities as soon as you upload or create them, and trigger the relevant automations that you have
                        defined.
                    </div>
                    <h3>Is it free?</h3>
                    <div>
                        <p>
                            Yes! And while the service is in beta, everyone gets unlimited use.
                        </p>
                    </div>
                    <h3>Want to know more?</h3>
                    <div>
                        <p>
                            <n-link to="/help" title="Strautomator's Help">Check the help page...</n-link>
                        </p>
                    </div>
                </div>
            </div>
        </v-container>

        <div class="py-4"></div>
    </v-content>
</template>

<style>
h5.beta {
    margin: 0 0 10px 0;
}

.home-wrapper {
    max-width: 660px;
    margin: auto;
}

.faq h3 {
    margin-bottom: 2px;
}

.faq div {
    margin-bottom: 20px;
}
</style>

<script>
export default {
    layout: "landing",
    head() {
        return {
            title: "Automate your Strava"
        }
    },
    methods: {
        login() {
            this.$login()
        }
    }
}
</script>
