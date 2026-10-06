<template>
    <div>
        <div class="stripe"></div>
        <div class="py-2"></div>

        <v-container class="text-center" fluid>
            <div class="home-wrapper">
                <h1 class="font-weight-light mt-1 mb-2" :class="mdAndUp ? 'text-headline-large' : 'text-headline-small'">Strautomator</h1>
                <h2 class="text-display-small font-weight-bold mb-4">Changelog</h2>

                <v-card color="black" class="mb-2 text-left">
                    <v-card-text>
                        <div class="mb-6" v-for="(dateReleases, date) in releases" :key="`r-${date}`">
                            <h2 class="mb-2">{{ date }}</h2>
                            <ul class="ml-0 pl-4">
                                <template v-for="release in dateReleases">
                                    <li v-for="(change, index) in release.changes" :key="`c-${index}`">
                                        {{ change.substring(2) }}
                                    </li>
                                </template>
                            </ul>
                        </div>
                        <div v-if="loading" class="text-center mt-2 mb-5">
                            <v-progress-circular class="mr-1 mt-n1" size="16" width="2" indeterminate></v-progress-circular>
                            Loading...
                        </div>
                        <div class="text-center mt-2 mb-2" v-if="limit > 0">
                            <v-btn color="primary" @click="loadMore" variant="outlined" rounded>Load more</v-btn>
                        </div>
                        <div class="text-center mt-2">
                            <v-btn color="primary" @click="goBack" rounded>Back {{ backTarget }}</v-btn>
                        </div>
                    </v-card-text>
                </v-card>
            </div>
        </v-container>
    </div>
</template>

<script setup lang="ts">
import _ from "lodash"

definePageMeta({layout: "landing"})
useHead({title: "Changelog"})

const store = useMainStore()
const api = useApi()
const webError = useWebError()
const {mdAndUp} = useDisplay()

const releases = ref<Record<string, any[]>>(null)
const limit = ref(20)
const loading = ref(true)
const backTarget = computed(() => (store.user ? "to the Dashboard" : "home"))

/**
 * Load GitHub releases and group them by publication date.
 */
const getReleases = async () => {
    loading.value = true
    try {
        const data: any[] = await api("/api/github/changelog", {query: {limit: limit.value}})
        releases.value = _.groupBy(data, (r) => r.datePublished.split("T")[0])
    } catch (ex) {
        webError("Changelog.fetch", ex)
    }
    loading.value = false
}

const loadMore = async () => {
    limit.value = 0
    await getReleases()
}

const goBack = () => {
    document.location.href = store.user ? "/dashboard" : "/home"
}

onMounted(getReleases)
</script>
