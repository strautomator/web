<template>
    <div class="mt-4 mb-2 text-center" v-if="!hidden">
        <div class="text-h6">Affiliate links</div>
        <v-card class="mr-3 ml-3 pt-1" outlined>
            <v-card-text class="grey lighten-2">
                <v-row>
                    <v-col cols="4" v-for="link in links" :key="`affiliate-${link.id}`">
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
            {id: "decathlon", title: "Decathlon", url: "https://links.devv.com/l/decathlon", country: ["de", "it"]},
            {id: "halfords", title: "Halfords", url: "https://links.devv.com/l/halfords", country: ["gb", "ie", "im", "uk"]},
            {id: "ican", title: "ICAN", url: "https://links.devv.com/l/ican"},
            {id: "nextdns", title: "NextDNS", url: "https://links.devv.com/l/nextdns"},
            {id: "ribble", title: "Ribble", url: "https://links.devv.com/l/ribble", country: ["at", "de", "gb", "ie", "im", "uk"]}
        ]

        const country = this.$store.state.country || "us"
        const links = affiliates.filter((a) => !a.country || a.country.includes(country))

        return {
            links: _.sortBy(_.sampleSize(links, 3), "id")
        }
    },
    computed: {
        hidden() {
            return !this.$store.state.beta && this.$store.state.user?.isPro
        }
    }
}
</script>
