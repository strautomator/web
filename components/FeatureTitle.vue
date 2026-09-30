<template>
    <div>
        <site-header v-if="!isIndex" :header="header" />
        <h2 v-else class="feature-section-title">{{ header }}</h2>
    </div>
</template>

<script>
import SiteHeader from "~/components/SiteHeader.vue"

export default {
    components: {SiteHeader},
    props: ["header"],
    computed: {
        isIndex() {
            return this.$route.path == "/feature"
        }
    }
}
</script>
