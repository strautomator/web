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
                        If you are just sneeking around, then we wish you happy exploring. Now if you found something strange, or thing that this shouldn't have happened at all, then please contact us on
                        <a href="mailto:info@strautomator.com" title="Send us your feedback!">info@strautomator.com</a>.
                    </p>
                </div>
                <div class="mt-6">
                    <v-btn color="primary" title="Go back home..." @click="backHome" rounded small>Back home</v-btn>
                </div>
                <div class="copyright">
                    <img src="/images/logo.svg" width="24" height="24" class="strautologo" />
                    <span>Strautomator - Made in Berlin</span>
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
    computed: {
        errorDetails() {
            if (this.error.statusCode == 401 || this.error.statusCode == 403) {
                return {
                    title: "Access denied",
                    message: "We're not entirely sure if you should be here..."
                }
            } else if (this.error.statusCode == 404) {
                return {
                    title: "Lost GPS signal",
                    message: "This is the infamous error 404. We can't find this route..."
                }
            } else {
                return {
                    title: "500 - Crashed while sprinting",
                    message: "damn"
                }
            }
        }
    },
    methods: {
        backHome() {
            window.location.href = "/"
        }
    }
}
</script>

<style scoped>
h1 {
    font-size: 20px;
}
</style>
