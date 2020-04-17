<template>
    <v-card>
        <v-toolbar color="secondary">
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
                            <div v-if="selectedProperty.value">
                                <v-select label="Operator..." v-model="selectedOperator" :hint="selectedOperator.description" :items="selectedProperty.operators" outlined rounded return-object></v-select>
                                <div v-if="!isLocation">
                                    <v-text-field v-model="valueInput" :rules="[recipeRules.required, recipeRules[selectedProperty.type]]" :suffix="selectedProperty.suffix" outlined rounded></v-text-field>
                                </div>
                                <div v-else>
                                    <v-autocomplete v-model="locationInput" label="Location..." item-text="address" :items="locations" :loading="loading" :search-input.sync="searchLocations" return-object rounded outlined no-filter></v-autocomplete>
                                </div>
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
import recipeMixin from "~/mixins/recipeMixin.js"

export default {
    mixins: [recipeMixin],
    data() {
        return this.initialData()
    },
    computed: {
        isLocation() {
            return this.selectedProperty.value && this.selectedProperty.value.indexOf("location") >= 0
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
            const recipeProperties = _.cloneDeep(this.$store.state.recipeProperties)

            return {
                condition: {},
                loading: false,
                valid: true,
                recipeProperties: recipeProperties,
                selectedProperty: {},
                selectedOperator: {},
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
                const result = {
                    property: this.selectedProperty.value,
                    operator: this.selectedOperator.value,
                    value: this.valueInput
                }

                if (this.isLocation) {
                    result.value = this.locationInput.value
                    result.friendlyValue = this.locationInput.address
                }

                this.$emit("closed", result)
                Object.assign(this.$data, this.initialData())
            }
        },
        propertyChanged() {
            this.selectedOperator = {}
        },
        async fetchLocations(value) {
            try {
                this.loading = true
                this.locationInput = null

                this.$axios.setToken(this.$store.state.oauth.accessToken)
                const data = await this.$axios.$get(`/api/maps/geocode?address=${value}`)

                for (let loc of data) {
                    loc.value = [loc.latitude, loc.longitude]
                }

                this.loading = false
                this.locations = data
            } catch (ex) {
                console.error(ex)
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
