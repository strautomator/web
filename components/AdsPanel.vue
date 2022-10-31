<template>
    <v-card class="affiliates-card mt-12" v-if="!hidden" outlined>
        <v-card-text class="grey lighten-1">
            <div class="mb-5 grey lighten-1 black--text text-center text-h6">Affiliates</div>
            <v-row>
                <v-col cols="4">
                    <a :href="linkIcan" target="ican" title="Carbon wheels and frames @ ICAN"><v-img src="/images/affiliates/ican.png" max-height="58px" /></a>
                </v-col>
                <v-col cols="4">
                    <a :href="linkProBikeKit" target="probikekit" title="Cycling and sports gear @ ProBikeKit"><v-img src="/images/affiliates/probikekit.png" max-height="58px" /></a>
                </v-col>
                <v-col cols="4">
                    <a :href="linkNextDns" target="probikekit" title="The new firewall for the modern Internet"><v-img src="/images/affiliates/nextdns.png" max-height="58px" /></a>
                </v-col>
            </v-row>
            <div class="mt-4 caption black--text text-center">Using our affiliate links is a win-win: you get the best deals, and Strautomator gets a small comission to keep the servers running.</div>
        </v-card-text>
    </v-card>
</template>

<script>
export default {
    data() {
        let sportsTag = "sports"

        try {
            const user = this.$store.state.user || {profile: {}}
            const bikeCount = (user.profile.bikes || []).length
            const shoeCount = (user.profile.shoes || []).length

            if (bikeCount > shoeCount) sportsTag = "cycling"
            else if (shoeCount > bikeCount) sportsTag = "running"
        } catch (ex) {
            console.error(ex)
        }

        return {
            linkBitpanda: "https://links.devv.com/l/bitpanda",
            linkIcan: "https://links.devv.com/l/ican",
            linkNextDns: "https://links.devv.com/l/nextdns",
            linkProBikeKit: "https://links.devv.com/l/probikekit",
            linkRevolut: "https://links.devv.com/l/revolut"
        }
    },
    computed: {
        hidden() {
            return this.$store.state.user && this.$store.state.user.isPro
        }
    }
}
</script>
