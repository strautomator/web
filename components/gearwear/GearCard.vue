<template>
    <v-card class="mb-5" outlined>
        <v-hover v-slot:default="{hover}">
            <n-link :to="canEdit ? '/gear/edit?id=' + gear.id : '/gear'" :title="`Edit GearWear for ${gear.name}`" nuxt>
                <v-card-title class="accent">
                    <v-icon class="ml-n1 mr-2" color="primary">{{ gearIcon }}</v-icon>
                    <span>{{ gear.name }}</span>
                    <v-spacer />
                    <v-icon v-show="hover && canEdit" small>mdi-pencil-outline</v-icon>
                </v-card-title>
            </n-link>
        </v-hover>
        <v-card-text class="pb-0 white--text">
            <div class="mt-1 mb-3">
                <template v-if="gearwearConfig">
                    <v-chip class="mr-3 ml-n1" :class="getChipClass(comp)" :color="getChipColor(comp)" v-for="comp in gearwearConfig.components" :key="gear.id + comp.name + 'sm'">
                        <v-icon class="mr-1" v-if="comp.currentMileage >= comp.alertMileage" small>mdi-sync-alert</v-icon>
                        {{ getChipText(comp) }}
                    </v-chip>
                    <div class="mt-3">Total mileage: {{ gear.mileage }} {{ units }}</div>
                    <div v-if="lastResetDatails">Last replacement: {{ lastResetDatails }}</div>
                </template>
                <div v-else>
                    <div>
                        No GearWear configuration for this gear.
                        <br v-if="!$breakpoint.mdAndUp" />
                        <n-link v-if="!needsPro" :to="'/gear/edit?id=' + gear.id" :title="`Create GearWear for ${gear.name}`" nuxt>Create one now?</n-link>
                    </div>
                    <div>Total mileage: ≈{{ gear.mileage }} {{ units }}</div>
                </div>
            </div>
        </v-card-text>
    </v-card>
</template>

<script>
import _ from "lodash"
import userMixin from "~/mixins/userMixin.js"

export default {
    mixins: [userMixin],
    props: ["gear", "gear-type", "gearwear-config", "needs-pro"],
    data() {
        return {
            units: this.user && this.user.profile.units == "imperial" ? "mi" : "km"
        }
    },
    computed: {
        canEdit() {
            return !this.needsPro || this.gearwearConfig
        },
        gearIcon() {
            if (this.gearType == "bike") return "mdi-bike"
            else return "mdi-shoe-print"
        },
        lastResetDatails() {
            if (!this.gearwearConfig) return false

            let lastHistory, lastComp

            for (let comp of this.gearwearConfig.components) {
                if (comp.history) {
                    for (let history of comp.history) {
                        if (!lastHistory || lastHistory.date < history.date) {
                            lastHistory = history
                            lastComp = comp
                        }
                    }
                }
            }

            if (lastHistory) {
                const date = this.$moment(lastHistory.date).format("ll")
                return `${lastComp.name} on ${date}`
            }

            return false
        }
    },
    methods: {
        getChipClass(comp) {
            if (comp.currentMileage >= comp.alertMileage * 1.2) return "font-weight-bold"
            return ""
        },
        getChipColor(comp) {
            if (comp.currentMileage >= comp.alertMileage) return "error"
            return ""
        },
        getChipText(comp) {
            if (this.$breakpoint.mdAndUp) return `${comp.name} - ${comp.currentMileage} ${this.units}`
            return comp.name
        }
    }
}
</script>
