<template>
    <v-card class="mb-5" outlined>
        <v-hover v-slot:default="{hover}">
            <n-link :to="canEdit ? '/gear/edit?id=' + gear.id : '/gear'" :title="`Edit GearWear for ${gear.name}`" nuxt>
                <v-card-title class="accent">
                    <v-icon class="ml-n1 mr-2" color="primary">{{ gearIcon }}</v-icon>
                    <span>{{ gear.name }}</span>
                    <v-spacer></v-spacer>
                    <v-icon v-show="hover && canEdit" small>mdi-pencil-outline</v-icon>
                </v-card-title>
            </n-link>
        </v-hover>
        <v-card-text class="pb-0 white--text">
            <div class="mt-1 mb-3">
                <v-container class="ma-0 pa-0" v-if="gearwearConfig" fluid>
                    <v-row no-gutters>
                        <v-col cols="12" :sm="12" :md="5">
                            <div class="font-weight-bold" v-if="gear.brand || gear.model">
                                {{ gear.brand }} {{ gear.model }}
                                <span class="text-lowercase" v-if="gear.primary">(Primary {{ getGearType(gear) }})</span>
                            </div>
                            <div>Total distance: {{ gear.distance }} {{ units }}</div>
                            <div v-if="lastResetDatails">Last replacement: {{ lastResetDatails }}</div>
                        </v-col>
                        <v-col class="pt-2 pt-md-0" cols="12" :sm="12" :md="7">
                            <v-chip class="mr-3 ml-n1 mb-2" v-for="comp in gearwearConfig.components" :class="getChipClass(comp)" :color="getChipColor(comp)" :to="getChipLink(comp)" :key="gear.id + comp.name + 'sm'" nuxt>
                                <v-icon class="mr-1" v-if="comp.currentDistance >= comp.alertDistance" small>mdi-sync-alert</v-icon>
                                {{ getChipText(comp) }}
                            </v-chip>
                        </v-col>
                    </v-row>
                </v-container>

                <div v-else>
                    <div>
                        No GearWear configuration for this gear yet.
                        <br v-if="!$breakpoint.mdAndUp" />
                        <n-link v-if="!needsPro" :to="'/gear/edit?id=' + gear.id" :title="`Create GearWear for ${gear.name}`" nuxt>Create one now?</n-link>
                    </div>
                    <div>Total distance ≈ {{ gear.distance }} {{ units }}</div>
                    <div v-if="gear.lastUpdate">
                        Last update:
                        {{ $moment(gear.lastUpdate.date).format("MMM Do") }}
                        -
                        {{ gear.lastUpdate.distance }} {{ units }}, {{ getHours(gear.lastUpdate.time) }}h
                    </div>
                </div>
            </div>
        </v-card-text>
    </v-card>
</template>

<script>
import userMixin from "~/mixins/userMixin.js"
import gearwearMixin from "~/mixins/gearwearMixin.js"

export default {
    mixins: [userMixin, gearwearMixin],
    props: ["gear", "gearwear-config", "needs-pro"],
    computed: {
        units() {
            return this.user && this.user.profile.units == "imperial" ? "mi" : "km"
        },
        canEdit() {
            return !this.needsPro || this.gearwearConfig
        },
        gearIcon() {
            if (this.gear.id.substring(0, 1) == "b") return "mdi-bike"
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
            if (comp.currentDistance >= comp.alertDistance * 1.2) return "font-weight-bold"
            return ""
        },
        getChipColor(comp) {
            if (comp.currentDistance >= comp.alertDistance) return "error"
            return ""
        },
        getChipText(comp) {
            if (this.$breakpoint.mdAndUp) return `${comp.name} - ${comp.currentDistance} ${this.units}`
            return comp.name
        },
        getChipLink(comp) {
            const query = comp.currentDistance >= comp.alertDistance ? "reset" : "comp"
            return `/gear/edit?id=${this.gear.id}&${query}=${comp.name}`
        }
    }
}
</script>
