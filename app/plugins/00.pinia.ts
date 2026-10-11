// Strautomator Web: Pinia store setup with SSR state hydration
// Equivalent to the @pinia/nuxt runtime plugin, which is currently disabled on Nuxt 5 nightly
// builds due to a version compatibility check that fails with the new nightly version format.

import {createPinia, setActivePinia} from "pinia"
import {toRaw} from "vue"

export default defineNuxtPlugin({
    name: "pinia",
    setup(nuxtApp) {
        const pinia = createPinia()
        nuxtApp.vueApp.use(pinia)
        setActivePinia(pinia)

        if (nuxtApp.payload?.pinia) {
            pinia.state.value = nuxtApp.payload.pinia as any
        }

        return {
            provide: {pinia}
        }
    },
    hooks: {
        "app:rendered"() {
            const nuxtApp = useNuxtApp()
            nuxtApp.payload.pinia = toRaw(nuxtApp.$pinia as any).state.value
            setActivePinia(undefined)
        }
    }
})
