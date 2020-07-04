<template>
    <v-layout column>
        <v-container v-if="gear" fluid>
            <h1>{{ gearType }}: {{ gear.name }}</h1>
            <p class="mt-3">Total mileage on Strava: {{ gear.mileage }} {{ units }}</p>
            <v-card outlined>
                <v-card-title class="accent">
                    <span>Components</span>
                </v-card-title>
                <v-card-text class="pl-0 pr-0">
                    <div class="mt-5 pl-4" v-if="isLoading">
                        <v-progress-circular class="mr-1 mt-n1" size="16" width="2" indeterminate></v-progress-circular>
                        Loading gear details...
                    </div>
                    <template v-else>
                        <v-simple-table v-if="gearwearConfig">
                            <thead>
                                <tr>
                                    <th colspan="2">Component</th>
                                    <th>Mileage</th>
                                    <th class="text-center">Reset</th>
                                    <th v-if="$breakpoint.mdAndUp">Last reset</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="comp of gearwearConfig.components">
                                    <td width="1" class="pr-0">
                                        <v-icon color="primary" :title="'Edit details of ' + comp.name" @click="showComponentDialog(comp)">mdi-circle-edit-outline</v-icon>
                                    </td>
                                    <td width="1" class="pl-2">
                                        <a :title="'Edit details of ' + comp.name" @click="showComponentDialog(comp)">
                                            {{ comp.name }}
                                        </a>
                                    </td>
                                    <td>
                                        {{ comp.currentMileage }} {{ units }}
                                        <span class="float-right">{{ comp.alertMileage }}</span>
                                        <v-progress-linear class="mt-2" color="secondary" :background-color="getProgressBg(comp)" :value="getProgressValue(comp)" rounded></v-progress-linear>
                                    </td>
                                    <td width="1" class="text-center">
                                        <v-icon color="primary" :title="'Reset ' + gear.name + ' mileage'" @click="showResetDialog(comp)" :disabled="comp.currentMileage < 1">mdi-refresh</v-icon>
                                    </td>
                                    <td width="17%" v-if="$breakpoint.mdAndUp">
                                        {{ comp.lastResetDate ? comp.lastResetDate : "never" }}
                                    </td>
                                    <td width="1" class="text-right pr-0 pl-1">
                                        <v-icon color="removal" class="mr-3" title="Delete the component" @click="showDeleteComponentDialog(comp)">mdi-minus-circle</v-icon>
                                    </td>
                                </tr>
                            </tbody>
                        </v-simple-table>
                        <div class="mt-3 mb-3 pl-4 pr-4" v-else>
                            <p>
                                You haven't registered components for this gear yet. If you want you can kickstart with the defaults:
                            </p>
                            <ul class="pl-4 mb-4">
                                <li v-for="comp in defaultComponents">{{ comp.name }}: alert every {{ comp.alertMileage }} {{ units }}</li>
                            </ul>
                            <v-btn color="primary" title="Start with the default components" @click="createDefaults" rounded>
                                <v-icon left>mdi-text-box-check</v-icon>
                                Use defaults
                            </v-btn>
                        </div>
                        <v-btn class="mt-3 ml-1" color="primary" title="Add a new component" @click.stop="showComponentDialog(false)" rounded text small>
                            <v-icon class="mr-2">mdi-plus-circle</v-icon>
                            Add new component
                        </v-btn>
                    </template>
                </v-card-text>
            </v-card>
            <div class="text-center text-md-left mt-5">
                <v-btn color="primary" :disabled="!configValid || overMaxGearWear" @click="saveConfig" rounded>
                    <v-icon left>mdi-content-save</v-icon>
                    Save configuration
                </v-btn>
                <div class="pa-3" v-if="!$breakpoint.mdAndUp"></div>
                <v-btn color="removal" v-if="gearwearConfig && !isNew" :class="{'ml-3': $breakpoint.mdAndUp}" :disabled="!configValid" @click.stop="showDeleteGearWearDialog" rounded outlined>
                    <v-icon left>mdi-delete</v-icon>
                    Delete configuration
                </v-btn>
            </div>

            <v-dialog v-model="componentDialog" max-width="540" overlay-opacity="0.94">
                <v-card>
                    <v-toolbar color="primary">
                        <v-toolbar-title>{{ gearwearComponent ? "Edit" : "New" }} component</v-toolbar-title>
                        <v-spacer></v-spacer>
                        <v-toolbar-items>
                            <v-btn icon @click.stop="hideComponentDialog">
                                <v-icon>mdi-close</v-icon>
                            </v-btn>
                        </v-toolbar-items>
                    </v-toolbar>
                    <v-card-text>
                        <v-form v-model="compValid" ref="componentForm">
                            <v-container class="ma-0 pa-0 pt-5" fluid>
                                <v-row no-gutters>
                                    <v-col cols="12">
                                        <v-text-field v-model="compName" label="Component name" placeholder="Ex: chain, cassette, tires..." maxlength="20" :rules="inputRules" validate-on-blur outlined rounded></v-text-field>
                                    </v-col>
                                </v-row>
                                <v-row no-gutters>
                                    <v-col cols="6">
                                        <v-text-field v-model="compCurrentMileage" type="number" class="mr-1" label="Current mileage" min="0" :suffix="units" outlined rounded></v-text-field>
                                    </v-col>
                                    <v-col cols="6">
                                        <v-text-field v-model="compAlertMileage" type="number" class="ml-1" label="Alert mileage" min="50" :suffix="units" outlined rounded></v-text-field>
                                    </v-col>
                                </v-row>
                                <v-row no-gutters>
                                    <v-col cols="12">
                                        <div class="mt-2 text-center">
                                            <v-btn color="primary" @click="saveComponent" title="Save component details" rounded>Save component</v-btn>
                                        </div>
                                    </v-col>
                                </v-row>
                            </v-container>
                        </v-form>
                    </v-card-text>
                </v-card>
            </v-dialog>

            <v-dialog v-model="resetDialog" max-width="440" overlay-opacity="0.94">
                <v-card>
                    <v-toolbar color="primary">
                        <v-toolbar-title>Reset mileage: {{ compName }}</v-toolbar-title>
                        <v-spacer></v-spacer>
                        <v-toolbar-items>
                            <v-btn icon @click.stop="hideResetDialog">
                                <v-icon>mdi-close</v-icon>
                            </v-btn>
                        </v-toolbar-items>
                    </v-toolbar>
                    <v-card-text>
                        <p class="mt-4">Confirm the mileage reset for "{{ compName }}" back to 0 {{ units }}?</p>
                        <p>You should do this once you have replaced the component.</p>
                        <div class="text-right">
                            <v-spacer></v-spacer>
                            <v-btn class="mr-1" color="grey" title="Keep current mileage" @click.stop="hideResetDialog" text rounded>Cancel</v-btn>
                            <v-btn color="primary" title="Confirm and reset mileage" @click="resetMileage" rounded>Reset</v-btn>
                        </div>
                    </v-card-text>
                </v-card>
            </v-dialog>

            <v-dialog v-model="deleteComponentDialog" max-width="440" overlay-opacity="0.94">
                <v-card>
                    <v-toolbar color="removal">
                        <v-toolbar-title>Delete component: {{ compName }}</v-toolbar-title>
                        <v-spacer></v-spacer>
                        <v-toolbar-items>
                            <v-btn icon @click.stop="hideDeleteComponentDialog">
                                <v-icon>mdi-close</v-icon>
                            </v-btn>
                        </v-toolbar-items>
                    </v-toolbar>
                    <v-card-text>
                        <p class="mt-4">Are you sure you want to delete the component {{ compName }}?</p>
                        <div class="text-right">
                            <v-spacer></v-spacer>
                            <v-btn class="mr-1" color="grey" title="Cancel deletion" @click.stop="hideDeleteComponentDialog" text rounded>Cancel</v-btn>
                            <v-btn color="removal" title="Confirm and delete component" @click="deleteComponent" rounded>Delete</v-btn>
                        </div>
                    </v-card-text>
                </v-card>
            </v-dialog>

            <v-dialog v-model="deleteGearWearDialog" max-width="440" overlay-opacity="0.94">
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
                            Are you sure you want to delete this GearWear configuration?
                        </p>
                        <div class="text-right">
                            <v-spacer></v-spacer>
                            <v-btn class="mr-1" color="grey" title="Cancel deletion" @click.stop="hideDeleteGearWearDialog" text rounded>Cancel</v-btn>
                            <v-btn color="removal" title="Confirm and delete GearWear" @click="deleteGearWear" rounded>Delete</v-btn>
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

export default {
    authenticated: true,
    mixins: [userMixin],
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
        let gearType
        let defaultComponents

        // Abort here if gear does not exist on the user.
        if (!gear) {
            this.$webError("GearEdit.data", {status: 404, message: `Invalid gear ID: ${gearId}`})
        } else {
            gearType = gear.id.substring(0, 1) == "b" ? "Bike" : "Shoes"
        }

        // Set defaults for bikes and shoes.
        if (gearType == "Bike") {
            defaultComponents = [
                {
                    name: "Chain",
                    currentMileage: 0,
                    alertMileage: imperial ? 2200 : 3500
                },
                {
                    name: "Cassette",
                    currentMileage: 0,
                    alertMileage: imperial ? 6600 : 10500
                },
                {
                    name: "Tires",
                    currentMileage: 0,
                    alertMileage: imperial ? 3000 : 5000
                }
            ]
        } else {
            defaultComponents = [
                {
                    name: "Shoes",
                    currentMileage: 0,
                    alertMileage: imperial ? 500 : 800
                }
            ]
        }

        // Set the default components for bikes and shoes.
        return {
            defaultComponents: defaultComponents,
            isLoading: true,
            imperial: imperial,
            units: imperial ? "mi" : "km",
            gear: gear,
            gearType: gearType,
            gearwearConfig: null,
            gearwearComponent: null,
            compValid: false,
            compName: "",
            compCurrentMileage: 0,
            compAlertMileage: 0,
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
        inputRules() {
            const rules = {
                required: (value) => !!value || "Field is required",
                name: (value) => {
                    if (!this.gearwearConfig) return true
                    if (value && !_.find(this.gearwearConfig.components, {name: value.trim()})) return true
                    if (this.gearwearComponent && this.gearwearComponent.name == value) return true
                    return `${value} is a duplicate of another component`
                }
            }

            return [rules.required, rules.name]
        },
        overMaxGearWear() {
            if (!this.user) return false
            return !this.user.isPro && !this.gearwearConfig && this.$store.state.gearwearCount >= this.$store.state.freePlanDetails.maxGearWearCount
        }
    },
    async fetch() {
        try {
            if (!this.$route.query || !this.$route.query.id) {
                return this.$webError("GearEdit.fetch", {status: 404, message: "Missing gear ID on the URL"})
            }

            const config = await this.$axios.$get(`/api/gearwear/${this.user.id}/${this.$route.query.id}`)
            this.gearwearConfig = config
            this.isNew = !config

            // Add friendly last reset date to components.
            if (config && config.components) {
                for (let comp of config.components) {
                    if (comp.history && comp.history.length > 0) {
                        comp.lastResetDate = this.$moment(comp.history[comp.history.length - 1].date).format("ll")
                    }
                }
            }
        } catch (ex) {
            this.$webError("GearEdit.fetch", ex)
        }

        this.isLoading = false
    },
    mounted() {
        if (this.$route.query.reset) {
            const component = _.find(this.gearwearConfig.components, {name: this.$route.query.reset})

            if (component) {
                this.showResetDialog(component)
            }
        }
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

                this.$router.push({path: `/gear?new=${this.gear.id}`})
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
        // PROGRESS BARS
        // --------------------------------------------------------------------------
        getProgressValue(component) {
            const percent = (component.currentMileage / component.alertMileage) * 100
            if (percent > 100) return 200 - percent
            return percent
        },
        getProgressBg(component) {
            if (component.currentMileage / component.alertMileage >= 1) return "error"
            return "accent"
        },
        // EDIT COMPONENTS
        // --------------------------------------------------------------------------
        showComponentDialog(component) {
            if (component) {
                this.gearwearComponent = _.find(this.gearwearConfig.components, {name: component.name})
                this.compName = this.gearwearComponent.name
                this.compCurrentMileage = this.gearwearComponent.currentMileage
                this.compAlertMileage = this.gearwearComponent.alertMileage
            } else {
                this.gearwearComponent = null
                this.compName = ""
                this.compCurrentMileage = 0
                this.compAlertMileage = 500
            }

            this.componentDialog = true
        },
        hideComponentDialog() {
            this.componentDialog = false
        },
        saveComponent() {
            if (this.$refs.componentForm.validate()) {
                if (!this.gearwearConfig) {
                    this.gearwearConfig = {id: this.gear.id, components: []}
                }

                this.compCurrentMileage = parseInt(this.compCurrentMileage)
                this.compAlertMileage = parseInt(this.compAlertMileage)

                // Editing or creating a new component?
                if (this.gearwearComponent) {
                    this.gearwearComponent.name = this.compName
                    this.gearwearComponent.currentMileage = this.compCurrentMileage
                    this.gearwearComponent.alertMileage = this.compAlertMileage
                } else {
                    const newComp = {
                        name: this.compName,
                        currentMileage: this.compCurrentMileage,
                        alertMileage: this.compAlertMileage
                    }

                    this.gearwearConfig.components.push(newComp)
                }

                this.gearwearConfig.components = this.gearwearConfig.components
                this.componentDialog = false
                this.hasChanges = true

                // Mileage was set to 0 and reset wasn't today? Ask if user wants to trigger a reset then.
                if (this.compCurrentMileage < 1 && this.gearwearComponent.lastResetDate != this.$moment().format("ll")) {
                    this.resetDialog = true
                }
            }
        },
        // MILEAGE RESET
        // --------------------------------------------------------------------------
        showResetDialog(component) {
            this.gearwearComponent = component
            this.compName = component.name
            this.resetDialog = true
        },
        hideResetDialog() {
            this.resetDialog = false
        },
        async resetMileage() {
            try {
                await this.$axios.$post(`/api/gearwear/${this.user.id}/${this.gear.id}`, {resetMileage: this.compName})

                // Make sure there's a history array.
                if (!this.gearwearComponent.history) {
                    this.gearwearComponent.history = []
                }

                const currentMileage = this.gearwearComponent.currentMileage
                this.gearwearComponent.history.push({date: new Date(), mileage: currentMileage})
                this.gearwearComponent.currentMileage = 0
                this.gearwearComponent.dateAlertSent = null
                this.gearwearComponent.lastResetDate = this.$moment().format("ll")
            } catch (ex) {
                this.$webError("GearEdit.resetMileage", ex)
            }

            this.resetDialog = false
        },
        // DELETE COMPONENT
        // --------------------------------------------------------------------------
        showDeleteComponentDialog(component) {
            this.gearwearComponent = component
            this.compName = component.name
            this.compCurrentMileage = component.currentMileage
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
