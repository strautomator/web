<template>
    <v-layout column>
        <v-container v-if="gear" fluid>
            <h1>
                <v-icon class="mr-1 mt-n1">{{ getGearIcon(gear) }}</v-icon>
                {{ gear.name }}
            </h1>
            <div>
                <span v-if="hasBrandModel">{{ gear.brand }} {{ gear.model }} -</span>
                {{ gear.distance }} {{ distanceUnits }}
            </div>
            <v-card class="mt-2" outlined>
                <v-card-title class="accent">
                    <span>Components</span>
                </v-card-title>
                <v-card-text class="pl-0 pr-0">
                    <div class="mt-5 pl-4" v-if="isLoading">
                        <v-progress-circular class="mr-1 mt-n1" size="16" width="2" indeterminate></v-progress-circular>
                        Loading gear details...
                    </div>
                    <template v-else>
                        <v-simple-table v-if="gearwearConfig && gearwearConfig.components.length > 0">
                            <tbody>
                                <tr v-for="comp of gearwearConfig.components" :key="comp.name">
                                    <td width="2" class="pl-4 pr-1 pr-md-3 nowrap">
                                        <div class="mt-6">
                                            <a :title="'Edit details of ' + comp.name" @click="showComponentDialog(comp)">
                                                {{ comp.name }}
                                            </a>
                                        </div>
                                        <div class="mt-3">
                                            <v-switch class="mt-0 mb-0" :input-value="!comp.disabled" @change="setComponentState(comp)"></v-switch>
                                        </div>
                                    </td>
                                    <td class="pb-3 pt-3">
                                        <div>
                                            {{ comp.currentDistance }} {{ distanceUnits }}
                                            <span class="float-right" v-if="comp.alertDistance">{{ comp.alertDistance }}</span>
                                            <v-progress-linear class="mt-2" color="secondary" v-if="comp.alertDistance" :background-color="getProgressBg(comp, 'distance')" :value="getProgressValue(comp, 'distance')" rounded></v-progress-linear>
                                        </div>
                                        <div class="mt-2">
                                            <v-progress-linear class="mb-2" color="secondary" v-if="comp.alertTime" :background-color="getProgressBg(comp, 'time')" :value="getProgressValue(comp, 'time')" rounded></v-progress-linear>
                                            {{ getHours(comp.currentTime) }} {{ $breakpoint.mdAndUp ? "hours" : "h" }}
                                            <span class="float-right" v-if="comp.alertTime">{{ getHours(comp.alertTime) }}</span>
                                        </div>
                                        <div class="float-right mt-n5">
                                            <v-chip color="error" class="mr-2" v-if="comp.disabled" outlined x-small>disabled</v-chip>
                                            <v-icon color="primary" :title="'Edit details of ' + comp.name" @click="showComponentDialog(comp)">mdi-pencil-outline</v-icon>
                                            <v-icon color="primary" class="ml-2" :title="'Reset ' + gear.name + ' usage'" @click="showResetDialog(comp)" :disabled="!canReset(comp)" v-if="!isNew">mdi-refresh</v-icon>
                                            <v-icon color="removal" class="ml-2" title="Delete the component" @click="showDeleteComponentDialog(comp)">mdi-minus-circle</v-icon>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </v-simple-table>
                        <div class="mt-3 mb-3 pl-4 pr-4" v-else>
                            <p>
                                You haven't registered components for this gear yet. If you want you can kickstart with the defaults:
                            </p>
                            <ul class="pl-4 mb-4">
                                <li v-for="comp in defaultComponents" :key="comp.name">{{ comp.name }}: alert every {{ comp.alertDistance }} {{ distanceUnits }}</li>
                            </ul>
                            <v-btn color="primary" title="Start with the default components" @click="createDefaults" rounded>
                                <v-icon left>mdi-text-box-check</v-icon>
                                Use defaults
                            </v-btn>
                        </div>
                        <v-btn class="mt-4 ml-0" color="primary" title="Add a new component" @click.stop="showComponentDialog({})" rounded text small>
                            <v-icon class="mr-2">mdi-plus-circle</v-icon>
                            Add new component
                        </v-btn>
                    </template>
                </v-card-text>
            </v-card>

            <v-alert color="accent" class="mt-4 mb-4" v-if="hasDisabledComponents()">
                Components marked as disabled will not have their usage updated automatically.
            </v-alert>

            <past-usage-panel :gearwear-config="gearwearConfig" :is-new="isNew" v-if="gearwearConfig && gearwearConfig.components.length > 0" />

            <div class="text-center text-md-left mt-5">
                <v-btn color="primary" :disabled="!configValid || overMaxGearWear" @click="saveConfig" rounded>
                    <v-icon left>mdi-content-save</v-icon>
                    Save configuration
                </v-btn>
                <div class="pa-3" v-if="!$breakpoint.mdAndUp"></div>
                <v-btn color="removal" v-if="!isNew" :class="{'ml-3': $breakpoint.mdAndUp}" :disabled="!configValid" @click.stop="showDeleteGearWearDialog" rounded outlined>
                    <v-icon left>mdi-delete</v-icon>
                    Delete configuration
                </v-btn>
            </div>

            <v-dialog v-model="componentDialog" max-width="540" overlay-opacity="0.95">
                <edit-component ref="editComponent" :gearwear-config="gearwearConfig" :component="gearwearComponent" @closed="closedComponentDialog" />
            </v-dialog>

            <v-dialog v-model="resetDialog" max-width="440" overlay-opacity="0.95">
                <v-card>
                    <v-toolbar color="primary">
                        <v-toolbar-title>Reset: {{ gearwearComponent.name }}</v-toolbar-title>
                        <v-spacer></v-spacer>
                        <v-toolbar-items>
                            <v-btn icon @click.stop="hideResetDialog">
                                <v-icon>mdi-close</v-icon>
                            </v-btn>
                        </v-toolbar-items>
                    </v-toolbar>
                    <v-card-text>
                        <p class="mt-4">Confirm tracking reset for "{{ gearwearComponent.name }}"?</p>
                        <p>Current usage: {{ gearwearComponent.currentDistance }} {{ distanceUnits }}, {{ getHours(gearwearComponent.currentTime) }} {{ $breakpoint.mdAndUp ? "hours" : "h" }}</p>
                        <p>You should do this right after you have replaced the component with a new one.</p>
                        <div class="text-right">
                            <v-spacer></v-spacer>
                            <v-btn class="mr-1" color="grey" title="Keep current tracking" @click.stop="hideResetDialog" text rounded>
                                <v-icon left>mdi-cancel</v-icon>
                                Cancel
                            </v-btn>
                            <v-btn color="primary" title="Confirm and reset tracking" @click="resetTracking" rounded>
                                <v-icon left>mdi-refresh</v-icon>
                                Reset
                            </v-btn>
                        </div>
                    </v-card-text>
                </v-card>
            </v-dialog>

            <v-dialog v-model="deleteComponentDialog" max-width="440" overlay-opacity="0.95">
                <v-card>
                    <v-toolbar color="removal">
                        <v-toolbar-title>Delete: {{ gearwearComponent.name }}</v-toolbar-title>
                        <v-spacer></v-spacer>
                        <v-toolbar-items>
                            <v-btn icon @click.stop="hideDeleteComponentDialog">
                                <v-icon>mdi-close</v-icon>
                            </v-btn>
                        </v-toolbar-items>
                    </v-toolbar>
                    <v-card-text>
                        <h3 class="mt-4">{{ gearwearComponent.name }} with {{ gearwearComponent.currentDistance }} {{ distanceUnits }}</h3>
                        <p class="mt-2">Sure you want to delete this component?</p>
                        <div class="text-right">
                            <v-spacer></v-spacer>
                            <v-btn class="mr-1" color="grey" title="Cancel deletion" @click.stop="hideDeleteComponentDialog" text rounded>
                                <v-icon left>mdi-cancel</v-icon>
                                Cancel
                            </v-btn>
                            <v-btn color="removal" title="Confirm and delete component" @click="deleteComponent" rounded>
                                <v-icon left>mdi-check</v-icon>
                                Delete
                            </v-btn>
                        </div>
                    </v-card-text>
                </v-card>
            </v-dialog>

            <v-dialog v-model="deleteGearWearDialog" max-width="440" overlay-opacity="0.95">
                <v-card>
                    <v-toolbar color="removal">
                        <v-toolbar-title>Delete GearWear configuration</v-toolbar-title>
                        <v-spacer></v-spacer>
                        <v-toolbar-items>
                            <v-btn icon @click.stop="hideDeleteGearWearDialog">
                                <v-icon>mdi-close</v-icon>
                            </v-btn>
                        </v-toolbar-items>
                    </v-toolbar>
                    <v-card-text>
                        <h3 class="mt-4">{{ gear.name }}</h3>
                        <p class="mt-2">
                            Sure you want to delete this GearWear configuration?
                        </p>
                        <div class="text-right">
                            <v-spacer></v-spacer>
                            <v-btn class="mr-1" color="grey" title="Cancel deletion" @click.stop="hideDeleteGearWearDialog" text rounded>
                                <v-icon left>mdi-cancel</v-icon>
                                Cancel
                            </v-btn>
                            <v-btn color="removal" title="Confirm and delete GearWear" @click="deleteGearWear" rounded>
                                <v-icon left>mdi-check</v-icon>
                                Delete
                            </v-btn>
                        </div>
                    </v-card-text>
                </v-card>
            </v-dialog>
        </v-container>
    </v-layout>
</template>

<script>
import _ from "lodash"
import userMixin from "~/mixins/userMixin.js"
import gearwearMixin from "~/mixins/gearwearMixin.js"
import EditComponent from "~/components/gearwear/EditComponent.vue"
import PastUsagePanel from "~/components/gearwear/PastUsagePanel.vue"

export default {
    authenticated: true,
    components: {EditComponent, PastUsagePanel},
    mixins: [userMixin, gearwearMixin],
    head() {
        return {
            title: "Gear Configuration"
        }
    },
    data() {
        const gearId = this.$route.query.id
        const user = this.$store.state.user
        const imperial = user.profile.units == "imperial"
        const gear = _.find(user.profile.bikes, {id: gearId}) || _.find(user.profile.shoes, {id: gearId})
        let defaultComponents

        // Abort here if gear does not exist on the user.
        if (!gear) {
            this.$webError("GearEdit.data", {status: 404, message: `Invalid gear ID: ${gearId}`})
        }

        // Set defaults for bikes and shoes.
        if (this.getGearType(gear) == "Bike") {
            defaultComponents = [
                {
                    name: "Chain",
                    currentDistance: 0,
                    currentTime: 0,
                    alertDistance: imperial ? 2200 : 3500,
                    alertTime: 0
                },
                {
                    name: "Cassette",
                    currentDistance: 0,
                    currentTime: 0,
                    alertDistance: imperial ? 6600 : 10500,
                    alertTime: 0
                },
                {
                    name: "Rear tire",
                    currentDistance: 0,
                    currentTime: 0,
                    alertDistance: imperial ? 3100 : 5000,
                    alertTime: 0
                },
                {
                    name: "Front tire",
                    currentDistance: 0,
                    currentTime: 0,
                    alertDistance: imperial ? 3700 : 6000,
                    alertTime: 0
                }
            ]
        } else {
            defaultComponents = [
                {
                    name: "Shoes",
                    currentDistance: 0,
                    currentTime: 0,
                    alertDistance: imperial ? 500 : 800,
                    alertTime: 0
                }
            ]
        }

        return {
            defaultComponents: defaultComponents,
            isLoading: true,
            imperial: imperial,
            gear: gear,
            gearwearConfig: {components: []},
            gearwearComponent: {},
            isNew: false,
            hasChanges: false,
            componentDialog: false,
            resetDialog: false,
            deleteComponentDialog: false,
            deleteGearWearDialog: false
        }
    },
    computed: {
        configValid() {
            return this.gearwearConfig && this.gearwearConfig.components.length > 0
        },
        overMaxGearWear() {
            if (!this.user) return false
            return !this.user.isPro && !this.gearwearConfig && this.$store.state.gearwearCount >= this.$store.state.freePlanDetails.maxGearWearCount
        },
        hasBrandModel() {
            return this.gear.brand || this.gear.model
        }
    },
    async fetch() {
        try {
            if (!this.$route.query || !this.$route.query.id) {
                return this.$webError("GearEdit.fetch", {status: 404, message: "Missing gear ID on the URL"})
            }

            const config = await this.$axios.$get(`/api/gearwear/${this.user.id}/${this.$route.query.id}`)

            if (config) {
                this.gearwearConfig = config
                this.isNew = false
            } else {
                this.gearwearConfig = {components: []}
                this.isNew = true
            }

            // Add friendly last reset date to components.
            if (this.gearwearConfig.components.length > 0) {
                for (let comp of config.components) {
                    if (comp.history && comp.history.length > 0) {
                        comp.lastResetDate = this.$dayjs(comp.history[comp.history.length - 1].date).format("YYYY-MM-DD")
                    }
                }
            }

            if (this.$route.query.reset) {
                const component = _.find(this.gearwearConfig.components, {name: this.$route.query.reset})

                if (component) {
                    this.showResetDialog(component)
                }
            } else if (this.$route.query.comp) {
                const component = _.find(this.gearwearConfig.components, {name: this.$route.query.comp})

                if (component) {
                    this.showComponentDialog(component)
                }
            }
        } catch (ex) {
            this.$webError("GearEdit.fetch", ex)
        }

        this.isLoading = false
    },
    beforeRouteLeave(to, from, next) {
        if (this.hasChanges) {
            const answer = window.confirm("You have unsaved changes on this GearWear config. Sure you want to leave?")

            if (answer) {
                next()
            } else {
                next(false)
            }
        } else {
            next()
        }
    },
    methods: {
        async saveConfig() {
            try {
                this.hasChanges = false

                // Remove lastResetDate helper from components.
                for (let comp of this.gearwearConfig.components) {
                    delete comp.lastResetDate
                }

                await this.$axios.$post(`/api/gearwear/${this.user.id}/${this.gear.id}`, {components: this.gearwearConfig.components})

                if (this.isNew) {
                    this.$router.push({path: `/gear?new=${this.gear.id}`})
                } else {
                    this.$router.push({path: "/gear"})
                }
            } catch (ex) {
                this.$webError("GearEdit.saveConfig", ex)
            }
        },
        createDefaults() {
            this.gearwearConfig = {
                id: this.gear.id,
                components: _.cloneDeep(this.defaultComponents)
            }

            this.hasChanges = true
        },
        // HELPERS
        // --------------------------------------------------------------------------
        getProgressValue(component, alertType) {
            const current = alertType == "distance" ? component.currentDistance : component.currentTime
            const alert = alertType == "distance" ? component.alertDistance : component.alertTime
            const percent = (current / alert) * 100
            if (percent > 100) return 200 - percent
            return percent
        },
        getProgressBg(component, alertType) {
            const current = alertType == "distance" ? component.currentDistance : component.currentTime
            const alert = alertType == "distance" ? component.alertDistance : component.alertTime
            if (current / alert >= 1) return "error"
            return "accent"
        },
        canReset(component) {
            return component.currentDistance > 0 || component.currentTime > 0
        },
        hasDisabledComponents() {
            const found = this.gearwearConfig.components.find((c) => c.disabled)
            return found ? true : false
        },
        // EDIT COMPONENTS
        // --------------------------------------------------------------------------
        setComponentState(component) {
            component.disabled = component.disabled ? false : true
            this.$forceUpdate()
        },
        showComponentDialog(component) {
            this.gearwearComponent = component
            this.componentDialog = true
        },
        closedComponentDialog(component, changed) {
            if (component) {
                if (!this.gearwearConfig.id) {
                    this.gearwearConfig.id = this.gear.id
                }

                // Distance / hours were set to 0 and reset wasn't today? Ask if user wants to trigger a reset then.
                const wasNotResetToday = component.lastResetDate != this.$dayjs().format("ll")
                if (changed && wasNotResetToday && component.currentDistance < 1 && component.currentTime < 3600) {
                    this.resetDialog = true
                } else {
                    if (this.gearwearComponent.name) {
                        _.assign(this.gearwearComponent, component)
                    } else {
                        this.gearwearConfig.components.push(component)
                    }
                }

                this.hasChanges = true
            }

            this.componentDialog = false
        },
        // TRACKING RESET
        // --------------------------------------------------------------------------
        showResetDialog(component) {
            this.gearwearComponent = component
            this.resetDialog = true
        },
        hideResetDialog() {
            this.resetDialog = false
        },
        async resetTracking() {
            try {
                await this.$axios.$post(`/api/gearwear/${this.user.id}/${this.gear.id}`, {resetTracking: this.gearwearComponent.name})

                // Make sure there's a history array.
                if (!this.gearwearComponent.history) {
                    this.gearwearComponent.history = []
                }

                const currentDistance = this.gearwearComponent.currentDistance
                const currentTime = this.gearwearComponent.currentTime
                this.gearwearComponent.history.push({date: new Date(), distance: currentDistance, time: currentTime})

                this.gearwearComponent.currentDistance = 0
                this.gearwearComponent.currentTime = 0
                this.gearwearComponent.dateAlertSent = null
                this.gearwearComponent.lastResetDate = this.$dayjs().format("ll")
            } catch (ex) {
                this.$webError("GearEdit.resetTracking", ex)
            }

            this.resetDialog = false
        },
        // DELETE COMPONENT
        // --------------------------------------------------------------------------
        showDeleteComponentDialog(component) {
            this.gearwearComponent = component
            this.deleteComponentDialog = true
        },
        hideDeleteComponentDialog() {
            this.deleteComponentDialog = false
        },
        async deleteComponent() {
            try {
                _.remove(this.gearwearConfig.components, this.gearwearComponent)
                this.hasChanges = true
            } catch (ex) {
                this.$webError("GearEdit.deleteComponent", ex)
            }

            this.deleteComponentDialog = false
        },
        // DELETE GEARWEAR CONFIG
        // --------------------------------------------------------------------------
        showDeleteGearWearDialog() {
            this.deleteGearWearDialog = true
        },
        hideDeleteGearWearDialog() {
            this.deleteGearWearDialog = false
        },
        async deleteGearWear() {
            try {
                const config = await this.$axios.$delete(`/api/gearwear/${this.user.id}/${this.gear.id}`)
                this.hasChanges = false

                this.$router.push({path: `/gear?deleted=${this.gear.id}`})
            } catch (ex) {
                this.$webError("GearEdit.deleteGearWear", ex)
            }
        }
    }
}
</script>
