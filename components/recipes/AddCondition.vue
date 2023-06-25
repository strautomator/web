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
        <v-card-title class="headline">If the activity...</v-card-title>
        <v-card-text>
            <v-form v-model="valid" ref="form">
                <v-container class="ma-0 pa-0" fluid>
                    <v-row no-gutters>
                        <v-col cols="12" :sm="12" :md="isLocationImg ? 7 : 12">
                            <v-autocomplete v-model="selectedProperty" label="Select a condition..." :items="recipeProperties" @change="propertyChanged" dense outlined rounded return-object></v-autocomplete>
                            <div v-if="selectedProperty?.value">
                                <v-select
                                    v-if="!isDefaultFor && !isBoolean"
                                    v-model="selectedOperator"
                                    label="Operator..."
                                    :hint="selectedOperator.description"
                                    :items="selectedProperty.operators"
                                    :item-text="(item) => (user.profile.units == 'imperial' ? item.impText || item.text : item.text)"
                                    dense
                                    outlined
                                    rounded
                                    return-object
                                ></v-select>
                                <div v-if="isDefaultFor">
                                    <v-select label="Sport types" v-model="selectedDefaultFor" :items="defaultSportTypes" dense outlined rounded return-object></v-select>
                                </div>
                                <div v-else-if="isSportType">
                                    <v-select label="Sport types" v-model="selectedSportTypes" :items="sportTypes" :rules="sportInputRules" multiple dense outlined rounded return-object></v-select>
                                </div>
                                <div v-else-if="isGear">
                                    <v-select label="Gear" v-model="selectedGear" :items="allGear" :rules="gearInputRules" multiple dense outlined rounded return-object></v-select>
                                </div>
                                <div v-else-if="isBoolean">
                                    <v-select label="Yes or No?" v-model="selectedBoolean" :items="booleans" :rules="booleanInputRules" dense outlined rounded return-object></v-select>
                                </div>
                                <div v-else-if="isWeekday">
                                    <v-select label="Weekday" v-model="selectedWeekdays" :items="weekdays" :rules="weekdayInputRules" multiple dense outlined rounded return-object></v-select>
                                </div>
                                <div v-else-if="!isLocation">
                                    <v-text-field v-model="valueInput" type="text" :rules="valueInputRules" :suffix="selectedSuffix" :placeholder="inputPlaceholder" dense outlined rounded></v-text-field>
                                </div>
                                <div v-else>
                                    <v-autocomplete
                                        v-model="locationInput"
                                        label="Location or geo coordinates..."
                                        item-text="address"
                                        :items="locations"
                                        :loading="loading"
                                        :search-input.sync="searchLocations"
                                        :rules="locationInputRules"
                                        return-object
                                        dense
                                        rounded
                                        outlined
                                        no-filter
                                    ></v-autocomplete>
                                </div>
                            </div>
                            <div class="text-center mb-6" v-if="isDefaultFor">
                                <v-icon color="grey" small>mdi-information-outline</v-icon>
                                <span>This automation will run on <strong>all</strong> future "{{ selectedDefaultFor.value }}" activities!</span>
                            </div>
                        </v-col>
                        <v-col cols="12" :sm="12" :md="5" v-if="isLocationImg">
                            <v-img class="mb-1 mb-md-0 ml-md-5" :src="locationImageSrc"></v-img>
                        </v-col>
                    </v-row>
                    <v-row no-gutters>
                        <v-col class="mt-4 text-center" cols="12">
                            <v-btn color="primary" @click="save" title="Save this condition" :disabled="!isBoolean && (!selectedProperty?.value || !selectedOperator?.value)" rounded>
                                <v-icon left>mdi-check</v-icon>
                                Save condition
                            </v-btn>
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
import stravaMixin from "~/mixins/stravaMixin.js"

export default {
    mixins: [userMixin, recipeMixin, stravaMixin],
    data() {
        return this.initialData()
    },
    computed: {
        selectedSuffix() {
            if (!this.selectedProperty || this.selectedProperty.type == "time") {
                return ""
            }
            if (this.user.preferences.weatherUnit == "f" && this.selectedProperty.fSuffix) {
                return this.selectedProperty.fSuffix
            }
            if (this.user.profile.units == "imperial" && this.selectedProperty.impSuffix) {
                return this.selectedProperty.impSuffix
            }

            return this.selectedProperty.suffix
        },
        inputPlaceholder() {
            return this.selectedProperty?.type == "time" ? "00:00" : ""
        },
        isDefaultFor() {
            return this.selectedProperty?.value == "defaultFor"
        },
        isSportType() {
            return this.selectedProperty?.value == "sportType"
        },
        isGear() {
            return this.selectedProperty?.value == "gear"
        },
        isWeekday() {
            return this.selectedProperty?.value == "weekday"
        },
        isGarmin() {
            return this.selectedProperty?.value == "garmin.sensor"
        },
        isSpotify() {
            return this.selectedProperty?.value == "spotify.track"
        },
        isBoolean() {
            return this.selectedProperty?.type == "boolean"
        },
        isLocation() {
            return this.selectedProperty?.value == "polyline" || this.selectedProperty?.value.includes("location")
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

            return `/api/maps/${this.user.id}/image?latlong=${this.locationInput.value}&circle=${circle}&zoom=${zoom}`
        },
        sportInputRules() {
            if (!this.isSportType) return false
            return [this.recipeRules.required, () => this.selectedSportTypes.length > 0]
        },
        gearInputRules() {
            if (!this.isGear) return false
            return [this.recipeRules.required, () => this.selectedGear.length > 0]
        },
        booleanInputRules() {
            if (!this.isBoolean) return false
            return [this.recipeRules.required, () => this.selectedBoolean.value === false || this.selectedBoolean.value === true]
        },
        weekdayInputRules() {
            if (!this.isWeekday) return false
            return [this.recipeRules.required, () => this.selectedWeekdays.length > 0]
        },
        locationInputRules() {
            if (!this.isLocation) return false
            return [this.recipeRules.required, () => (this.locationInput && this.locationInput.value.length > 0 ? true : false)]
        },
        valueInputRules() {
            if (!this.selectedProperty) return [this.recipeRules.required]
            if (this.isDefaultFor) return false
            if (["dateStart", "dateEnd"].includes(this.selectedProperty.value)) return [this.recipeRules.required, this.recipeRules.time]
            if (["movingTime", "totalTime", "lapTime"].includes(this.selectedProperty.value)) return [this.recipeRules.required, this.recipeRules.timer]
            if (this.recipeRules[this.selectedProperty.type]) return [this.recipeRules.required, this.recipeRules[this.selectedProperty.type]]
            return [this.recipeRules.required]
        }
    },
    methods: {
        initialData() {
            const user = this.$store.state.user
            const recipes = Object.values(user.recipes)
            const recipeProperties = _.cloneDeep(this.$store.state.recipeProperties)
            const defaultSportTypes = []
            const sportTypes = []

            // Only add "defaultFor" options for sports which use has no defaultFor yet.
            for (let st of this.$store.state.sportTypes) {
                const sportName = this.getSportName(st)
                const disabled = _.find(recipes, {defaultFor: st})
                defaultSportTypes.push({value: st, text: sportName, disabled: disabled})
                sportTypes.push({value: st, text: sportName})
            }

            if (sportTypes.length > 0) {
                recipeProperties.unshift({value: "defaultFor", text: "Default automation for a specific sport type"})
            }

            // Disable Garmin if user has no account linked.
            const garminProp = _.find(recipeProperties, {value: "garmin.sensor"})
            if (!user.isPro) {
                garminProp.text += " (PRO only)"
                garminProp.disabled = true
            } else if (!user.garmin) {
                garminProp.text += " (needs linked Garmin)"
                garminProp.disabled = true
            }

            // Disable Spotify if user has no account linked.
            const spotifyProp = _.find(recipeProperties, {value: "spotify.track"})
            if (!user.spotify) {
                spotifyProp.text += " (needs linked Spotify)"
                spotifyProp.disabled = true
            }

            // Gear condition.
            const gearMap = (g) => {
                return {value: g.id, text: g.name}
            }
            const allGear = _.concat(user.profile.bikes || [], user.profile.shoes || []).map(gearMap)

            // Privacy mode disables new records.
            if (user.preferences.privacyMode) {
                const newRecordsProp = recipeProperties.find((p) => p.value == "newRecords")
                newRecordsProp.disabled = true
                newRecordsProp.text += " (privacy mode)"
            }

            // Boolean mapping.
            const booleans = [
                {value: true, text: "Yes"},
                {value: false, text: "No"}
            ]

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
                defaultSportTypes: defaultSportTypes,
                sportTypes: sportTypes,
                allGear: allGear,
                booleans: booleans,
                weekdays: weekdays,
                selectedSportTypes: [],
                selectedGear: [],
                selectedWeekdays: [],
                selectedBoolean: {},
                selectedProperty: {value: ""},
                selectedOperator: {},
                selectedDefaultFor: {},
                valueInput: "",
                locationInput: null,
                searchLocations: null,
                locations: []
            }
        },
        cancel() {
            this.$emit("closed", false)
            const reset = () => Object.assign(this.$data, this.initialData())
            setTimeout(reset, 500)
        },
        save() {
            if (this.$refs.form.validate()) {
                let result

                // Condition is default for an activity type?
                if (this.isDefaultFor) {
                    result = {defaultFor: this.selectedDefaultFor.value}
                } else {
                    result = {
                        property: this.selectedProperty?.value,
                        operator: this.selectedOperator.value,
                        value: this.valueInput
                    }

                    // Get correct values for special conditions.
                    if (this.isBoolean) {
                        result.operator = "="
                        result.value = this.selectedBoolean.value
                        result.friendlyValue = this.selectedBoolean.text
                    } else if (this.isSportType) {
                        result.value = _.map(this.selectedSportTypes, "value").join(",")
                        result.friendlyValue = _.map(this.selectedSportTypes, "text").join(" or ")
                    } else if (this.isGear) {
                        result.value = _.map(this.selectedGear, "value").join(",")
                        result.friendlyValue = _.map(this.selectedGear, "text").join(" or ")
                    } else if (this.isWeekday) {
                        result.value = _.map(this.selectedWeekdays, "value").join(",")
                        result.friendlyValue = _.map(this.selectedWeekdays, "text").join(" or ")
                    } else if (this.isLocation) {
                        result.value = this.locationInput.value
                        result.friendlyValue = this.locationInput.address
                    } else if (this.selectedProperty.type == "time") {
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
            } else if (this.selectedProperty?.operators.length == 1) {
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
                    let lat = arrValue[0].trim()
                    let long = arrValue[1].trim()

                    if (arrValue.length == 2 && !isNaN(lat) && !isNaN(long)) {
                        lat = parseFloat(lat)
                        long = parseFloat(long)

                        if (lat >= -90 && lat <= 90 && long >= -180 && long <= 180) {
                            const option = {value: [lat, long], address: `Coordinates ${lat}, ${long}`}
                            this.locations = [option]
                            this.locationInput = option
                            return
                        }
                    }
                }

                this.loading = true
                const data = await this.$axios.$get(`/api/maps/${this.user.id}/geocode?address=${value}`)

                for (let loc of data) {
                    loc.value = [loc.latitude, loc.longitude]
                }

                this.loading = false
                this.locations = data
            } catch (ex) {
                this.$webError(this, "AddCondition.fetchLocations", ex)
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
