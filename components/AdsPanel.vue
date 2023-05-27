<template>
    <div class="mt-4 mb-2 text-center" v-if="!hidden">
        <div class="text-h6">Affiliate links</div>
        <v-card class="mr-3 ml-3 pt-1" outlined>
            <v-card-text class="grey lighten-2">
                <v-row>
                    <v-col cols="4">
                        <a :href="linkIcan" target="ican" title="Carbon wheels and frames @ ICAN"><v-img src="/images/affiliates/ican.png" max-height="58px" class="mt-1" /></a>
                    </v-col>
                    <v-col cols="4">
                        <a :href="linkRibble" target="ribble" title="Bikes and components @ Ribble"><v-img src="/images/affiliates/ribble.png" max-height="58px" /></a>
                    </v-col>
                    <v-col cols="4" v-if="isUK">
                        <a :href="linkHalfords" target="halfords" title="Bikes and components @ Halfords"><v-img src="/images/affiliates/halfords.png" max-height="58px" class="mt-1" /></a>
                    </v-col>
                    <v-col cols="4" v-else-if="isDecathlon">
                        <a :href="linkDecathlon" target="decathlon" title="Sports gear @ Decathlon"><v-img src="/images/affiliates/decathlon.png" max-height="58px" /></a>
                    </v-col>
                    <v-col cols="4" v-else-if="isAmerica">
                        <a :href="linkAliExpress" target="aliexpress" title="Bikes, components and gadgets @ AliExpress"><v-img src="/images/affiliates/aliexpress.png" max-height="58px" class="mt-1" /></a>
                    </v-col>
                    <v-col cols="4" v-else>
                        <a :href="linkNextDns" target="nextdns" title="Turbocharge your internet experience with NextDNS"><v-img src="/images/affiliates/nextdns.png" max-height="58px" class="mt-1" /></a>
                    </v-col>
                </v-row>
                <div class="mt-4 caption black--text text-center">Using our affiliate links is a win-win: you get the best deals, and Strautomator gets a small commission to keep the servers running.</div>
            </v-card-text>
        </v-card>
    </div>
</template>

<script>
export default {
    data() {
        return {
            linkAliExpress: "https://links.devv.com/l/aliexpress-cycling-components",
            linkDecathlon: "https://links.devv.com/l/decathlon",
            linkHalfords: "https://links.devv.com/l/halfords",
            linkNextDns: "https://links.devv.com/l/nextdns",
            linkIcan: "https://links.devv.com/l/ican",
            linkRibble: "https://links.devv.com/l/ribble"
        }
    },
    computed: {
        hidden() {
            return this.$store.state.user?.isPro
        },
        isAmerica() {
            return ["ar", "br", "ca", "cl", "co", "mx", "us"].includes(this.$store.state.country)
        },
        isDecathlon() {
            return ["de", "it"].includes(this.$store.state.country)
        },
        isUK() {
            return ["gb", "ie", "im", "uk"].includes(this.$store.state.country)
        }
    }
}
</script>
