<template>
    <v-layout column>
        <v-container v-if="invalidGear" fluid>
            <v-card outlined>
                <v-card-title class="accent">
                    <span>Invalid or deprecated gear</span>
                </v-card-title>
                <v-card-text class="pt-2">The gear ID "{{ gearId }}" could not be found on your profile. It was probably deleted from your Strava account, and if that's the case, it will also be deleted from Strautomator soon.</v-card-text>
            </v-card>
            <div class="mt-4 text-center text-md-left">
                <v-btn color="primary" to="/gear" nuxt rounded>
                    <v-icon left>mdi-arrow-left</v-icon>
                    Back to My Gear
                </v-btn>
            </div>
        </v-container>
        <v-container v-else-if="gear" fluid>
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
                    <div class="mt-5 mb-3" v-else>
                        <template v-if="gearwearConfig?.components.length > 0">
                            <template v-for="comp of gearwearConfig.components">
                                <v-row class="pl-5 pr-5" no-gutters>
                                    <v-col cols="6">
                                        <v-icon color="removal" class="mr-1" :title="'Delete ' + comp.name" @click.stop="showDeleteComponentDialog(comp)">mdi-minus-circle-outline</v-icon>
                                        <a :title="'Edit details of ' + comp.name" @click="showComponentDialog(comp)">
                                            <h3 class="d-inline">{{ comp.name }}</h3>
                                        </a>
                                    </v-col>
                                    <v-col cols="6" class="text-right">
                                        <v-icon :color="comp.disabled ? 'accent' : ''" class="float-right">{{ getComponentIcon(comp) }}</v-icon>
                                        <v-switch class="pa-0 ma-0 mr-1 float-right" :input-value="!comp.disabled" @change="setComponentState(comp)"></v-switch>
                                        <v-btn color="primary" class="mr-2" :title="'Reset ' + comp.name + ' usage'" @click.stop="showResetDialog(comp)" :disabled="!canReset(comp)" v-if="!isNew" rounded x-small>
                                            <v-icon left>mdi-refresh</v-icon>
                                            Reset
                                        </v-btn>
                                    </v-col>
                                </v-row>
                                <v-row class="pl-5 pr-5" no-gutters>
                                    <v-col cols="12">
                                        <div class="mt-n2">
                                            {{ comp.currentDistance }} {{ distanceUnits }}
                                            {{ comp.disabled ? " (tracking disabled)" : "" }}
                                            <span class="float-right" v-if="comp.alertDistance">{{ comp.alertDistance }} {{ distanceUnits }}</span>
                                            <v-progress-linear class="mt-2" color="secondary" v-if="comp.alertDistance" :background-color="getProgressBg(comp, 'distance')" :value="getProgressValue(comp, 'distance')" rounded></v-progress-linear>
                                        </div>
                                        <div class="mt-1">
                                            <v-progress-linear class="mb-2" color="secondary" v-if="comp.alertTime" :background-color="getProgressBg(comp, 'time')" :value="getProgressValue(comp, 'time')" rounded></v-progress-linear>
                                            {{ getHours(comp.currentTime) }} {{ $breakpoint.mdAndUp ? "hours" : "h" }}
                                            <span class="float-right" v-if="comp.alertTime">{{ getHours(comp.alertTime) }} {{ $breakpoint.mdAndUp ? "hours" : "h" }}</span>
                                        </div>
                                    </v-col>
                                </v-row>
                                <v-divider class="mt-4 mb-6"></v-divider>
                            </template>
                        </template>
                        <div class="pl-5 pr-5" v-else>
                            <p>You haven't registered components for this gear yet. Want to kickstart with the defaults?</p>
                            <ul class="pl-4 mb-4">
                                <li v-for="comp in defaultComponents" :key="comp.name">{{ comp.name }}: alert every {{ comp.alertDistance }} {{ distanceUnits }}</li>
                            </ul>
                            <v-btn color="primary" title="Start with the default components" @click="createDefaults" rounded>
                                <v-icon left>mdi-text-box-check</v-icon>
                                Use defaults
                            </v-btn>
                        </div>
                    </div>
                    <v-btn class="mt-0 ml-1" color="primary" title="Add a new component" @click.stop="showComponentDialog({})" rounded text small>
                        <v-icon class="mr-2">mdi-plus-circle</v-icon>
                        Add new component
                    </v-btn>
                </v-card-text>
            </v-card>

            <v-card class="mt-4" v-if="gearwearHistory?.length > 0" outlined>
                <v-card-title class="accent">
                    <span>History</span>
                </v-card-title>
                <v-card-text class="pt-4 pb-2">
                    <div class="mb-4" v-for="data in gearwearHistory">
                        <h3>{{ data.date }}</h3>
                        <ul class="ml-n2">
                            <li v-for="h in data.history">{{ h.message }}</li>
                        </ul>
                    </div>
                </v-card-text>
            </v-card>

            <v-alert color="accent" class="mt-4 mb-4" v-if="hasDisabledComponents() || hasHistory">
                <div v-if="hasDisabledComponents()">Components marked as disabled will not have their usage updated with new activities.</div>
                <div v-if="hasHistory">Please note that only the last alert date for each component is kept in the history log.</div>
            </v-alert>

            <past-usage-panel :gearwear-config="gearwearConfig" :is-new="isNew" v-if="gearwearConfig && gearwearConfig.components.length > 0" />

            <div class="text-center text-md-left mt-5">
                <v-btn color="primary" title="Save this configuration" :disabled="!isConfigValid() || overMaxGearWear" @click="saveConfig" rounded>
                    <v-icon left>mdi-content-save</v-icon>
                    Save configuration
                </v-btn>
                <v-btn color="removal" title="Delete this configuration" class="mt-4 mt-md-0 ml-md-2" v-if="!isNew" :disabled="!isConfigValid()" @click.stop="showDeleteGearWearDialog" rounded outlined>
                    <v-icon left>mdi-delete</v-icon>
                    Delete configuration
                </v-btn>
            </div>

            <v-dialog v-model="componentDialog" width="540" overlay-opacity="0.95">
                <edit-component ref="editComponent" :gearwear-config="gearwearConfig" :component="gearwearComponent" @closed="closedComponentDialog" />
            </v-dialog>

            <v-dialog v-model="resetDialog" width="440" overlay-opacity="0.95">
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
                            <v-btn class="mr-2" color="grey" title="Keep current tracking" @click.stop="hideResetDialog" text rounded>
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

            <v-dialog v-model="deleteComponentDialog" width="440" overlay-opacity="0.95">
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
                            <v-btn class="mr-2" color="grey" title="Cancel deletion" @click.stop="hideDeleteComponentDialog" text rounded>
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

            <v-dialog v-model="deleteGearWearDialog" width="440" overlay-opacity="0.95">
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
                        <p class="mt-2">Sure you want to delete this GearWear configuration?</p>
                        <div class="text-right">
                            <v-spacer></v-spacer>
                            <v-btn class="mr-2" color="grey" title="Cancel deletion" @click.stop="hideDeleteGearWearDialog" text rounded>
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
        const invalidGear = !gear
        let defaultComponents

        // Only proceed if the gear was found.
        if (gear) {
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
                        alertDistance: imperial ? 3700 : 6000,
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
        }

        return {
            defaultComponents: defaultComponents,
            isLoading: true,
            invalidGear: invalidGear,
            imperial: imperial,
            gear: gear,
            gearId: gearId,
            gearwearConfig: {components: []},
            gearwearComponent: {},
            gearwearHistory: null,
            isNew: false,
            hasChanges: false,
            componentDialog: false,
            resetDialog: false,
            deleteComponentDialog: false,
            deleteGearWearDialog: false
        }
    },
    computed: {
        overMaxGearWear() {
            if (!this.user) return false
            return !this.user.isPro && !this.gearwearConfig && this.$store.state.gearwearCount >= this.$store.state.freePlanDetails.maxGearWearCount
        },
        hasBrandModel() {
            return this.gear.brand || this.gear.model
        },
        hasHistory() {
            return this.gearwearConfig?.components.find((c) => c.history?.length > 0)
        }
    },
    async fetch() {
        try {
            if (!this.$route.query || !this.$route.query.id) {
                return this.$webError(this, "GearEdit.fetch", {status: 404, message: "Missing gear ID on the URL"})
            }

            const gearDetails = await this.$axios.$get(`/api/gearwear/${this.user.id}/${this.$route.query.id}`)
            const config = gearDetails.config

            if (!gearDetails.gear) {
                this.invalidGear = true
                return
            }

            this.gear = gearDetails.gear

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

            // Build the history data (only for existing components).
            if (!this.isNew) {
                const dateHistory = {}

                for (let c of this.gearwearConfig.components) {
                    if (c.history?.length > 0) {
                        for (let h of c.history) {
                            const hDate = this.$dayjs(h.date).format("LL")
                            if (!dateHistory[hDate]) {
                                dateHistory[hDate] = []
                            }
                            dateHistory[hDate].push({message: `${c.name} changed after ${h.distance} ${this.distanceUnits}`, reset: true})
                        }
                    }

                    if (c.dateAlertSent) {
                        const hDate = this.$dayjs(c.dateAlertSent).format("LL")
                        if (!dateHistory[hDate]) {
                            dateHistory[hDate] = []
                        }
                        dateHistory[hDate].push({message: `Alert sent for ${c.name}`, alert: true})
                    }
                }

                const entries = Object.entries(dateHistory)
                const gearwearHistory = entries.map(([date, history]) => {
                    return {date: date, history: history}
                })
                this.gearwearHistory = _.orderBy(gearwearHistory, "date", "desc")
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
            this.$webError(this, "GearEdit.fetch", ex)
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

                if (this.gearwearConfig.components.length == 0) {
                    this.$router.push({path: "/gear"})
                    return
                }

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
                this.$webError(this, "GearEdit.saveConfig", ex)
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
        isConfigValid() {
            return this.gearwearConfig?.components.length > 0
        },
        // EDIT COMPONENTS
        // --------------------------------------------------------------------------
        setComponentState(component) {
            component.disabled = component.disabled ? false : true
            this.$forceUpdate()
        },
        showComponentDialog(component) {
            this.gearwearComponent = component
            this.deleteComponentDialog = false
            this.componentDialog = true
        },
        closedComponentDialog(component, changed) {
            if (component) {
                if (!this.gearwearConfig.id) {
                    this.gearwearConfig.id = this.gear.id
                }
                if (this.gearwearComponent.name) {
                    _.assign(this.gearwearComponent, component)
                } else {
                    this.gearwearConfig.components.push(component)
                }

                this.hasChanges = true

                // Distance / hours were set to 0 and reset wasn't today? Ask if user wants to trigger a reset then.
                const wasNotResetToday = component.lastResetDate != this.$dayjs().format("YYYY-MM-DD")
                if (changed && wasNotResetToday && component.currentDistance < 1 && component.currentTime < 3600) {
                    this.componentDialog = false
                    this.resetDialog = true
                    return
                }
            }

            this.gearwearComponent = {}
            this.componentDialog = false
        },
        // TRACKING RESET
        // --------------------------------------------------------------------------
        showResetDialog(component) {
            this.gearwearComponent = component
            this.componentDialog = false
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
                this.gearwearComponent.lastResetDate = this.$dayjs().format("YYYY-MM-DD")
                this.gearwearComponent = {}
            } catch (ex) {
                this.$webError(this, "GearEdit.resetTracking", ex)
            }

            this.resetDialog = false
        },
        // DELETE COMPONENT
        // --------------------------------------------------------------------------
        showDeleteComponentDialog(component) {
            this.gearwearComponent = component
            this.componentDialog = false
            this.deleteComponentDialog = true
        },
        hideDeleteComponentDialog() {
            this.deleteComponentDialog = false
        },
        async deleteComponent() {
            try {
                _.remove(this.gearwearConfig.components, this.gearwearComponent)
                this.gearwearConfig.components = this.gearwearConfig.components
                this.hasChanges = true
            } catch (ex) {
                this.$webError(this, "GearEdit.deleteComponent", ex)
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
                this.$webError(this, "GearEdit.deleteGearWear", ex)
            }
        }
    }
}
</script>
