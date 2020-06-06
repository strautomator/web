<template>
    <v-card>
        <v-toolbar color="primary">
            <v-toolbar-title>Condition</v-toolbar-title>
            <v-spacer></v-spacer>
            <v-toolbar-items>
                <v-btn icon @click="cancel">
                    <v-icon>mdi-close</v-icon>
                </v-btn>
            </v-toolbar-items>
        </v-toolbar>
        <v-card-title class="headline">If the activity's...</v-card-title>
        <v-card-text>
            <v-form v-model="valid" ref="form">
                <v-container class="ma-0 pa-0" fluid>
                    <v-row no-gutters>
                        <v-col cols="12" :sm="12" :md="isLocationImg ? 7 : 12">
                            <v-select label="Select a property..." v-model="selectedProperty" :items="recipeProperties" @change="propertyChanged" outlined rounded return-object></v-select>
                            <div v-if="selectedProperty.value && !isDefaultFor">
                                <v-select label="Operator..." v-model="selectedOperator" v-if="!isDefaultFor" :hint="selectedOperator.description" :items="selectedProperty.operators" outlined rounded return-object></v-select>
                                <div v-if="isDefaultFor">
                                    <v-select label="Sport types" v-model="selectedDefaultFor" :items="sportTypes" outlined rounded return-object></v-select>
                                </div>
                                <div v-else-if="isWeekday">
                                    <v-select label="Weekday" v-model="selectedWeekday" :items="weekdays" outlined rounded return-object></v-select>
                                </div>
                                <div v-else-if="!isLocation">
                                    <v-text-field v-model="valueInput" :rules="isDefaultFor ? null : [recipeRules.required, recipeRules[selectedProperty.type]]" :suffix="selectedSuffix" :type="selectedType" outlined rounded></v-text-field>
                                </div>
                                <div v-else>
                                    <v-autocomplete v-model="locationInput" label="Location..." item-text="address" :items="locations" :loading="loading" :search-input.sync="searchLocations" return-object rounded outlined no-filter></v-autocomplete>
                                </div>
                            </div>
                            <div class="text-center mb-6 " v-if="isDefaultFor">
                                <v-icon color="grey" small>mdi-information-outline</v-icon>
                                <span>This automation will run on <strong>all</strong> future "{{ defaultFor }}" activities!</span>
                            </div>
                        </v-col>
                        <v-col cols="12" :sm="12" :md="5" v-if="isLocationImg">
                            <v-img class="mb-1 mb-md-0 ml-md-5" :src="locationImageSrc"></v-img>
                        </v-col>
                    </v-row>
                    <v-row no-gutters>
                        <v-col cols="12">
                            <div class="mt-2 text-center">
                                <v-btn color="primary" @click="save" title="Save this condition" :disabled="!selectedProperty.value || !selectedOperator.value" rounded>Save condition</v-btn>
                            </div>
                        </v-col>
                    </v-row>
                </v-container>
            </v-form>
        </v-card-text>
    </v-card>
</template>

<script>
import _ from "lodash"
import userMixin from "~/mixins/userMixin.js"
import recipeMixin from "~/mixins/recipeMixin.js"

export default {
    mixins: [userMixin, recipeMixin],
    data() {
        return this.initialData()
    },
    computed: {
        selectedSuffix() {
            if (this.selectedProperty.type == "time" || this.selectedProperty.type == "elapsedTime") {
                return ""
            }
            if (this.user.preferences && this.user.preferences.weatherUnit == "f" && this.selectedProperty.fSuffix) {
                return this.selectedProperty.fSuffix
            }
            if (this.user.profile.units == "imperial" && this.selectedProperty.impSuffix) {
                return this.selectedProperty.impSuffix
            }

            return this.selectedProperty.suffix
        },
        selectedType() {
            if (this.selectedProperty.type == "time" || this.selectedProperty.type == "elapsedTime") {
                return "time"
            }

            return "text"
        },
        isDefaultFor() {
            return this.selectedProperty.value && this.selectedProperty.value == "defaultFor"
        },
        isWeekday() {
            return this.selectedProperty.value && this.selectedProperty.value == "weekday"
        },
        isLocation() {
            if (this.selectedProperty.value) {
                return this.selectedProperty.value == "polyline" || this.selectedProperty.value.indexOf("location") >= 0
            }
            return false
        },
        isLocationImg() {
            return this.isLocation && this.selectedOperator.value && this.locationInput && this.locationInput.value
        },
        locationRadius() {
            if (!this.selectedOperator) return 0

            if (this.selectedOperator.value == "=") {
                return 10
            } else {
                return 40
            }
        },
        locationImageSrc() {
            let circle, zoom

            if (this.selectedOperator.value == "=") {
                circle = 40
                zoom = 17
            } else {
                circle = 500
                zoom = 14
            }

            return `/api/maps/image?latlong=${this.locationInput.value}&circle=${circle}&zoom=${zoom}`
        }
    },
    methods: {
        initialData() {
            const recipes = Object.values(this.$store.state.user.recipes)
            const recipeProperties = _.cloneDeep(this.$store.state.recipeProperties)
            const sportTypes = []

            // Only add "defaultFor" options for sports which use has no defaultFor yet.
            for (let st of this.$store.state.sportTypes) {
                const disabled = _.find(recipes, {defaultFor: st})
                sportTypes.push({value: st, text: this.getSportName(st), disabled: disabled})
            }

            if (sportTypes.length > 0) {
                recipeProperties.unshift({value: "defaultFor", text: "Default automation for a specific sport type"})
            }

            // Weekdays mapping.
            const weekdays = [
                {value: 0, text: "Sunday"},
                {value: 1, text: "Monday"},
                {value: 2, text: "Tuesday"},
                {value: 3, text: "Wednesday"},
                {value: 4, text: "Thursday"},
                {value: 5, text: "Friday"},
                {value: 6, text: "Saturday"}
            ]

            return {
                condition: {},
                loading: false,
                valid: true,
                recipeProperties: recipeProperties,
                sportTypes: sportTypes,
                weekdays: weekdays,
                selectedProperty: {},
                selectedOperator: {},
                selectedWeekday: {},
                selectedDefaultFor: {},
                valueInput: "",
                locationInput: null,
                searchLocations: null,
                locations: []
            }
        },
        cancel() {
            this.$emit("closed", false)
            Object.assign(this.$data, this.initialData())
        },
        save() {
            if (this.$refs.form.validate()) {
                let result

                // Condition is default for an activity type?
                if (this.isDefaultFor) {
                    result = {defaultFor: this.selectedDefaultFor.value}
                } else {
                    result = {
                        property: this.selectedProperty.value,
                        operator: this.selectedOperator.value,
                        value: this.valueInput
                    }

                    // Get correct values for special conditions.
                    if (this.isWeekday) {
                        result.value = this.selectedWeekday.value
                        result.friendlyValue = this.selectedWeekday.text
                    } else if (this.isLocation) {
                        result.value = this.locationInput.value
                        result.friendlyValue = this.locationInput.address
                    } else if (this.selectedType == "time") {
                        const arrTime = result.value.split(":")
                        result.value = parseInt(arrTime[0]) * 3600 + parseInt(arrTime[1]) * 60
                        result.friendlyValue = this.valueInput
                    }
                }

                this.$emit("closed", result)
                Object.assign(this.$data, this.initialData())
            }
        },
        propertyChanged() {
            if (this.isDefaultFor) {
                this.selectedOperator = {value: true}
            } else if (this.selectedProperty.operators.length == 1) {
                this.selectedOperator = this.selectedProperty.operators[0]
            } else {
                this.selectedOperator = {}
            }
        },
        async fetchLocations(value) {
            try {
                this.locationInput = null

                // User typed the coordinates directly?
                if (_.isString(value) && value.indexOf(",") > 0) {
                    const arrValue = value.split(",")

                    if (arrValue.length == 2 && !isNaN(arrValue[0]) && !isNaN(arrValue[1])) {
                        const lat = parseFloat(arrValue[0])
                        const long = parseFloat(arrValue[1])

                        if (lat >= -90 && lat <= 90 && long >= -180 && long <= 180) {
                            const option = {value: [lat, long], address: `Coordinates ${lat}, ${long}`}
                            this.locations = [option]
                            this.locationInput = option
                            return
                        }
                    }
                }

                this.loading = true
                const data = await this.$axios.$get(`/api/maps/geocode?address=${value}`)

                for (let loc of data) {
                    loc.value = [loc.latitude, loc.longitude]
                }

                this.loading = false
                this.locations = data
            } catch (ex) {
                this.$webError("AddCondition.fetchLocations", ex)
            }
        },
        async fetchLocationsDebounced(value) {
            clearTimeout(this._searchTimerId)

            this._searchTimerId = setTimeout(async () => {
                if (this.searchLocations.length < 5) return
                this.fetchLocations(value)
            }, 1000)
        }
    },
    watch: {
        async searchLocations(value) {
            if (this.isLoading) return
            if (!value || value.length < 5) return
            if (this.locationInput && this.locationInput.address == value) return

            this.locations = []
            await this.fetchLocationsDebounced(value)
        }
    }
}
</script>
