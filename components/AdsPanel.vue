<template>
    <div class="mt-6 mb-2 text-center" v-if="!hidden">
        <v-card class="mr-3 ml-3" outlined>
            <v-card-text class="grey lighten-2">
                <v-row>
                    <v-col :cols="12 / links.length" v-for="link in links" :key="`affiliate-${link.id}`">
                        <a :href="link.url" :target="link.id" :title="link.title"><v-img :src="'https://links.devv.com/images/' + link.id + '.png'" max-height="64px" class="mt-1" /></a>
                    </v-col>
                </v-row>
                <div class="mt-4 caption black--text text-center">Using our affiliate links is a win-win. You get the best deals, and Strautomator gets a commission to keep the servers running.</div>
            </v-card-text>
        </v-card>
    </div>
</template>

<script>
import _ from "lodash"

export default {
    data() {
        return {
            links: []
        }
    },
    computed: {
        hidden() {
            const urls = ["/billing/"]
            const hidden = urls.find((u) => this.$route?.path.includes(u))
            return hidden || this.$store.state.user?.isPro
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
        this.refreshLinks()
    },
    methods: {
        refreshLinks() {
            const affiliates = [
                {id: "aliexpress", title: "AliExpress", url: "https://links.devv.com/l/aliexpress-cycling-components"},
                {id: "decathlon", title: "Decathlon", url: "https://links.devv.com/l/decathlon", country: ["AT", "DE", "GB", "IT", "IE", "UK"]},
                {id: "halfords", title: "Halfords", url: "https://links.devv.com/l/halfords", country: ["GB", "IE", "IM", "UK"]},
                {id: "ican", title: "ICAN", url: "https://links.devv.com/l/ican"},
                {id: "nextdns", title: "NextDNS", url: "https://links.devv.com/l/nextdns"},
                {id: "ribble", title: "Ribble", url: "https://links.devv.com/l/ribble", country: ["AT", "DE", "GB", "IE", "IM", "UK"]}
            ]

            const country = this.$store.state.country
            const links = affiliates.filter((a) => !a.country || a.country.includes(country))

            this.links = _.sortBy(_.sampleSize(links, this.$breakpoint.mdAndUp ? 3 : 2), "id")
        }
    }
}
</script>
