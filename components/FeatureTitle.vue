<template>
    <div class="feature-title" :class="{'feature-title-section': isIndex}">
        <template v-if="!isIndex">
            <div class="site-brand mb-6">
                <a href="/home" title="Home">
                    <img src="/images/logo.svg" width="22" height="22" class="strautologo mt-n1" />
                    <span>Strautomator</span>
                </a>
            </div>
            <h1 class="site-headline">{{ header }}</h1>
        </template>
        <h2 v-else class="feature-section-title">{{ header }}</h2>
    </div>
</template>

<script>
export default {
    props: ["header"],
    computed: {
        isIndex() {
            return this.$route.path == "/feature"
        }
    }
}
</script>
