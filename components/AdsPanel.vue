<template>
    <v-card class="affiliates-card mt-12" v-if="!hidden" outlined>
        <v-card-text class="white">
            <div class="mb-5 white black--text text-center text-h6">Looking for some new gear?</div>
            <v-row>
                <v-col cols="4">
                    <a :href="linkAmazon" target="amazon" title="Sports gear @ Amazon"><v-img src="/images/affiliates/amazon.png" max-height="100px"/></a>
                </v-col>
                <v-col cols="4">
                    <a :href="linkWiggle" target="wiggle" title="Sports gear @ Wiggle"><v-img src="/images/affiliates/wiggle.png" max-height="100px"/></a>
                </v-col>
                <v-col cols="4">
                    <a :href="linkIcan" target="ican" title="Carbon wheels and frames @ ICAN"><v-img src="/images/affiliates/ican.png" max-height="100px"/></a>
                </v-col>
            </v-row>
            <div class="mt-4 caption black--text text-center">
                Using these affiliate stores is a win-win: you get the best deals, and Strautomator gets a small comission to keep the servers running.
            </div>
        </v-card-text>
    </v-card>
</template>

<script>
export default {
    props: ["pro-hide"],
    data() {
        let tagAmazon = "sports"

        try {
            const bikeCount = (this.$store.state.user.profile.bikes || []).length
            const shoeCount = (this.$store.state.user.profile.shoes || []).length

            if (bikeCount > shoeCount) tagAmazon = "cycling"
            else if (shoeCount > bikeCount) tagAmazon = "running"
        } catch (ex) {
            console.error(ex)
        }

        return {
            linkAmazon: `https://links.devv.com/l/amazon-${tagAmazon}`,
            linkIcan: `https://links.devv.com/l/ican`,
            linkWiggle: `https://links.devv.com/l/wiggle`
        }
    },
    computed: {
        hidden() {
            return this.$store.state.user && this.$store.state.user.isPro && this.proHide
        }
    }
}
</script>
