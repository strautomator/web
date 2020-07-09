export default ({store, app: {$axios}}) => {
    if (store.state.oauth) {
        $axios.setToken(store.state.oauth.accessToken)
    }
}
