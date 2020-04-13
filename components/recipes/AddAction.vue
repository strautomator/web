<template>
    <v-card>
        <v-toolbar color="secondary">
            <v-toolbar-title>Action</v-toolbar-title>
            <v-spacer></v-spacer>
            <v-toolbar-items>
                <v-btn icon @click="cancel">
                    <v-icon>mdi-close</v-icon>
                </v-btn>
            </v-toolbar-items>
        </v-toolbar>
        <v-card-title class="headline">Do the following...</v-card-title>
        <v-card-text>
            <v-form v-model="valid" ref="form">
                <v-container class="ma-0 pa-0" fluid>
                    <v-row no-gutters>
                        <v-col cols="12">
                            <v-select label="Select an action..." v-model="selectedAction" :items="recipeActions" outlined rounded return-object></v-select>
                            <div v-if="selectedAction.value == 'gear'">
                                <v-select label="Select a gear..." v-model="selectedGear" item-value="id" item-text="name" :items="gears" outlined rounded return-object></v-select>
                            </div>
                            <div v-else-if="selectedAction.value == 'description'">
                                <v-textarea v-model="valueInput" :rules="[recipeRules.required]" :maxlength="$store.state.recipeMaxLength.actionValue" outlined></v-textarea>
                            </div>
                            <div v-else-if="selectedAction.value && selectedAction.value != 'commute'">
                                <v-text-field v-model="valueInput" :rules="[recipeRules.required]" :maxlength="$store.state.recipeMaxLength.actionValue" outlined></v-text-field>
                            </div>
                            <div v-if="selectedAction.value == 'name' || selectedAction.value == 'description'">
                                <h3 class="mb-2">Activity tags</h3>
                                <v-chip @click="addTag('distance')" small>Distance</v-chip>
                                <v-chip @click="addTag('elevation')" small>Elevation</v-chip>
                                <v-chip @click="addTag('dateStart')" small>Start time</v-chip>
                                <v-chip @click="addTag('dateEnd')" small>End time</v-chip>
                                <v-chip @click="addTag('totalTime')" small>Total time</v-chip>
                                <v-chip @click="addTag('movingTime')" small>Moving time</v-chip>
                                <h3 class="mt-3 mb-2">Weather tags</h3>
                                <v-chip @click="addTag('weather.icon')" small>Icon</v-chip>
                                <v-chip @click="addTag('weather.summary')" small>Summary</v-chip>
                                <v-chip @click="addTag('weather.temperature')" small>Temperature</v-chip>
                                <v-chip @click="addTag('weather.humidity')" small>Humidity</v-chip>
                                <v-chip @click="addTag('weather.pressure')" small>Pressure</v-chip>
                                <v-chip @click="addTag('weather.windSpeed')" small>Wind speed</v-chip>
                            </div>
                        </v-col>
                    </v-row>
                    <v-row no-gutters>
                        <div class="mt-2 text-center">
                            <v-btn color="primary" @click="save" title="Save this action" :disabled="!selectedAction.value" rounded>Save action</v-btn>
                        </div>
                    </v-row>
                </v-container>
            </v-form>
        </v-card-text>
    </v-card>
</template>

<style>
.v-chip {
    margin: 1px 2px 10px -1px;
}
</style>

<script>
import _ from "lodash"
import recipeMixin from "~/mixins/recipeMixin.js"

export default {
    mixins: [recipeMixin],
    props: ["disabled-actions"],
    data() {
        return this.initialData()
    },
    methods: {
        initialData() {
            const recipeActions = _.cloneDeep(this.$store.state.recipeActions)
            _.remove(recipeActions, (a) => this.disabledActions.indexOf(a.value) >= 0)

            // Get bikes and shoes and create gears list.
            const bikes = _.cloneDeep(this.$store.state.oauth.user.profile.bikes)
            for (let bike of bikes) {
                bike.name = `${bike.name} (bike)`
            }
            const shoes = _.cloneDeep(this.$store.state.oauth.user.profile.shoes)
            for (let shoe of shoes) {
                shoe.name = `${shoe.name} (shoes)`
            }
            const gears = _.concat(bikes, shoes)

            return {
                action: {},
                loading: false,
                valid: true,
                recipeActions: recipeActions,
                selectedAction: {},
                gears: gears,
                selectedGear: {},
                valueInput: ""
            }
        },
        cancel() {
            this.$emit("closed", false)
            Object.assign(this.$data, this.initialData())
        },
        save() {
            if (this.$refs.form.validate()) {
                const result = {
                    type: this.selectedAction.value
                }

                if (result.type == "gear") {
                    result.value = this.selectedGear.id
                    result.friendlyValue = this.selectedGear.name
                } else {
                    result.value = this.valueInput || true
                }

                this.$emit("closed", result)
                Object.assign(this.$data, this.initialData())
            }
        },
        addTag(tag) {
            this.valueInput += "${" + tag + "} "
        }
    }
}
</script>
