<template>
    <div>
        <br v-if="$route.path == '/feature'" />
        <h1 class="font-weight-light mt-1 mb-2" :class="$breakpoint.mdAndUp ? 'display-1' : 'headline'">{{ header }}</h1>
        <template v-if="$route.path != '/feature'">
            <div>with</div>
            <h2 class="display-2 font-weight-bold mb-4">Strautomator</h2>
        </template>
    </div>
</template>

<script>
export default {
    props: ["header"]
}
</script>
