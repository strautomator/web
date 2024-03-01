<template>
    <div class="mt-6 mb-2 text-center" v-if="!hidden">
        <v-card class="mr-3 ml-3" outlined>
            <v-card-text class="grey lighten-2">
                <v-row>
                    <v-col :cols="$breakpoint.mdAndUp ? 4 : 6" v-for="link in links" :key="`affiliate-${link.id}`">
                        <a :href="link.url" :target="link.id" :title="link.title"><v-img :src="'/images/affiliates/' + link.id + '.png'" max-height="58px" class="mt-1" /></a>
                    </v-col>
                </v-row>
                <div class="mt-4 caption black--text text-center">Using our affiliate links is a win-win: you get the best deals, and Strautomator gets a small commission to keep the servers running.</div>
            </v-card-text>
        </v-card>
    </div>
</template>

<script>
import _ from "lodash"

export default {
    data() {
        const affiliates = [
            {id: "aliexpress", title: "AliExpress", url: "https://links.devv.com/l/aliexpress-cycling-components"},
            {id: "decathlon", title: "Decathlon", url: "https://links.devv.com/l/decathlon", country: ["at", "de", "gb", "it", "ie", "uk"]},
            {id: "halfords", title: "Halfords", url: "https://links.devv.com/l/halfords", country: ["gb", "ie", "im", "uk"]},
            {id: "ican", title: "ICAN", url: "https://links.devv.com/l/ican"},
            {id: "nextdns", title: "NextDNS", url: "https://links.devv.com/l/nextdns"},
            {id: "ribble", title: "Ribble", url: "https://links.devv.com/l/ribble", country: ["at", "de", "gb", "ie", "im", "uk"]}
        ]

        const country = this.$store.state.country || "us"
        const links = affiliates.filter((a) => !a.country || a.country.includes(country))

        return {
            links: _.sortBy(_.sampleSize(links, this.$breakpoint.mdAndUp ? 3 : 2), "id")
        }
    },
    computed: {
        hidden() {
            const urls = ["/billing/"]
            const hidden = urls.find((u) => this.$route?.path.includes(u))
            return hidden || (!this.$store.state.beta && this.$store.state.user?.isPro)
        }
    }
}
</script>
