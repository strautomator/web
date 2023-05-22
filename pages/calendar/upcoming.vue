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
                    <div class="googlemaps-canvas" ref="googlemaps" v-if="events && events.length > 0"></div>
                    <div v-if="!loading && events">
                        <template v-if="events.length > 0">
                            <v-divider v-if="!$breakpoint.mdAndUp"></v-divider>
                            <v-simple-table class="mt-2" v-if="$breakpoint.mdAndUp">
                                <thead>
                                    <tr>
                                        <th></th>
                                        <th>Date</th>
                                        <th>Title</th>
                                        <th class="text-center">Details</th>
                                        <th class="text-center">Weather</th>
                                        <th class="text-center">Joined</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="ed in eventDates" :key="ed.date + ed.event.id">
                                        <td class="text-left">
                                            <v-icon>{{ getSportIcon(ed.event.type) }}</v-icon>
                                        </td>
                                        <td class="pt-2 pb-2" nowrap>
                                            {{ $dayjs(ed.date).format("ddd, DD MMM YYYY, HH:mm") }}
                                        </td>
                                        <td class="pt-2 pb-2">
                                            <a v-if="ed.event.route" @click="tableRouteClick(ed.event)">{{ ed.event.title }}</a>
                                            <a v-else :href="getEventUrl(ed.event)" :title="`Open event ${ed.event.id} on Strava`" target="strava">{{ ed.event.title }}</a>
                                            <v-icon color="primary" small v-if="ed.event.route">mdi-download</v-icon>
                                        </td>
                                        <td class="pt-2 pb-2 text-center">
                                            {{ getDistance(ed.event) }}
                                            <br />
                                            {{ getEstimatedTime(ed.event) }}
                                        </td>
                                        <td class="pt-2 pb-2 text-center">
                                            <template v-if="ed.event.route || ed.event.komootRoute">
                                                <v-progress-circular class="mr-1 mt-n1" size="16" width="2" indeterminate v-if="loadingWeather"></v-progress-circular>
                                                <template v-else-if="ed.weather.length == 0">-</template>
                                                <div v-else>
                                                    <template v-for="weather in ed.weather">
                                                        {{ weather.icon }}
                                                    </template>
                                                </div>
                                            </template>
                                            <template v-else>-</template>
                                        </td>
                                        <td class="pt-2 pb-2 text-center">
                                            <v-icon class="mt-n1" v-if="ed.event.joined">mdi-check-circle</v-icon>
                                            <span v-else>-</span>
                                        </td>
                                    </tr>
                                </tbody>
                            </v-simple-table>
                            <div class="mt-1" v-else>
                                <div class="text-truncate mt-3" v-for="ed in eventDates" :key="ed.date + ed.event.id">
                                    <v-icon class="mt-n1 mr-1" small>{{ getSportIcon(ed.event.type) }}</v-icon>
                                    <span class="mr-2">{{ $dayjs(ed.date).format("ddd, DD MMM YYYY, HH:mm") }}</span>
                                    <v-icon v-if="ed.event.joined" small>mdi-check-circle</v-icon>
                                    <span class="ml-1 float-right">{{ ed.weather.map((w) => w.icon).join(" ") }}</span>
                                    <br />
                                    <a v-if="ed.event.route" @click="tableRouteClick(ed.event)">{{ ed.event.title }}</a>
                                    <a v-else :href="getEventUrl(ed.event)" :title="`Open event ${ed.event.id} on Strava`" target="strava">{{ ed.event.title }}</a>
                                    <br />
                                    <v-chip class="mr-1" v-if="ed.event.route || ed.event.komootRoute" x-small>{{ getDistance(ed.event) }}</v-chip>
                                    <v-chip class="mr-1" v-if="ed.event.route || ed.event.komootRoute" x-small>{{ getEstimatedTime(ed.event) }}</v-chip>
                                    <v-divider class="mt-1 mb-1"></v-divider>
                                </div>
                            </div>
                            <div class="text-center text-md-left mt-3">
                                <v-btn color="primary" title="Download routes" @click.stop="showDownloadDialog" :disabled="!routeIds || !user.isPro" small rounded>
                                    <v-icon left>mdi-folder-download</v-icon>
                                    {{ !routeIds ? "No routes to download" : !user.isPro ? "Download routes (PRO only)" : "Download routes" }}
                                </v-btn>
                            </div>
                            <div class="mt-5">
                                Showing club events for the next {{ days }} days.<br />
                                Weather forecast only for events happening in the next {{ weatherDays }} days.
                            </div>
                        </template>
                        <div v-else>
                            <p>Oh, crap... your clubs have no upcoming events planned in the next {{ days }} days.</p>
                            <v-alert border="top" color="accent" class="mb-0" v-if="!user.isPro">
                                <div>PRO accounts can access up to the next {{ $store.state.proPlanDetails.futureCalendarDays }} days on the calendar!</div>
                                <v-btn color="primary" class="mt-4" to="/billing" title="Subscribe to get a PRO account!" rounded nuxt>
                                    <v-icon left>mdi-credit-card</v-icon>
                                    Subscribe to PRO
                                </v-btn>
                            </v-alert>
                        </div>
                    </div>
                </v-card-text>
            </v-card>

            <v-dialog v-model="downloadDialog" width="440" overlay-opacity="0.95">
                <v-card>
                    <v-toolbar color="primary">
                        <v-toolbar-title>Download routes</v-toolbar-title>
                        <v-spacer></v-spacer>
                        <v-toolbar-items>
                            <v-btn icon @click.stop="hideDownloadDialog">
                                <v-icon>mdi-close</v-icon>
                            </v-btn>
                        </v-toolbar-items>
                    </v-toolbar>
                    <v-card-text>
                        <p class="mt-2">A total of {{ routeIds ? routeIds.length : 0 }} GPX routes for your upcoming events will be fetched from Strava and compressed into a single ZIP file.</p>
                        <p class="mt-1">Komoot routes are not supported.</p>
                        <div class="text-right">
                            <v-spacer></v-spacer>
                            <v-btn class="mr-2" color="grey" title="Cancel and do not reset" @click.stop="hideDownloadDialog" text rounded>
                                <v-icon left>mdi-cancel</v-icon>
                                Cancel
                            </v-btn>
                            <v-btn color="primary" title="Download ZIP with GPX routes" @click="downloadRoutes" rounded>
                                <v-icon left>mdi-folder-download</v-icon>
                                Download
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
            loadingWeather: true,
            weatherDays: 5,
            map: null,
            events: null,
            eventDates: [],
            eventObjects: {},
            selectedEvent: null,
            currentPosition: null,
            downloadDialog: false
        }
    },
    computed: {
        days() {
            return this.user.isPro ? 10 : this.$store.state.freePlanDetails.futureCalendarDays
        },
        routeIds() {
            if (!this.events || this.events.length == 0) return null
            return this.events.filter((e) => e.route).map((e) => e.route.idString)
        }
    },
    async mounted() {
        try {
            const prepareMap = () => {
                const eventDates = []
                this.events.forEach((e) => e.dates.forEach((d) => eventDates.push({date: d, event: e, weather: []})))
                this.eventDates = _.sortBy(eventDates, "date")

                if (typeof window !== "undefined" && !window.google) {
                    window.initUpcomingEventsMap = () => this.loadMap()

                    const mapScript = document.createElement("script")
                    mapScript.async = true
                    mapScript.defer = true
                    mapScript.src = "https://maps.googleapis.com/maps/api/js?key=AIzaSyC0cBXUmFBGn_HNlH06F2LM_WG2YWZGKe0&libraries=geometry&callback=initUpcomingEventsMap"
                    mapScript.onerror = (ex) => this.$webError(this, "UpcomingEventsMap.mounted", ex)
                    document.querySelector("head").appendChild(mapScript)
                } else {
                    this.loadMap()
                }

                this.loading = false
            }

            // Helper to get events from the server.
            const getEvents = async () => {
                if (this.events) return

                const queryCoords = this.currentPosition ? `&coordinates=${this.currentPosition.latitude},${this.currentPosition.longitude}` : ""
                const events = await this.$axios.$get(`/api/strava/${this.user.id}/clubs/upcoming-events?days=${this.days}${queryCoords}`)
                this.events = events
                this.$setLocalStorage("clubs-upcoming-events", events, this.user.isPro ? 900 : 3600)

                prepareMap()
            }

            // Helper to get current position from the Browser.
            const getCurrentPosition = () => {
                return new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(
                        (position) => resolve(position),
                        (error) => reject(error),
                        {maximumAge: 86400000, timeout: 5000, enableHighAccuracy: false}
                    )
                })
            }

            // Try getting the current position.
            try {
                const position = await getCurrentPosition()
                this.mapSetPosition(position)
            } catch (error) {
                console.error(error)
            }

            // Check if events are cached on local storage. If so, prepare the map straight away.
            const cachedEvents = this.$getLocalStorage("clubs-upcoming-events")
            if (cachedEvents) {
                this.events = cachedEvents
                prepareMap()
            } else {
                getEvents()
            }
        } catch (ex) {
            this.$webError(this, "UpcomingEventsMap.mounted", ex)
        }
    },
    methods: {
        async loadMap() {
            try {
                if (this.events.length == 0) return

                // 80ms delay to make sure the Vue rendering is ready.
                await new Promise((r) => setTimeout(r, 80))

                this.loading = false
                this.map = new google.maps.Map(this.$refs.googlemaps, {
                    gestureHandling: "greedy",
                    fullscreenControl: false,
                    zoom: 9,
                    center: {lat: 0, lng: 0}
                })

                if (this.currentPosition) {
                    this.mapSetPosition()
                }

                const routeColors = ["#FFFF11", "#FF66CC", "#1133AA", "#00AA11", "#0011FF", "#AA1111", "#FF11FF", "#FF1100"]

                let zIndex = 10
                for (let e of this.events) {
                    const color = routeColors.pop()

                    try {
                        this.eventObjects[e.id] = {zIndex: zIndex}

                        if (e.route && e.route.polyline) {
                            this.mapDrawRoute(e, color)
                            zIndex--
                        }

                        if (e.komootRoute && e.komootRoute.locationStart) {
                            e.position = {lat: e.komootRoute.locationStart[0], lng: e.komootRoute.locationStart[1]}
                        }
                        if (!e.position) {
                            e.position = await this.loadAddressLocation(e)
                        }
                        if (!e.position) {
                            e.noMap = true
                            continue
                        }
                        if (!this.currentPosition) {
                            this.mapSetPosition({latitude: e.position.lat(), longitude: e.position.lng()})
                        }

                        this.mapCreateMarker(e, color)
                    } catch (eventEx) {
                        console.error("UpcomingEventsMap.loadMap.events", e.id, eventEx)
                    }
                }

                this.loadWeather()
            } catch (ex) {
                this.$webError(this, "UpcomingEventsMap.loadMap", ex)
            } finally {
                this.loading = false
            }

            google.maps.event.trigger(this.map, "resize")
        },
        async loadAddressLocation(e) {
            return new Promise((resolve, reject) => {
                if (!e.address || e.address.trim() == "") resolve(null)

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
        async loadWeather() {
            try {
                const query = []

                // Iterate the events to build the query data, using the format "eventId-start/mid/end:coordinates:timestamp".
                for (let ed of this.eventDates) {
                    ed.weather = []

                    const event = ed.event
                    const route = event.route || event.komootRoute || null

                    // Abort if event has no route or is not happening within the next few days.
                    if (!route) {
                        continue
                    }
                    if (this.$dayjs().add(this.weatherDays, "days").isBefore(ed.date)) {
                        continue
                    }

                    const eDate = this.$dayjs(ed.date)
                    const timestamp = Math.round(eDate.utc().unix())

                    if (route.locationStart) {
                        query.push(`${event.id}:${route.locationStart.join(",")}:${timestamp}`)
                    }
                    // Mid point weather will only be fetched for events longer than 3 hours.
                    if (route.locationMid && route.estimatedTime >= 10800) {
                        query.push(`${event.id}:${route.locationMid.join(",")}:${timestamp}`)
                    }
                    // End point weather will only be fetched for events longer than 1.5 hours.
                    if (route.locationEnd && route.estimatedTime >= 5400) {
                        query.push(`${event.id}:${route.locationEnd.join(",")}:${timestamp}`)
                    }
                }

                // Stop here if no weather to be fetched.
                if (query.length == 0) return

                // Fetch weather for all relevant event locations and timestamps. Query data separated by a | pipe.
                const weatherForecasts = await this.$axios.$get(`/api/weather/${this.user.id}/multi-forecast?data=${query.join("|")}`)

                // Here we translate the result back to start / mid / end forecasts.
                for (let data of weatherForecasts) {
                    if (!data.forecast) continue
                    try {
                        const coordinateString = data.coordinates.join(",")
                        const eventDate = this.eventDates.find((ed) => {
                            const route = ed.event.route || ed.event.komootRoute || {}
                            const isStart = route.locationStart && route.locationStart.join(",") == coordinateString
                            const isMid = route.locationMid && route.locationMid.join(",") == coordinateString
                            const isEnd = route.locationEnd && route.locationEnd.join(",") == coordinateString
                            return Math.round(this.$dayjs(ed.date).unix()) == data.timestamp && (isStart || isMid || isEnd)
                        })

                        eventDate.weather.push(data.forecast)
                    } catch (forecastEx) {
                        console.error(forecastEx)
                    }
                }
            } catch (ex) {
                this.$webError(this, "UpcomingEventsMap.loadWeather", ex)
            } finally {
                this.loadingWeather = false
            }
        },
        mapCreateMarker(e, color) {
            try {
                const svgMarker = {
                    path: "M0-48c-9.8 0-17.7 7.8-17.7 17.4 0 15.5 17.7 30.6 17.7 30.6s17.7-15.4 17.7-30.6c0-9.6-7.9-17.4-17.7-17.4z",
                    fillColor: color,
                    fillOpacity: 1,
                    strokeWeight: 0,
                    rotation: 0,
                    scale: 0.7
                }

                const marker = new google.maps.Marker({
                    position: e.position,
                    icon: svgMarker,
                    title: e.title,
                    map: this.map
                })
                marker.addListener("click", () => this.mapMarkerClick(e))
                marker.addListener("mouseover", () => this.mapHighlightRoute(e, true))
                marker.addListener("mouseout", () => this.mapHighlightRoute(e, false))

                // Info window.
                const infoWindow = new google.maps.InfoWindow({
                    content: `<div class="black--text">
                                <h3 class="mb-2">${e.title}</h3>
                                <div>Next: ${this.$dayjs(e.dates[0]).format("lll")}</div>
                                <div>Distance: ${this.getDistance(e)}</div>
                                <div>Duration: ${this.getEstimatedTime(e)}</div>
                                <div class="mt-3 font-weight-bold"><a href="${this.getEventUrl(e)}" target="strava">More info...</a></div>
                              </div>`
                })
                infoWindow.addListener("closeclick", () => {
                    this.selectedEvent = null
                })

                this.eventObjects[e.id].marker = marker
                this.eventObjects[e.id].infoWindow = infoWindow
            } catch (ex) {
                console.error("UpcomingEventsMap.mapCreateMarker", e.id, ex)
            }
        },
        mapDrawRoute(e, color) {
            try {
                const points = google.maps.geometry.encoding.decodePath(e.route.polyline)
                const poly = new google.maps.Polyline({
                    path: points,
                    strokeColor: color,
                    strokeOpacity: 0.55,
                    strokeWeight: 4,
                    zIndex: this.eventObjects[e.id].zIndex,
                    map: this.map
                })

                // Append start of the route as the event position.
                e.position = points[0]

                this.eventObjects[e.id].polyline = poly
            } catch (ex) {
                console.error("UpcomingEventsMap.mapDrawRoute", e.id, ex)
            }
        },
        mapSetPosition(position) {
            if (position) {
                this.currentPosition = position.coords || position
            }

            if (this.map && this.currentPosition) {
                this.map.setCenter(new google.maps.LatLng(this.currentPosition.latitude, this.currentPosition.longitude))
            }
        },
        mapSetBounds(e) {
            if (!this.eventObjects[e.id].polyline) return

            const bounds = new google.maps.LatLngBounds()
            const points = this.eventObjects[e.id].polyline.getPath().getArray()
            points.forEach((p) => bounds.extend(p))
            this.map.fitBounds(bounds)
        },
        mapHighlightRoute(e, highlight, clicked) {
            if (!this.eventObjects[e.id].polyline) return

            if (clicked) {
                this.eventObjects[e.id].polyline.setOptions({strokeOpacity: 0.95, strokeWeight: 6, zIndex: 20})
            } else if (highlight) {
                this.eventObjects[e.id].polyline.setOptions({strokeOpacity: 0.85, strokeWeight: 5, zIndex: 19})
            } else if (!this.selectedEvent || this.selectedEvent.id != e.id) {
                this.eventObjects[e.id].polyline.setOptions({strokeOpacity: 0.55, strokeWeight: 4, zIndex: this.eventObjects[e.id].zIndex})
            }
        },
        mapRouteSelect(e) {
            const previousEvent = this.selectedEvent || null
            this.selectedEvent = e

            if (previousEvent && previousEvent.id == e.id) {
                this.selectedEvent = null
                this.mapHighlightRoute(previousEvent, false)
            } else {
                this.selectedEvent = e
                this.mapHighlightRoute(e, true, true)
                this.mapSetBounds(e)

                if (previousEvent) {
                    this.mapHighlightRoute(previousEvent, false)
                    this.eventObjects[previousEvent.id].infoWindow.close()
                }
            }

            this.mapHighlightRoute(e, true, true)
        },
        mapMarkerClick(e) {
            const previousEvent = this.selectedEvent || null
            const marker = this.eventObjects[e.id].marker
            const infoWindow = this.eventObjects[e.id].infoWindow

            this.mapRouteSelect(e)
            this.map.setCenter(marker.getPosition())

            infoWindow.open({
                anchor: marker,
                map: this.map
            })
        },

        tableRouteClick(e) {
            this.mapRouteSelect(e)
        },
        getDistance(event) {
            if (!event.route && !event.komootRoute) return "-"
            const distance = event.route ? event.route.distance : event.komootRoute.distance
            const suffix = this.$store.state.user.profile.units == "imperial" ? " mi" : " km"
            return `${distance}${suffix}`
        },
        getEstimatedTime(event) {
            if (!event.route && !event.komootRoute) return "-"
            const seconds = event.route ? event.route.estimatedTime : event.komootRoute.estimatedTime
            const baseDuration = this.$dayjs.duration(seconds * 1100)
            const toQuarter = 15 - (baseDuration.minutes() % 15)
            const duration = baseDuration.add(toQuarter, "minutes")
            return `${duration.days() * 24 + duration.hours()}:${duration.format("mm")} h`
        },
        getEventUrl(e) {
            return `https://www.strava.com/clubs/${e.club.id}/group_events/${e.id}`
        },
        showDownloadDialog() {
            this.downloadDialog = true
        },
        hideDownloadDialog() {
            this.downloadDialog = false
        },
        downloadRoutes() {
            this.downloadDialog = false
            window.open(`/api/strava/${this.user.id}/${this.user.urlToken}/routes.zip?routes=${this.routeIds.join(",")}`, "gpx-download")
        }
    }
}
</script>
