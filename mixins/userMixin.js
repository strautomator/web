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
        recipesMaxAllowed() {
            if (!this.user) return this.$store.state.freePlanDetails.maxRecipes
            return this.user.isPro ? this.$store.state.proPlanDetails.maxRecipes : this.$store.state.freePlanDetails.maxRecipes
        },
        recipesRemaining() {
            if (!this.user) return this.$store.state.freePlanDetails.maxRecipes

            let maxRecipes = this.user.isPro ? this.$store.state.proPlanDetails.maxRecipes : this.$store.state.freePlanDetails.maxRecipes
            let recipeCount = Object.keys(this.user.recipes).length
            let remaining = maxRecipes - recipeCount

            // At the moment only 2 plans, and PRO should have unlimited.
            if (this.user.isPro && remaining < 1) return (remaining = 1)
            else return remaining
        },
        gearwearMaxAllowed() {
            if (!this.user) return this.$store.state.freePlanDetails.maxGearWear
            return this.user.isPro ? this.$store.state.proPlanDetails.maxGearWear : this.$store.state.freePlanDetails.maxGearWear
        },
        gearwearRemaining() {
            if (!this.user || !this.gearwearConfigs) return this.$store.state.freePlanDetails.maxGearWear

            let maxRecipes = this.user.isPro ? this.$store.state.proPlanDetails.maxGearWear : this.$store.state.freePlanDetails.maxGearWear
            let recipeCount = Object.keys(this.gearwearConfigs).length
            let remaining = maxRecipes - recipeCount

            // At the moment only 2 plans, and PRO should have unlimited.
            if (this.user.isPro && remaining < 1) return (remaining = 1)
            else return remaining
        },
        isPrivacyMode() {
            return this.user && this.user.preferences.privacyMode
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
