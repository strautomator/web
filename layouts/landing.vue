<template>
    <v-app class="landing">
        <v-main fluid>
            <nuxt />
        </v-main>

        <footer-section />
    </v-app>
</template>

<script>
import FooterSection from "~/components/FooterSection.vue"

export default {
    components: {FooterSection},
    head: {
        meta: [{hid: "description", name: "description", content: "Automate your Strava activities! Strautomator is like IFTTT, but for Strava"}]
    }
}
</script>
