<template>
    <v-main fluid>
        <div class="stripe"></div>
        <div class="py-2"></div>

        <v-container class="text-center" fluid>
            <div class="home-wrapper">
                <h1 class="font-weight-light mt-1 mb-2" :class="$breakpoint.mdAndUp ? 'display-1' : 'headline'">Strautomator</h1>
                <h2 class="display-2 font-weight-bold mb-4">Changelog</h2>

                <v-card color="black" class="mb-2 text-left">
                    <v-card-text>
                        <div class="mb-6" v-for="(dateReleases, date) in releases" :key="`r-${date}`">
                            <h2 class="mb-2">{{ date }}</h2>
                            <ul class="ml-0 pl-4">
                                <template v-for="release in dateReleases">
                                    <li v-for="(change, index) in release.changes" :key="`c-${index}`">
                                        {{ change.substring(2) }}
                                    </li>
                                </template>
                            </ul>
                        </div>
                        <div class="text-center mt-2">
                            <v-btn color="primary" @click="goBack" rounded>Back {{ backTarget }}</v-btn>
                        </div>
                    </v-card-text>
                </v-card>
            </div>
        </v-container>
    </v-main>
</template>

<script>
import _ from "lodash"

export default {
    authenticated: false,
    layout: "landing",
    head() {
        return {
            title: "Changelog"
        }
    },
    data() {
        return {
            backTarget: this.$store.state.user ? "to the Dashboard" : "home",
            releases: null
        }
    },
    async fetch() {
        try {
            const changelog = await this.$axios.$get("/api/github/changelog")
            const releases = _.sortBy(Object.values(changelog), "datePublished").reverse()
            this.releases = _.groupBy(releases, (r) => r.datePublished.split("T")[0])
        } catch (ex) {
            this.$webError("Changelog.fetch", ex)
        }
    },
    methods: {
        goBack() {
            if (this.$store.state.user) {
                document.location.href = "/dashboard"
            } else {
                document.location.href = "/home"
            }
        }
    }
}
</script>
