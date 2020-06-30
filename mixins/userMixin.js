export default {
    data() {
        return {
            user: this.$store.state.user
        }
    },
    computed: {
        needsPro() {
            if (!this.user) return false
            return !this.user.isPro && Object.keys(this.user.recipes).length >= this.$store.state.freePlanDetails.maxRecipes
        }
    },
    mounted() {
        if (this.$axios && this.$store.state.oauth) {
            this.$axios.setToken(this.$store.state.oauth.accessToken)
        }
    }
}
