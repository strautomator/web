<template>
    <v-card>
        <v-toolbar color="primary">
            <v-toolbar-title>{{ component && component.name ? "Edit" : "New" }} component</v-toolbar-title>
            <v-spacer></v-spacer>
            <v-toolbar-items>
                <v-btn icon @click.stop="cancel">
                    <v-icon>mdi-close</v-icon>
                </v-btn>
            </v-toolbar-items>
        </v-toolbar>
        <v-card-text>
            <v-form v-model="valid" ref="componentForm">
                <div class="d-flex flex-grow-1 mt-5">
                    <v-text-field v-model="name" label="Component name" placeholder="Ex: chain, cassette, tires..." maxlength="20" :rules="inputRules" validate-on-blur outlined rounded></v-text-field>
                </div>
                <div class="d-flex">
                    <div class="flex-grow-1">
                        <v-text-field v-model="currentDistance" type="number" class="mr-1" label="Distance" min="0" :suffix="distanceUnits" outlined rounded></v-text-field>
                    </div>
                    <div class="flex-grow-0 text-center">
                        <v-icon class="mt-4 ml-1 mr-1" :color="alertDistance > 0 ? 'primary' : ''">mdi-sign-direction</v-icon>
                    </div>
                    <div class="flex-grow-1">
                        <v-text-field v-model="alertDistance" type="number" class="ml-1" label="Alert on" hint="Leave 0 to disable" min="100" :suffix="distanceUnits" outlined rounded></v-text-field>
                    </div>
                </div>
                <div class="d-flex">
                    <div class="flex-grow-1">
                        <v-text-field v-model="currentHours" type="number" class="mr-1" label="Hours" min="0" suffix="h" outlined rounded></v-text-field>
                    </div>
                    <div class="flex-grow-0 text-center">
                        <v-icon class="mt-4 ml-1 mr-1" :color="alertHours > 0 ? 'primary' : ''">mdi-clock-outline</v-icon>
                    </div>
                    <div class="flex-grow-1">
                        <v-text-field v-model="alertHours" type="number" class="ml-1" label="Alert on" hint="Leave 0 to disable" min="20" suffix="h" outlined rounded></v-text-field>
                    </div>
                </div>
                <div class="text-center">
                    <v-btn color="primary" :disabled="!hasAlert" @click="save" title="Save component details" rounded>
                        <v-icon left>mdi-check</v-icon>
                        Save component
                    </v-btn>
                </div>
            </v-form>
        </v-card-text>
    </v-card>
</template>

<script>
import _ from "lodash"
import userMixin from "~/mixins/userMixin.js"
import gearwearMixin from "~/mixins/gearwearMixin.js"

export default {
    mixins: [userMixin, gearwearMixin],
    props: ["gearwear-config", "component"],
    data() {
        return {
            valid: false,
            name: "",
            currentDistance: 0,
            currentHours: 0,
            alertDistance: 0,
            alertHours: 0
        }
    },
    computed: {
        inputRules() {
            const rules = {
                required: (value) => !!value || "Field is required",
                name: (value) => {
                    if (this.gearwearConfig.components.length == 0) return true
                    if (value && !_.find(this.gearwearConfig.components, {name: value.trim()})) return true
                    if (this.component && this.component.name == value) return true
                    return `${value} is a duplicate of another component`
                }
            }

            return [rules.required, rules.name]
        },
        hasAlert() {
            return this.alertHours > 0 || this.alertDistance > 0
        }
    },
    watch: {
        component: function(newVal, oldVal) {
            if (newVal && newVal.name) {
                this.fill(newVal)
            } else {
                this.name = ""
                this.currentDistance = 0
                this.alertDistance = 1000
                this.currentHours = 0
                this.alertHours = 0
            }
        }
    },
    mounted() {
        if (this.component && this.component.name) {
            this.fill(this.component)
        }
    },
    methods: {
        fill(newVal) {
            this.name = newVal.name
            this.currentDistance = newVal.currentDistance
            this.alertDistance = newVal.alertDistance
            this.currentHours = newVal.currentTime ? Math.round(newVal.currentTime / 3600) : 0
            this.alertHours = newVal.alertHours ? Math.round(newVal.alertHours / 3600) : 0
        },
        cancel() {
            this.$emit("closed", false)
        },
        save() {
            if (this.$refs.componentForm.validate()) {
                const compName = this.name
                const compCurrentDistance = parseInt(this.currentDistance)
                const compAlertDistance = parseInt(this.alertDistance)
                const compCurrentHours = parseInt(this.currentHours)
                const compAlertHours = parseInt(this.alertHours)

                // Base component details.
                const component = {
                    name: compName,
                    currentDistance: compCurrentDistance,
                    alertDistance: compAlertDistance
                }

                let currentTrackingChanged = true

                // Editing an existing component? Check if current tracking has changed.
                if (this.component.name) {
                    if (this.component.currentDistance != compCurrentDistance) {
                        currentTrackingChanged = true
                    }

                    if (Math.round(this.component.currentTime / 3600) != compCurrentHours) {
                        currentTrackingChanged = true
                        component.currentTime = compCurrentHours > 0 ? compCurrentHours * 3600 : 0
                    }

                    if (Math.round(this.component.alertTime / 3600) != compAlertHours) {
                        component.alertTime = compAlertHours > 0 ? compAlertHours * 3600 : 0
                    }
                }

                this.$emit("closed", component, currentTrackingChanged)
            }
        }
    }
}
</script>
