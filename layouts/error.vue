<template>
    <v-app dark>
        <div class="text-center mt-10">
            <div class="width-wrapper text-center">
                <img src="/images/logo-round.svg" width="96" height="96" class="strautologo" />
                <div class="mt-8" v-if="errorDetails">
                    <h1 class="display-1">{{ errorDetails.title }}</h1>
                    <div class="headline">{{ errorDetails.message }}</div>
                </div>
                <div class="mt-8">
                    <p>
                        If you are just sneaking around, then I wish you happy exploring. Otherwise please contact me on
                        <a href="mailto:info@strautomator.com" title="Send us your feedback!">info@strautomator.com</a> and I'll be glad to investigate and fix potential bugs.
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
                    <img src="/images/logo.svg" width="24" height="24" class="strautologo" />
                    <span>Strautomator</span>
                </div>
            </div>
        </div>
    </v-app>
</template>

<script>
export default {
    layout: "landing",
    head() {
        return {
            title: `Error ${this.error.statusCode}`
        }
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
            if (this.error.statusCode == 401 || this.error.statusCode == 403) {
                return {
                    title: this.error.title || "Access denied",
                    message: this.error.message || "We're not entirely sure if you should be here..."
                }
            } else if (this.error.statusCode == 404) {
                return {
                    title: this.error.title || "Lost GPS signal",
                    message: this.error.message || "This is the infamous error 404. We can't find this route..."
                }
            } else {
                return {
                    title: this.error.title || "Crashed while sprinting",
                    message: this.error.message || "Something went very, very wrong..."
                }
            }
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
