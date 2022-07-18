<template>
    <v-layout column>
        <v-container fluid>
            <h1 class="mb-4">
                Hi {{ user && !user.preferences.privacyMode && user.profile.firstName.length < 13 ? user.profile.firstName : "there" }}!
                <v-btn class="float-right mt-3 text-h6 font-weight-bold" color="primary" to="/dashboard/charts" title="View charts" x-small fab rounded nuxt>
                    <v-icon small>mdi-poll</v-icon>
                </v-btn>
            </h1>
            <v-alert v-if="stravaStatus" color="error" border="top" class="mb-4">
                <div class="font-weight-bold">Strava status: {{ stravaStatus }}</div>
                <div>
                    Please note that some of the automations might fail to run during this incident. For more information please check
                    <a class="secondary--text" href="https://status.strava.com" title="Strava API status" target="strava">status.strava.com.</a>
                </div>
            </v-alert>
            <v-alert v-else-if="lastAnnouncement" v-model="alertAnnouncement" color="accent" border="top" class="mb-4" dismissible>
                <v-icon v-if="lastAnnouncement.newFeature" class="float-left mr-1">mdi-new-box</v-icon>
                <div class="font-weight-bold mb-1">
                    {{ lastAnnouncement.title }}
                </div>
                <div>
                    {{ lastAnnouncement.body }}
                    <br v-if="!$breakpoint.mdAndUp" />
                    <n-link color="primary" v-if="lastAnnouncement.href" :title="lastAnnouncement.title" :to="lastAnnouncement.href" @click.native="readAnnouncement()" nuxt>More...</n-link>
                </div>
            </v-alert>
            <div class="mb-4">
                See something new? Check the
                <n-link to="/changelog" title="Full changelog" nuxt>changelog</n-link>
                to keep track of new features and bug fixes.
            </div>
            <div v-if="!recipes || recipes.length == 0">
                <create-first />
            </div>
            <div v-else>
                <v-card outlined>
                    <v-card-title class="accent">Last automated activities</v-card-title>
                    <v-card-text class="pl-0 pr-0">
                        <div class="mt-4 pl-4 pr-4" v-if="!activities">
                            <p>
                                <v-progress-circular class="mr-1 mt-n1" size="16" width="2" indeterminate></v-progress-circular>
                                Loading recent activities...
                            </p>
                        </div>
                        <div class="mt-4 pl-4 pr-4" v-else-if="activities.length == 0">
                            <p>
                                <v-icon color="secondary" class="mr-1">mdi-alert-circle-outline</v-icon>
                                None of your activities were processed by Strautomator yet.
                            </p>
                            <p>
                                Maybe you want to double check your
                                <n-link to="/automations" title="Automations" nuxt router>automations</n-link>?
                            </p>
                        </div>
                        <v-simple-table :class="{'mt-2': !$breakpoint.mdAndUp}" v-else>
                            <thead v-if="$breakpoint.mdAndUp">
                                <tr>
                                    <th></th>
                                    <th>Original activity</th>
                                    <th>Automation(s)</th>
                                    <th>Updated fields</th>
                                    <th class="text-center">Strava</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="activity in activities" :key="activity.id">
                                    <td class="text-center" v-if="$breakpoint.mdAndUp">
                                        <v-icon>{{ getSportIcon(activity.sportType || activity.type) }}</v-icon>
                                    </td>
                                    <td class="pt-2 pb-2">
                                        <template v-if="!$breakpoint.mdAndUp">
                                            <v-icon class="mt-n1 mr-1" small>{{ getSportIcon(activity.sportType || activity.type) }}</v-icon>
                                            <span class="float-right ml-2">{{ getDate(activity).format("ll hA") }}</span>
                                            <a class="font-weight-bold" :href="`https://www.strava.com/activities/${activity.id}`" :title="`Open activity ${activity.id} on Strava`" target="strava">{{ activity.name || "Activity *" }}</a>
                                            <ul>
                                                <li v-for="(recipe, id) in activity.recipes" :key="`${activity.id}-rsd-${id}`">
                                                    <span :class="{'text-decoration-line-through grey--text': !user.recipes[id]}">{{ recipe.title }}</span>
                                                </li>
                                            </ul>
                                        </template>
                                        <template v-else>
                                            <strong>{{ activity.name || "Activity *" }}</strong>
                                            <br />
                                            {{ getDate(activity).format("lll") }}
                                        </template>
                                    </td>
                                    <td class="pt-2 pb-2" v-if="$breakpoint.mdAndUp">
                                        <div v-for="(recipe, id) in activity.recipes" :key="`${activity.id}-rm-${id}`">
                                            <span :class="{'text-decoration-line-through grey--text': !user.recipes[id]}">{{ recipe.title }}</span>
                                        </div>
                                    </td>
                                    <td class="pt-2 pb-2" v-if="$breakpoint.mdAndUp">
                                        {{ getUpdatedFields(activity.updatedFields) }}
                                    </td>
                                    <td class="text-center" v-if="$breakpoint.mdAndUp">
                                        <a :href="`https://www.strava.com/activities/${activity.id}`" :title="`Open activity ${activity.id} on Strava`" target="strava"><v-icon color="primary" class="mt-n1">mdi-open-in-new</v-icon></a>
                                    </td>
                                </tr>
                            </tbody>
                        </v-simple-table>
                        <v-divider />
                        <div class="ml-md-4 mt-4 text-center text-md-left">
                            <v-btn color="primary" title="Go to my automations history" to="/automations/history" small nuxt rounded>
                                <v-icon left>mdi-history</v-icon>
                                Go to automation history
                            </v-btn>
                        </div>
                        <div class="caption mt-4 ml-5 mr-5">Please note that the list above doesn't include activities that were not updated by Strautomator.</div>
                    </v-card-text>
                </v-card>
            </div>

            <v-card class="mt-4" outlined>
                <v-card-title class="accent">Personal records</v-card-title>
                <v-card-text class="pl-0 pr-0">
                    <template v-if="records">
                        <v-simple-table :class="{'mt-2': !$breakpoint.mdAndUp}">
                            <thead>
                                <tr>
                                    <th></th>
                                    <th class="text-center" v-for="recordField in visibleRecordFields" :title="recordField" :key="'th-' + recordField">
                                        <v-icon>{{ getRecordIcon(recordField) }}</v-icon>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="recordEntry in records" :key="recordEntry[0]">
                                    <td class="text-center">
                                        <v-icon>{{ getSportIcon(recordEntry[0]) }}</v-icon>
                                    </td>
                                    <td class="text-center" v-for="recordField in visibleRecordFields" :key="'td-' + recordField">
                                        {{ recordEntry[1][recordField] ? getRecordValue(recordEntry[1], recordField) : "-" }}
                                    </td>
                                </tr>
                            </tbody>
                        </v-simple-table>
                        <v-divider />
                        <div class="ml-md-4 mt-4 text-center text-md-left">
                            <v-btn color="primary" title="View all my personal records" to="/dashboard/records" small nuxt rounded>
                                <v-icon left>mdi-medal</v-icon>
                                Go to my personal records
                            </v-btn>
                        </div>
                    </template>
                    <template v-else>
                        <div class="ml-md-4 mt-4 text-center text-md-left">No personal records were found. Want to start tracking your personal records?</div>
                        <div class="ml-md-4 mt-4 text-center text-md-left">
                            <v-btn color="primary" title="Calculate my personal records" to="/dashboard/records" small nuxt rounded>
                                <v-icon left>mdi-medal</v-icon>
                                Start tracking my records
                            </v-btn>
                        </div>
                    </template>
                </v-card-text>
            </v-card>

            <template v-if="recipes && recipes.length > 0">
                <v-alert class="mt-4 text-center text-md-left">
                    <div class="mb-3 mb-md-2" v-if="user && user.preferences.privacyMode">Privacy mode is enabled, some details about your processed activities and personal records won't be saved!</div>
                    <div class="mb-3 mb-md-0">
                        Missing something?
                        <br v-if="!$breakpoint.mdAndUp" />
                        Try the <n-link to="/activities/sync" title="Try your automations" nuxt>manual automation sync</n-link>.
                    </div>
                    <div>
                        Want to see activities and club events on your calendar app?
                        <n-link to="/calendar" title="Calendar subscription" nuxt>Subscribe</n-link>.
                    </div>
                </v-alert>

                <ads-panel />
            </template>
        </v-container>
    </v-layout>
</template>

<script>
import _ from "lodash"
import userMixin from "~/mixins/userMixin.js"
import recipeMixin from "~/mixins/recipeMixin.js"
import stravaMixin from "~/mixins/stravaMixin.js"
import AdsPanel from "~/components/AdsPanel.vue"
import CreateFirst from "~/components/recipes/CreateFirst.vue"

export default {
    authenticated: true,
    components: {AdsPanel, CreateFirst},
    mixins: [userMixin, recipeMixin, stravaMixin],
    head() {
        return {
            title: "Dashboard"
        }
    },
    data() {
        return {
            activities: null,
            announcements: null,
            lastAnnouncement: null,
            alertAnnouncement: false
        }
    },
    computed: {
        recipes() {
            return Object.values(this.user.recipes)
        },
        records() {
            const records = this.$store.state.athleteRecords
            return records ? _.sortBy(Object.entries(records), (r) => r[0].replace("Virtual", "")) : null
        },
        visibleRecordFields() {
            if (this.$breakpoint.mdAndUp) {
                return ["distance", "movingTime", "elevationGain", "wattsMax", "hrMax", "calories"]
            }

            return ["distance", "elevationGain", "wattsMax", "hrMax"]
        }
    },
    watch: {
        alertAnnouncement: function (newVal, oldVal) {
            if (oldVal && !newVal) {
                this.readAnnouncement()
            }
        }
    },
    async fetch() {
        try {
            this.activities = await this.$axios.$get(`/api/strava/${this.user.id}/activities/processed?limit=5`)
            this.announcements = await this.$axios.$get(`/api/announcements/${this.user.id}/active`)

            if (this.announcements.length > 0) {
                while (this.announcements.length > 0 && !this.lastAnnouncement) {
                    const ann = this.announcements.pop()
                    const aCookie = this.$cookies.get(`announcement-${ann.id}`)

                    if (!aCookie) {
                        this.lastAnnouncement = ann
                        this.alertAnnouncement = true
                    }
                }
            }
        } catch (ex) {
            this.$webError("Dashboard.fetch", ex)
        }
    },
    mounted() {
        this.getStravaStatus()
    },
    methods: {
        getDate(activity) {
            const aDate = this.$dayjs(activity.dateStart || activity.dateProcessed)

            // Always display local activity times!
            if (activity.utcStartOffset) {
                aDate.utcOffset(activity.utcStartOffset)
            }

            return aDate
        },
        getUpdatedFields(fields) {
            const arr = Object.keys(fields)
            arr.sort()
            return arr.join(", ")
        },
        getRecordValue(recordDetails, field) {
            let result = field.includes("Time") ? (recordDetails[field].value / 3600).toFixed(1) : recordDetails[field].value

            // On mobile we do not add the suffix due to space.
            if (!this.$breakpoint.mdAndUp) {
                return result
            }

            const property = _.find(this.$store.state.recipeProperties, {value: field})

            if (property) {
                const suffix = this.$store.state.user.profile.units == "imperial" ? property.impSuffix || property.suffix : property.suffix
                if (suffix) {
                    result += ` ${suffix}`
                }
            }

            return result
        },
        async readAnnouncement() {
            try {
                await this.$axios.$post(`/api/announcements/${this.user.id}/read`, {id: this.lastAnnouncement.id})
            } catch (ex) {
                console.error("Dashboard.readAnnouncement", ex)
            }

            this.$cookies.set(`announcement-${this.lastAnnouncement.id}`, new Date().getTime(), {
                path: "/",
                maxAge: 60 * 60 * 24 * 30
            })

            this.lastAnnouncement = null
        }
    }
}
</script>
