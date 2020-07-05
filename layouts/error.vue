<template>
    <v-app dark>
        <div class="text-center mt-10">
            <div class="width-wrapper text-center">
                <img src="/images/logo-round.svg" width="96" height="96" class="strautologo" />
                <div class="mt-8" v-if="errorDetails">
                    <h1 class="display-1">{{ errorDetails.title }}</h1>
                    <div class="headline">{{ errorDetails.message }}</div>
                </div>
                <div class="mt-8" v-if="showLogin">
                    <p>
                        Please try connecting to Strava again.
                    </p>
                    <div class="mt-4">
                        <a title="Connect with Strava..." @click="login()"><img class="strava-connect" src="/images/strava-connect.svg"/></a>
                    </div>
                </div>
                <div class="mt-8" v-else>
                    <p>
                        If you are just sneaking around then I wish you happy exploring.
                        <br v-if="$breakpoint.mdAndUp" />
                        Otherwise contact me on
                        <a href="mailto:info@strautomator.com" title="Bug report via email">info@strautomator.com</a> and I'll be glad to investigate.
                    </p>
                </div>
                <v-alert color="error" border="top" v-if="stravaStatus" class="mb-4 " outlined>
                    <div class="font-weight-bold">Strava status: {{ stravaStatus }}</div>
                    <div>
                        <a class="secondary--text" href="https://status.strava.com" title="Strava API status">https://status.strava.com</a>
                    </div>
                </v-alert>
                <div class="mt-6">
                    <v-btn color="primary" title="Go back home..." @click="backHome" rounded small>Back home</v-btn>
                </div>
                <div class="copyright">
                    <span>Strautomator.com</span>
                </div>
            </div>
        </div>
    </v-app>
</template>

<script>
export default {
    layout: "landing",
    head() {
        const status = this.error.status || this.error.statusCode
        return {title: `Error ${status}`}
    },
    props: {
        error: {
            type: Object,
            default: null
        }
    },
    data() {
        return {
            stravaStatus: null
        }
    },
    computed: {
        errorDetails() {
            let status = this.error.status || this.error.statusCode
            let message = this.error.description ? this.error.description : this.error.message

            if (message && message.indexOf("{") == 0 && message.indexOf("}") > 0) {
                message = null
            }

            if (status == 401 || status == 403) {
                return {
                    title: this.error.title || "Access denied",
                    message: message || "We're not entirely sure if you should be here..."
                }
            } else if (status == 404) {
                return {
                    title: this.error.title || "Lost GPS signal",
                    message: message || "This is the infamous error 404. We can't find this route..."
                }
            } else {
                return {
                    title: this.error.title || "Crashed while sprinting",
                    message: message || "Something went very, very wrong..."
                }
            }
        },
        showLogin() {
            const status = this.error.status || this.error.statusCode
            return status == 401 || status == 403
        }
    },
    mounted() {
        this.getStravaStatus()
    },
    methods: {
        async getStravaStatus() {
            try {
                const res = await fetch("https://status.strava.com/api/v2/status.json")
                const data = await res.json()

                if (data.status && data.status.indicator != "" && data.status.indicator != "none") {
                    this.stravaStatus = data.status.description
                }
            } catch (ex) {
                console.error("Could not get API status from Strava", ex)
            }
        },
        backHome() {
            window.location.href = "/"
        }
    }
}
</script>
