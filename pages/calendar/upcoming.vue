<template>
    <v-layout column>
        <v-container fluid>
            <h1>Upcoming Events Map</h1>
            <v-card class="mt-5" v-if="user" outlined>
                <v-card-text>
                    <div class="mt-1 text-center text-md-left" v-if="loading">
                        <v-progress-circular class="mr-1 mt-n1" size="16" width="2" indeterminate></v-progress-circular>
                        Loading upcoming club events, please wait, this can take up to a minute...
                    </div>
                    <div id="upcoming-events-map"></div>
                    <div v-if="!loading">
                        <v-divider v-if="!$breakpoint.mdAndUp"></v-divider>
                        <v-simple-table class="mt-2">
                            <thead v-if="$breakpoint.mdAndUp">
                                <tr>
                                    <th></th>
                                    <th>Date</th>
                                    <th>Title</th>
                                    <th class="text-center">Distance</th>
                                    <th class="text-center">Joined</th>
                                    <th class="text-center">Strava</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="e in events" :key="e.id">
                                    <td class="text-center" v-if="$breakpoint.mdAndUp">
                                        <v-icon>{{ getSportIcon(e.type) }}</v-icon>
                                    </td>
                                    <td class="pt-2 pb-2">
                                        <template v-if="!$breakpoint.mdAndUp">
                                            <v-icon class="mt-n1 mr-1" small>{{ getSportIcon(e.type) }}</v-icon>
                                            <span>{{ $dayjs(e.dates[0]).format("llll") }}</span>
                                            <span v-if="e.dates.length > 1">(+{{ v.dates.length - 1 }})</span>
                                            <br />
                                            <a class="font-weight-bold" :href="`https://www.strava.com/clubs/${e.club.id}/group_events/${e.id}`" :title="`Open event ${e.id} on Strava`" target="strava">{{ e.title }}</a>
                                        </template>
                                        <template v-else>
                                            {{ $dayjs(e.dates[0]).format("llll") }}
                                            <span v-if="e.dates.length > 1">(+{{ v.dates.length - 1 }})</span>
                                        </template>
                                    </td>
                                    <td class="pt-2 pb-2" v-if="$breakpoint.mdAndUp">
                                        <a v-if="e.route" @click="tableRouteClick(e)">{{ e.title }}</a>
                                        <span v-else>{{ e.title }}</span>
                                    </td>
                                    <td class="pt-2 pb-2 text-center" v-if="$breakpoint.mdAndUp">
                                        {{ e.route ? e.route.distance : "-" }}
                                    </td>
                                    <td class="pt-2 pb-2 text-center" v-if="$breakpoint.mdAndUp">
                                        <v-icon class="mt-n1" v-if="e.joined">mdi-checkbox-marked</v-icon>
                                        <v-icon class="mt-n1" color="grey" v-else>mdi-checkbox-blank-outline</v-icon>
                                    </td>
                                    <td class="text-center" v-if="$breakpoint.mdAndUp">
                                        <a :href="`https://www.strava.com/clubs/${e.club.id}/group_events/${e.id}`" :title="`Open event ${e.id} on Strava`" target="strava"><v-icon color="primary" class="mt-n1">mdi-open-in-new</v-icon></a>
                                    </td>
                                </tr>
                            </tbody>
                        </v-simple-table>
                        <div class="text-right mt-2" v-if="routeIds">
                            <v-btn color="primary" title="Download routes" @click="downloadRoutes" :disabled="!routeIds" small rounded>
                                <v-icon left>mdi-folder-download</v-icon>
                                Download routes
                            </v-btn>
                        </div>
                    </div>
                </v-card-text>
            </v-card>
        </v-container>
    </v-layout>
</template>

<style scoped>
#upcoming-events-map {
    height: 400px;
    width: 100%;
}
</style>

<script>
import _ from "lodash"
import userMixin from "~/mixins/userMixin.js"
import stravaMixin from "~/mixins/stravaMixin.js"

export default {
    authenticated: true,
    mixins: [userMixin, stravaMixin],
    head() {
        return {
            title: "Upcoming Events Map"
        }
    },
    data() {
        return {
            loading: true,
            map: null,
            events: [],
            unmappedEvents: [],
            eventMapObjects: {},
            selectedEvent: null,
            currentPosition: null
        }
    },
    computed: {
        routeIds() {
            if (!this.events || this.events.length == 0) return null
            return this.events.filter((e) => e.route).map((e) => e.route.id)
        }
    },
    async mounted() {
        try {
            this.loading = true

            navigator.geolocation.getCurrentPosition((position) => this.mapSetPosition(position))

            // Check if events are cached on local storage, or if they should be reloaded.
            const cachedEvents = this.$getLocalStorage("clubs-upcoming-events")
            if (cachedEvents) {
                this.events = cachedEvents
            } else {
                const events = await this.$axios.$get(`/api/strava/${this.user.id}/clubs/upcoming-events`)
                this.events = events
                this.$setLocalStorage("clubs-upcoming-events", events, this.user.isPro ? 3600 : 7200)
            }

            if (typeof window !== "undefined") {
                window.initUpcomingEventsMap = () => this.loadMap()

                if (!window.google) {
                    const mapScript = document.createElement("script")
                    mapScript.async = true
                    mapScript.defer = true
                    mapScript.src = "https://maps.googleapis.com/maps/api/js?key=AIzaSyC0cBXUmFBGn_HNlH06F2LM_WG2YWZGKe0&libraries=geometry&callback=initUpcomingEventsMap"
                    mapScript.onerror = (ex) => this.$webError("UpcomingEventsMap.fetch", ex)
                    document.querySelector("head").appendChild(mapScript)
                } else {
                    this.loadMap()
                }
            }
        } catch (ex) {
            this.$webError("UpcomingEventsMap.mounted", ex)
        }
    },
    methods: {
        async loadMap() {
            try {
                this.map = new google.maps.Map(document.getElementById("upcoming-events-map"))
                this.loading = false

                if (this.currentPosition) {
                    this.mapSetPosition()
                }

                for (let e of this.events) {
                    if (!e.position) {
                        e.position = await this.loadAddressLocation(e)
                    }
                    if (!e.position) {
                        this.unmappedEvents.push(e)
                        _.remove(this.events, {id: e.id})
                        continue
                    }

                    // Event marker.
                    const marker = new google.maps.Marker({
                        position: e.position,
                        title: e.title,
                        map: this.map
                    })
                    marker.addListener("click", () => this.mapMarkerClick(e))
                    marker.addListener("mouseover", () => this.mapHighlightRoute(e, true))
                    marker.addListener("mouseout", () => this.mapHighlightRoute(e, false))

                    // Info window.
                    const infoWindow = new google.maps.InfoWindow({
                        content: `<div class="black--text">
    <h3 class="mb-1">${e.title}</h3>
    <div>Date: ${this.$dayjs(e.dates[0]).format("lll")}</div>
    <div>Distance: ${e.route ? e.route.distance : "-"}</div>
    <div class="mt-1"><a href="https://www.strava.com/clubs/${e.club.id}/group_events/${e.id}">More info...</a></div>
    </div>`
                    })

                    // Append map elements to event.
                    this.eventMapObjects[e.id] = {marker: marker, infoWindow: infoWindow}
                }

                this.mapDrawRoutes()
            } catch (ex) {
                this.$webError("UpcomingEventsMap.loadMap", ex)
            } finally {
                this.loading = false
            }
        },
        async loadAddressLocation(e) {
            return new Promise((resolve, reject) => {
                const geocoder = new google.maps.Geocoder()

                geocoder.geocode({address: e.address}, (results, status) => {
                    if (status === "OK") {
                        resolve(results[0].geometry.location)
                    } else if (status === "ZERO_RESULTS") {
                        resolve(null)
                    } else {
                        reject(status)
                    }
                })
            })
        },
        mapDrawRoutes() {
            for (let e of this.events) {
                if (!e.route || !e.route.polyline) continue

                try {
                    const points = google.maps.geometry.encoding.decodePath(e.route.polyline)
                    const poly = new google.maps.Polyline({
                        path: points,
                        strokeColor: "#FF0000",
                        strokeOpacity: 0.45,
                        strokeWeight: 4,
                        map: this.map
                    })

                    this.eventMapObjects[e.id].polyline = poly
                } catch (ex) {
                    console.error("UpcomingEventsMap.mapBindGpx", e.id, "Failed to draw route", ex)
                }
            }
        },
        mapSetPosition(position) {
            if (position) {
                this.currentPosition = position.coords
            }

            if (this.map && this.currentPosition) {
                this.map.setCenter(new google.maps.LatLng(this.currentPosition.latitude, this.currentPosition.longitude))
                this.map.setZoom(8)
            }
        },
        mapSetBounds(e) {
            const bounds = new google.maps.LatLngBounds()
            const points = this.eventMapObjects[e.id].polyline.getPath().getArray()
            points.forEach((p) => bounds.extend(p))
            this.map.fitBounds(bounds)
        },
        mapMarkerClick(e) {
            if (this.selectedEvent && this.selectedEvent.id == e.id) {
                const previousEvent = this.selectedEvent
                this.selectedEvent = null
                this.mapHighlightRoute(previousEvent, false)
            } else {
                const marker = this.eventMapObjects[e.id].marker
                const infoWindow = this.eventMapObjects[e.id].infoWindow

                this.selectedEvent = e
                this.mapHighlightRoute(e, true, true)
                this.map.setCenter(marker.getPosition())

                infoWindow.open({
                    anchor: marker,
                    map: this.map
                })
            }
        },
        mapHighlightRoute(e, highlight, clicked) {
            if (!this.eventMapObjects[e.id].polyline) return

            if (clicked) {
                this.eventMapObjects[e.id].polyline.setOptions({strokeOpacity: 0.95})
            } else if (highlight) {
                this.eventMapObjects[e.id].polyline.setOptions({strokeOpacity: 0.85})
            } else if (!this.selectedEvent || this.selectedEvent.id != e.id) {
                this.eventMapObjects[e.id].polyline.setOptions({strokeOpacity: 0.45})
            }
        },
        tableRouteClick(e) {
            this.mapSetBounds(e)
        },
        downloadRoutes() {
            window.open(`/api/strava/${this.user.id}/${this.user.urlToken}/routes.zip?routes=${this.routeIds.join(",")}`, "gpx-download")
        }
    }
}
</script>
