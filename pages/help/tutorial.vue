<template>
    <v-layout column>
        <h1>Tutorial</h1>
        <p>Coming soon...</p>
    </v-layout>
</template>

<script>
export default {
    authenticated: false,
    layout({store}) {
        if (!store.state.oauth || !store.state.user) {
            return "landing"
        } else {
            return "default"
        }
    },
    head() {
        return {
            title: "Tutorial"
        }
    }
}
</script>
