export default ({store, app: {$axios}}) => {
    if (store.state.oauth && store.state.oauth.accessToken) {
        $axios.setToken(store.state.oauth.accessToken)
    }
}
