<template>
    <div class="mt-6 mb-2 text-center" v-if="!hidden">
        <v-card class="mr-3 ml-3">
            <v-card-title class="accent pt-1 text-body-1">Partner stores and services</v-card-title>
            <v-card-text class="grey lighten-2">
                <v-row>
                    <v-col :cols="12 / links.length" v-for="link in links" :key="`affiliate-${link.id}`">
                        <a :href="link.url" :target="link.id" :title="link.title"
                            ><v-img :src="'https://links.strautomator.com/images/' + link.id + '.png'" max-height="64px" class="mt-1" :alt="link.title" @error="adFailed" v-if="failCount < links.length" /><span
                                class="font-weight-bold text-md-h3"
                                v-else
                                >{{ link.title }}</span
                            ></a
                        >
                    </v-col>
                </v-row>
            </v-card-text>
        </v-card>
    </div>
</template>

<script>
import _ from "lodash"

export default {
    data() {
        return {
            failCount: 0,
            links: []
        }
    },
    computed: {
        hidden() {
            const urls = ["/billing/"]
            const hidden = urls.find((u) => this.$route?.path.includes(u))
            return hidden || (this.$store.state.user?.isPro && !this.$store.state.user?.debug)
        }
    },
    watch: {
        "$route.path": function (oldPath, newPath) {
            if (!this.hidden && newPath) {
                this.refreshLinks()
            }
        }
    },
    mounted() {
        setTimeout(this.refreshLinks, 10)
    },
    methods: {
        refreshLinks() {
            this.failCount = 0

            const affiliates = [
                {id: "aliexpress", title: "AliExpress", url: "https://links.strautomator.com/l/aliexpress-cycling-components"},
                {id: "decathlon", title: "Decathlon", url: "https://links.strautomator.com/l/decathlon", country: ["AT", "DE", "GB", "IT", "IE", "UK"]},
                {id: "halfords", title: "Halfords", url: "https://links.strautomator.com/l/halfords", country: ["GB", "IE", "IM", "UK"]},
                {id: "ican", title: "ICAN", url: "https://links.strautomator.com/l/ican"},
                {id: "nextdns", title: "NextDNS", url: "https://links.strautomator.com/l/nextdns"},
                {id: "ribble", title: "Ribble", url: "https://links.strautomator.com/l/ribble", country: ["AT", "DE", "GB", "IE", "IM", "UK"]}
            ]

            const country = this.$store.state.country
            const links = affiliates.filter((a) => !a.country || a.country.includes(country))

            this.links = _.sortBy(_.sampleSize(links, this.$breakpoint.mdAndUp ? 3 : 2), "id")
        },
        adFailed() {
            this.failCount++
        }
    }
}
</script>
