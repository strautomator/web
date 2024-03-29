<template>
    <v-layout column>
        <v-container fluid>
            <h1>Personal records</h1>

            <v-snackbar v-model="savedRecord" class="text-left" color="success" :timeout="5000" rounded bottom>
                {{ editRecordSport }} - {{ camelCaseName(editRecordField) }} new record:{{ editRecordValue }}!
                <template v-slot:action="{attrs}">
                    <v-icon v-bind="attrs" @click="savedRecord = false">mdi-close-circle</v-icon>
                </template>
            </v-snackbar>

            <v-card v-if="!records" outlined>
                <v-card-text class="text-center text-md-left">
                    <template v-if="isPrivacyMode">
                        <div class="text-center">
                            <div>
                                <v-icon class="mb-4" x-large>mdi-cancel</v-icon>
                            </div>
                            Privacy mode is enabled on your account settings. Please disable it if you wish to track your personal records with Strautomator.
                        </div>
                    </template>
                    <template v-else-if="refreshing">
                        <div class="text-center text-md-left">
                            <v-progress-circular class="mr-1 mt-n1" size="16" width="2" indeterminate></v-progress-circular>
                            Fetching your activity records, please wait...
                        </div>
                        <v-alert class="mt-5 text-center text-md-left" color="accent" border="top">This is a long process and can take up to 4 minutes to complete!</v-alert>
                    </template>
                    <template v-else-if="noRecords">
                        <div class="text-center">
                            <div>
                                <v-icon class="mb-4" x-large>mdi-cancel</v-icon>
                            </div>
                            No personal records could be extracted from your activities. Please try again after you've registered at least 10 activities on Strava.
                        </div>
                    </template>
                    <template v-else>
                        <div>
                            Strautomator can keep track of your personal records!
                            <br v-if="$breakpoint.mdAndUp" />
                            Want to enable the feature? Start now by fetching your existing activity records.
                        </div>
                        <v-btn class="mt-4" color="primary" title="Process my activity records" @click="refreshRecords" nuxt rounded>
                            <v-icon left>mdi-tray-arrow-down</v-icon>
                            Fetch activity records
                        </v-btn>
                    </template>
                </v-card-text>
            </v-card>

            <template v-else-if="refreshing">
                <div class="text-center text-md-left">
                    <v-progress-circular class="mr-1 mt-n1" size="16" width="2" indeterminate></v-progress-circular>
                    Refreshing activity records, please wait...
                </div>
                <v-alert class="mt-5 text-center text-md-left" color="accent" border="top">This is a long process and can take up to 4 minutes to complete!</v-alert>
            </template>

            <template v-else>
                <v-card class="mb-5" v-for="recordEntry in records" :key="recordEntry[0]" outlined>
                    <v-card-title class="accent">
                        <v-icon class="mr-2">{{ getSportIcon(recordEntry[0]) }}</v-icon>
                        {{ camelCaseName(recordEntry[0]) }}
                    </v-card-title>
                    <v-card-text class="pa-0">
                        <v-simple-table :class="{'mt-2': !$breakpoint.mdAndUp}">
                            <thead>
                                <tr>
                                    <th></th>
                                    <th>Best</th>
                                    <th v-if="$breakpoint.mdAndUp">2nd Best</th>
                                    <th v-if="$breakpoint.mdAndUp">Date</th>
                                    <th class="text-center pr-0 pl-0" width="1">Activity</th>
                                    <th class="text-center pr-0 pl-0" width="1" v-if="$breakpoint.mdAndUp">Edit</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr class="mb-1" v-for="recordField in getRecordFields(recordEntry[1])" :key="'td-' + recordField">
                                    <td class="text-capitalize">
                                        <v-icon class="mr-1" :small="!$breakpoint.mdAndUp">{{ getRecordIcon(recordField) }}</v-icon>
                                        <span :class="!$breakpoint.mdAndUp ? 'caption' : ''">{{ camelCaseName(recordField) }}</span>
                                    </td>
                                    <td>
                                        <a @click="showEditDialog(recordEntry, recordField)">{{ getRecordValue(recordEntry[1], recordField) }}</a>
                                    </td>
                                    <td class="grey--text" v-if="$breakpoint.mdAndUp">
                                        {{ getRecordValue(recordEntry[1], recordField, true) }}
                                    </td>
                                    <td v-if="$breakpoint.mdAndUp">
                                        {{ recordEntry[1][recordField] ? $dayjs(recordEntry[1][recordField].date).format($breakpoint.mdAndUp ? "lll" : "ll") : "-" }}
                                    </td>
                                    <td class="text-center">
                                        <template v-if="recordHasActivity(recordEntry, recordField)">
                                            <a title="Go to Strava" target="strava" :href="`https://www.strava.com/activities/${recordEntry[1][recordField].activityId}`"><v-icon color="primary">mdi-open-in-new</v-icon></a>
                                        </template>
                                        <span v-else><v-icon title="Unknown activity" color="grey">mdi-help-box</v-icon></span>
                                    </td>
                                    <td class="text-center" v-if="$breakpoint.mdAndUp">
                                        <v-icon title="Edit record value" color="primary" @click="showEditDialog(recordEntry, recordField)">mdi-pencil-outline</v-icon>
                                    </td>
                                </tr>
                            </tbody>
                        </v-simple-table>
                    </v-card-text>
                </v-card>

                <v-card outlined>
                    <v-card-text class="text-center text-md-left">
                        <p>
                            Your personal records are updated automatically with each new Strava activity.
                            <br v-if="$breakpoint.mdAndUp" />
                            If for some reason you think the records shown above are wrong or outdated, you can manually refresh them.
                        </p>
                        <v-btn class="mt-2" color="primary" title="Refresh my activity records" @click="refreshRecords" nuxt rounded>
                            <v-icon left>mdi-refresh</v-icon>
                            Refresh my records
                        </v-btn>
                    </v-card-text>
                </v-card>
            </template>

            <v-alert v-if="refreshError" class="mt-5 text-center text-md-left" color="error" border="top">{{ refreshError }}</v-alert>
        </v-container>

        <v-dialog v-model="editDialog" width="400" overlay-opacity="0.95">
            <v-card>
                <v-toolbar color="primary">
                    <v-toolbar-title>
                        <v-icon class="mr-1">{{ getSportIcon(editRecordSport) }}</v-icon>
                        <v-icon class="mr-1">{{ getRecordIcon(editRecordField) }}</v-icon>
                        <span class="text-capitalize">{{ camelCaseName(editRecordField) }}</span>
                    </v-toolbar-title>
                    <v-spacer></v-spacer>
                    <v-toolbar-items>
                        <v-btn icon @click.stop="hideEditDialog">
                            <v-icon>mdi-close</v-icon>
                        </v-btn>
                    </v-toolbar-items>
                </v-toolbar>
                <v-card-text>
                    <v-form ref="editForm">
                        <p class="mt-3">Sport: {{ camelCaseName(editRecordSport) }}</p>
                        <p>Enter the new record below. Your previous record will be erased, as well as its referenced activity ID.</p>
                        <div>
                            <v-text-field v-model="editRecordValue" label="New record" maxlength="10" :loading="savingRecord" :suffix="editRecordSuffix" validate-on-blur outlined rounded></v-text-field>
                        </div>
                    </v-form>
                    <div class="text-right">
                        <v-spacer></v-spacer>
                        <v-btn class="mr-2" color="grey" title="Stay here" @click.stop="hideEditDialog" text rounded>
                            <v-icon left>mdi-cancel</v-icon>
                            Cancel
                        </v-btn>
                        <v-btn color="primary" title="Save new record value" :disabled="editRecordValue.length < 1" @click="saveRecord" rounded>
                            <v-icon left>mdi-check</v-icon>
                            Save
                        </v-btn>
                    </div>
                </v-card-text>
            </v-card>
        </v-dialog>
    </v-layout>
</template>

<script>
import _ from "lodash"
import userMixin from "~/mixins/userMixin.js"
import recipeMixin from "~/mixins/recipeMixin.js"
import stravaMixin from "~/mixins/stravaMixin.js"

export default {
    authenticated: true,
    mixins: [userMixin, recipeMixin, stravaMixin],
    head() {
        return {
            title: "Personal records"
        }
    },
    data() {
        return {
            refreshing: false,
            refreshError: null,
            noRecords: false,
            savedRecord: false,
            savingRecord: false,
            editDialog: false,
            editRecordSport: "",
            editRecordField: "",
            editRecordValue: "",
            editRecordSuffix: ""
        }
    },
    computed: {
        records() {
            const records = this.$store.state.athleteRecords
            if (!records) return null

            return records ? _.sortBy(Object.entries(records), (r) => r[0].replace("Virtual", "")) : null
        }
    },
    methods: {
        recordHasActivity(recordEntry, recordField) {
            return recordEntry[1][recordField] && recordEntry[1][recordField].activityId
        },
        camelCaseName(field) {
            const result = field.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())
            return result.replace("Hr", "HR")
        },
        getRecordFields(recordDetails) {
            return Object.keys(recordDetails).sort()
        },
        getRecordValue(recordDetails, field, previous) {
            const targetProp = previous ? "previous" : "value"
            const property = _.find(this.$store.state.recipeProperties, {value: field})

            if (!recordDetails[field] || !recordDetails[field][targetProp]) return "-"

            let result = field.includes("Time") ? (recordDetails[field][targetProp] / 3600).toFixed(1) : recordDetails[field][targetProp]

            if (property && !previous) {
                const suffix = this.$store.state.user.profile.units == "imperial" ? property.impSuffix || property.suffix : property.suffix
                if (suffix) {
                    result += ` ${suffix}`
                }
            }

            return result
        },
        async refreshRecords() {
            try {
                const waitMessage = "Your records were recently refreshed, please wait at least 24 hours"
                const timestamp = Math.round(new Date().valueOf() / 1000)
                const cookie = this.$cookies.get("athlete-records-refreshed", {parseJSON: false})

                if (cookie) {
                    this.refreshError = waitMessage
                    return
                }

                this.refreshing = true
                this.refreshError = null

                const records = await this.$axios.$get(`/api/strava/${this.user.id}/athlete-records/refresh`)

                if (!records) {
                    this.noRecords = true
                    this.refreshError = "No personal records were found"
                } else if (records.recentlyRefreshed) {
                    this.refreshError = waitMessage
                } else {
                    this.$store.commit("setAthleteRecords", records)
                    this.$cookies.set("athlete-records-refreshed", timestamp, {
                        path: "/",
                        maxAge: 60 * 60 * 12
                    })
                }
            } catch (ex) {
                this.$webError(this, "Records.fetch", ex)
            }

            this.refreshing = false
        },
        showEditDialog(recordEntry, recordField) {
            this.savedRecord = false

            const recordValue = recordEntry[1][recordField].value
            const suffixProperty = _.find(this.$store.state.recipeProperties, {value: recordField})

            this.editRecordSuffix = this.$store.state.user.profile.units == "imperial" ? suffixProperty.impSuffix || suffixProperty.suffix : suffixProperty.suffix
            if (!this.editRecordSuffix) this.editRecordSuffix = ""

            this.editRecordSport = recordEntry[0]
            this.editRecordField = recordField
            this.editRecordValue = recordField.includes("Time") ? (recordValue / 3600).toFixed(1) : recordValue
            this.editDialog = true
        },
        hideEditDialog() {
            this.savingRecord = false
            this.editDialog = false
        },
        async saveRecord() {
            try {
                this.savingRecord = true

                const records = _.cloneDeep(this.$store.state.athleteRecords)
                const previous = records[this.editRecordSport][this.editRecordField].previous
                const value = this.editRecordField.includes("Time") ? Math.round(parseFloat(this.editRecordValue) * 3600) : this.editRecordValue

                const data = {field: this.editRecordField, value: value}
                if (value < previous) {
                    data.previous = value
                }

                const result = await this.$axios.$post(`/api/strava/${this.user.id}/athlete-records/${this.editRecordSport}`, data)
                this.$store.commit("setAthleteRecords", _.defaultsDeep(result, records))

                this.hideEditDialog()
                this.savedRecord = true
            } catch (ex) {
                this.$webError(this, "Records.saveRecord", ex)
            }
        }
    }
}
</script>
