export default {
    data() {
        return {
            user: this.$store.state.user
        }
    },
    computed: {
        distanceUnits() {
            if (!this.user) return ""
            return this.user.profile.units == "imperial" ? "mi" : "km"
        },
        needsProRecipes() {
            if (!this.user) return false
            return !this.user.isPro && Object.keys(this.user.recipes).length >= this.$store.state.freePlanDetails.maxRecipes
        }
    },
    async fetch() {
        if (this.$axios && this.$store.state.oauth) {
            this.$axios.setToken(this.$store.state.oauth.accessToken)

            const minTimestamp = new Date().valueOf() - 600000

            // Make sure current user information is never older than 10 minutes.
            if (!this.$store.state.lastUserFetch || this.$store.state.lastUserFetch < minTimestamp) {
                const user = await this.$axios.$get(`/api/users/${this.user.id}?refresh=1`)
                this.$store.commit("setLastUserFetch", new Date().valueOf())
                this.$store.commit("setUser", user)
                this.user = user
            }
        }
    }
}
