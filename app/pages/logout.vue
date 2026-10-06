<template>
    <v-layout column>
        <v-container fluid>
            <div class="text-center">
                <h3 class="mt-5">Goodbye!</h3>
            </div>
        </v-container>
    </v-layout>
</template>

<script>
import userMixin from "~/mixins/userMixin.js"

export default {
    authenticated: true,
    mixins: [userMixin],
    head() {
        return {
            title: "Logout"
        }
    },
    mounted() {
        try {
            this.$logout()
        } catch (ex) {
            document.location.href = "/home"
        }
    }
}
</script>
