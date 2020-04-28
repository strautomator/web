export default {
    data() {
        return {
            user: this.$store.state.oauth ? this.$store.state.oauth.user : null
        }
    },
    mounted() {
        if (this.$axios && this.$store.state.oauth) {
            this.$axios.setToken(this.$store.state.oauth.accessToken)
        }
    }
}
