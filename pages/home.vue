<template>
    <v-content>
        <section id="hero">
            <v-row no-gutters>
                <v-img :min-height="'calc(100vh - ' + $vuetify.application.top + 'px)'" src="/images/home-bg.jpg">
                    <v-theme-provider dark>
                        <v-container fill-height>
                            <v-row align="center" class="white--text mx-auto" justify="center">
                                <v-col class="white--text text-center" cols="12" tag="h1">
                                    <span class="font-weight-light" :class="[$vuetify.breakpoint.smAndDown ? 'display-2' : 'display-2']">
                                        Automate your Strava activities!
                                    </span>
                                </v-col>

                                <v-btn class="align-self-end" fab outlined @click="$vuetify.goTo('#about')">
                                    <v-icon>mdi-chevron-double-down</v-icon>
                                </v-btn>
                            </v-row>
                        </v-container>
                    </v-theme-provider>
                </v-img>
            </v-row>
        </section>

        <section id="about">
            <div class="py-2"></div>

            <v-container class="text-center section-wrapper">
                <h2 class="display-2 font-weight-bold">Strautomator</h2>
                <h5 class="beta">BETA</h5>

                <v-responsive class="mx-auto mb-8" width="280">
                    <v-divider class="mb-1"></v-divider>
                    <v-divider></v-divider>
                </v-responsive>

                <v-responsive class="mx-auto font-weight-light mb-8">
                    <div>Rename and set the right bike on your commutes</div>
                    <div>Set fun activity names based on the activity effort</div>
                    <div>Add weather information to your activities</div>
                    <div>And much more!</div>
                </v-responsive>

                <div class="mt-4">
                    <a title="Connect with Strava..." @click="login()"><img src="/images/strava-connect.svg" /></a>
                </div>

                <div class="faq mt-6 text-left">
                    <h3>How does it work?</h3>
                    <div>
                        <p></p>
                        Once you connect and authorize Strautomator to get your Strava data, we'll setup a callback with Strava. Then we'll process activities as soon as you upload or create them, and trigger the relevant automations that you have
                        defined.
                    </div>
                    <h3>Is it free?</h3>
                    <div>
                        <p>
                            While we're in beta there are no restrictions, so you can create as many automations as you want. Once we go out of beta, free accounts will have some restrictions, and you'll be able to subscribe to "Pro" for around 10
                            EUR / year.
                        </p>
                    </div>
                </div>
            </v-container>

            <div class="py-4"></div>
        </section>
    </v-content>
</template>

<style>
h5.beta {
    margin: 0 0 10px 0;
}

.section-wrapper {
    max-width: 600px;
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
