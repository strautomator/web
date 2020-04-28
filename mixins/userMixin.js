export default {
    data() {
        return {
            user: this.$store.state.user
        }
    },
    mounted() {
        if (this.$axios && this.$store.state.oauth) {
            this.$axios.setToken(this.$store.state.oauth.accessToken)
        }
    }
}
