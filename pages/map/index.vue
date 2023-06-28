<template>
    <v-layout column>
        <v-container fluid>
            <h1>Upcoming Events Map</h1>
            <v-card class="mt-5" v-if="user" outlined>
                <v-card-text>
                    <div class="mt-1 text-center text-md-left" v-if="loading">
                        <v-progress-circular class="mr-1 mt-n1" size="16" width="2" indeterminate></v-progress-circular>
                        Loading upcoming club events, weather and routes, please wait, this can take up to 2 minutes...
                    </div>
                    <div class="googlemaps-canvas" ref="googlemaps" v-if="events && events.length > 0"></div>
                    <div v-if="!loading && events">
                        <v-sheet class="d-flex flex-column flex-md-row pl-2 pt-3 pt-md-4" color="accent">
                            <div class="flex-grow-0 ma-0 pa-0">
                                <v-checkbox v-model="mapOptionTraffic" class="ma-0 pa-0" label="Show traffic and road blocks" dense />
                            </div>
                            <div class="flex-grow-1 ma-0 pa-0 mt-n2 mt-md-0 ml-md-6 mb-n2">
                                <v-checkbox v-model="mapOptionBicycling" class="ma-0 pa-0" label="Show cycling lanes and paths" dense />
                            </div>
                        </v-sheet>

                        <template v-if="events.length > 0">
                            <v-simple-table v-if="$breakpoint.mdAndUp">
                                <thead>
                                    <tr>
                                        <th></th>
                                        <th>Date (next {{ days }} days)</th>
                                        <th>Title</th>
                                        <th class="text-center">Details</th>
                                        <th class="text-center">Weather</th>
                                        <th class="text-center">Joined</th>
                                        <th class="text-right">Map</th>
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
                                            <a @click="tableRouteClick(ed.event)" @mouseover="mapHighlightRoute(ed.event, true)" @mouseout="mapHighlightRoute(ed.event, false)">{{ ed.event.title }}</a>
                                            <v-icon color="primary" small v-if="ed.event.route">mdi-download</v-icon>
                                        </td>
                                        <td class="pt-2 pb-2 text-center">
                                            {{ getDistance(ed.event) }}
                                            <br />
                                            {{ getEstimatedHours(ed.event) }}
                                        </td>
                                        <td class="pt-2 pb-2 text-center">
                                            <template v-if="ed.event.route">
                                                <v-progress-circular class="mr-1 mt-n1" size="16" width="2" indeterminate v-if="loadingWeather"></v-progress-circular>
                                                <template v-else-if="ed.weather.length == 0">-</template>
                                                <div v-else>
                                                    <template v-for="icon in ed.weatherIcons">
                                                        {{ icon }}
                                                    </template>
                                                    <div class="text-caption">
                                                        <template v-if="ed.minTemperature == ed.maxTemperature">{{ ed.minTemperature }}</template>
                                                        <template v-else>{{ ed.minTemperature }} - {{ ed.maxTemperature }}</template>
                                                    </div>
                                                </div>
                                            </template>
                                            <template v-else>-</template>
                                        </td>
                                        <td class="pt-2 pb-2 text-center">
                                            <v-icon class="mt-n1" v-if="ed.event.joined && ed.date == ed.event.dates[0]">mdi-check-circle</v-icon>
                                            <span v-else>-</span>
                                        </td>
                                        <td class="pt-2 pb-2">
                                            <v-checkbox class="float-right mr-n1 mt-1" title="Visible on the map" v-model="ed.event.visible" :disabled="ed.event.noMap" @click="tableRouteToggle(ed.event)" dense />
                                        </td>
                                    </tr>
                                </tbody>
                            </v-simple-table>
                            <div class="mt-4" v-else>
                                <div class="text-truncate mt-3" v-for="ed in eventDates" :key="ed.date + ed.event.id">
                                    <v-icon class="mt-n1 mr-1" small>{{ getSportIcon(ed.event.type) }}</v-icon>
                                    <span class="mr-2">{{ $dayjs(ed.date).format("ddd, DD MMM YYYY, HH:mm") }}</span>
                                    <v-icon v-if="ed.event.joined" small>mdi-check-circle</v-icon>
                                    <v-progress-circular class="mr-1 mt-n1" size="16" width="2" indeterminate v-if="loadingWeather"></v-progress-circular>
                                    <div class="ml-1 float-right text-right" v-else>
                                        <span>{{ ed.weatherIcons.join(" ") }}</span>
                                        <div class="text-caption">
                                            <template v-if="ed.minTemperature == ed.maxTemperature">{{ ed.minTemperature }}</template>
                                            <template v-else>{{ ed.minTemperature }} - {{ ed.maxTemperature }}</template>
                                        </div>
                                        <div>
                                            <v-checkbox class="float-right mr-n3 mt-n1" title="Visible on the map" v-model="ed.event.visible" :disabled="ed.event.noMap" @click="tableRouteToggle(ed.event)" dense />
                                        </div>
                                    </div>
                                    <br />
                                    <a @click="tableRouteClick(ed.event)">{{ ed.event.title }}</a>
                                    <br />
                                    <v-chip class="mr-1" v-if="ed.event.route" x-small>{{ getDistance(ed.event) }}</v-chip>
                                    <v-chip class="mr-1" v-if="ed.event.route" x-small>{{ getEstimatedHours(ed.event) }}</v-chip>
                                    <v-divider class="mt-3 mb-1"></v-divider>
                                </div>
                            </div>
                            <div class="text-center text-md-left mt-4 mt-md-3">
                                <v-btn color="primary" title="Download routes" @click.stop="showDownloadDialog" :disabled="!routeIds || !user.isPro" small rounded>
                                    <v-icon left>mdi-folder-download</v-icon>
                                    {{ !routeIds ? "No routes to download" : !user.isPro ? "Download routes (PRO only)" : "Download routes" }}
                                </v-btn>
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
import mapStyles from "~/plugins/mapstyles.js"

let zIndexMax = 100
const fullscreenEvents = ["fullscreenchange", "webkitfullscreenchange", "mozfullscreenchange"]
const mapRouteColors = ["#e31a1c", "#ff7f00", "#6a3d9a", "#1f78b4", "#fb9a99", "#fdbf6f", "#cab2d6", "#b15928", "#a6cee3", "#33a02c"]
const mapStrokeOpacity = {
    default: 0.75,
    highlight: 0.95,
    click: 1
}
const mapStrokeWeight = {
    default: 5,
    highlight: 7,
    click: 8
}

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
            fullscreen: false,
            weatherDays: 5,
            events: null,
            eventDates: [],
            eventObjects: {},
            selectedEvent: null,
            map: null,
            mapInfoWindow: null,
            mapBicyclingLayer: null,
            mapTrafficLayer: null,
            mapOptionBicycling: false,
            mapOptionTraffic: false,
            mapFullscreenListener: false,
            currentPosition: null,
            downloadDialog: false
        }
    },
    computed: {
        days() {
            return this.user.isPro ? 10 : 5
        },
        routeIds() {
            if (!this.events || this.events.length == 0) return null
            return this.events.filter((e) => e.route).map((e) => e.route.idString)
        }
    },
    watch: {
        mapOptionTraffic: function (newVal, oldVal) {
            this.mapTrafficLayer.setMap(newVal ? this.map : null)
        },
        mapOptionBicycling: function (newVal, oldVal) {
            this.mapBicyclingLayer.setMap(newVal ? this.map : null)
        }
    },
    beforeUnmount() {
        fullscreenEvents.map((e) => document.removeEventListener(e, this.onFullScreen))
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
                events.forEach((e) => (e.visible = true))
                this.events = events
                this.$setLocalStorage("clubs-upcoming-events", events, this.user.isPro ? 600 : 1800)

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
                cachedEvents.forEach((e) => (e.visible = true))
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

                // 90ms delay to make sure the Vue rendering is ready.
                await new Promise((r) => setTimeout(r, 90))

                this.loading = false

                const bikeLightStyle = new google.maps.StyledMapType(mapStyles.bikeLight, {name: "Bike Light"})

                this.map = new google.maps.Map(this.$refs.googlemaps, {
                    gestureHandling: "greedy",
                    fullscreenControl: true,
                    zoom: 9,
                    center: {lat: 0, lng: 0},
                    mapTypeControlOptions: {
                        mapTypeIds: ["roadmap", "satellite", "hybrid", "terrain", "bike_light"]
                    }
                })
                this.map.mapTypes.set("bike_light", bikeLightStyle)

                // Fullscreen toggle.
                fullscreenEvents.map((e) => document.addEventListener(e, this.onFullScreen))

                if (this.currentPosition) {
                    this.mapSetPosition()
                }

                // Setup extra map layers.
                this.mapBicyclingLayer = new google.maps.BicyclingLayer()
                this.mapTrafficLayer = new google.maps.TrafficLayer()

                // Iterate events and add their objects to the map.
                let zIndex = zIndexMax
                const routeColors = _.cloneDeep(mapRouteColors)
                const sortedEvents = _.sortBy(this.events, (e) => (e.route?.polyline ? 0 : 1))
                for (let e of sortedEvents) {
                    const color = e.route?.polyline ? routeColors.shift() : routeColors.pop()

                    try {
                        this.eventObjects[e.id] = {zIndex: zIndex}

                        if (e.route?.polyline) {
                            this.mapDrawRoute(e, color)
                        } else if (e.route?.locationStart) {
                            e.position = {lat: e.route.locationStart[0], lng: e.route.locationStart[1]}
                        }
                        if (!e.position) {
                            e.position = await this.loadAddressLocation(e)
                        }
                        if (!e.position) {
                            e.noMap = true
                            e.visible = false
                            continue
                        } else {
                            e.visible = true
                        }

                        if (!this.currentPosition) {
                            this.mapSetPosition({latitude: e.position.lat(), longitude: e.position.lng()})
                        }

                        this.mapCreateMarker(e, color)
                        zIndex -= 3
                    } catch (eventEx) {
                        console.error("UpcomingEventsMap.loadMap.events", e.id, eventEx)
                    }
                }

                // Info window.
                this.mapInfoWindow = new google.maps.InfoWindow({
                    content: `<div class="black--text">Loading...</div>`,
                    pixelOffset: new google.maps.Size(0, 222)
                })
                this.mapInfoWindow.addListener("closeclick", () => {
                    const evObj = this.eventObjects[this.selectedEvent.id]

                    if (evObj.polyline) {
                        evObj.polyline.shadow.setOptions({strokeOpacity: mapStrokeOpacity.default, strokeWeight: mapStrokeWeight.default})
                        evObj.polyline.main.setOptions({strokeOpacity: mapStrokeOpacity.default, strokeWeight: mapStrokeWeight.default})
                    }
                    this.selectedEvent = null
                })

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
                const idDateFormat = "MMDD-HHmm"
                const query = []

                // Iterate the events to build the query data, using the format "eventId-start/mid/end:coordinates:timestamp".
                for (let ed of this.eventDates) {
                    ed.weather = []
                    ed.weatherIcons = []

                    const event = ed.event
                    const route = event.route || null

                    // Abort if event has no route or is not happening within the next few days.
                    if (!route || this.$dayjs().add(this.weatherDays, "days").isBefore(ed.date)) {
                        continue
                    }

                    const eDate = this.$dayjs(ed.date).utc()
                    const timestamp = Math.round(eDate.unix())

                    if (route.locationStart) {
                        query.push(`${event.id}-${eDate.format(idDateFormat)}:${route.locationStart.join(",")}:${timestamp}`)
                    }
                    // Mid point weather will only be fetched for events longer than 3 hours.
                    if (route.locationMid && route.totalTime >= 10800) {
                        query.push(`${event.id}-${eDate.format(idDateFormat)}:${route.locationMid.join(",")}:${timestamp + Math.round(route.totalTime / 2)}`)
                    }
                    // End point weather will only be fetched for events longer than 1.5 hours.
                    if (route.locationEnd && route.totalTime >= 5400) {
                        query.push(`${event.id}-${eDate.format(idDateFormat)}:${route.locationEnd.join(",")}:${timestamp + route.totalTime}`)
                    }
                }

                // Stop here if no weather to be fetched.
                if (query.length == 0) return

                // Fetch weather for all relevant event locations and timestamps. Query data separated by a | pipe.
                const weatherForecasts = await this.$axios.$get(`/api/weather/${this.user.id}/multi-forecast?provider=openmeteo&data=${query.join("|")}`)

                // Here we translate the result back to start / mid / end forecasts.
                for (let data of weatherForecasts) {
                    if (!data.forecast) continue
                    try {
                        const coordinateString = data.coordinates.join(",")
                        const eventDate = this.eventDates.find((ed) => data.id == `${ed.event.id}-${this.$dayjs(ed.date).utc().format(idDateFormat)}`)

                        if (eventDate) {
                            eventDate.weather.push(data.forecast)

                            if (!eventDate.weatherIcons.includes(data.forecast.icon)) {
                                eventDate.weatherIcons.push(data.forecast.icon)
                            }
                            if (!eventDate.minTemperature || data.forecast.temperature < eventDate.minTemperature) {
                                eventDate.minTemperature = data.forecast.temperature
                            }
                            if (!eventDate.maxTemperature || data.forecast.temperature > eventDate.maxTemperature) {
                                eventDate.maxTemperature = data.forecast.temperature
                            }
                        }
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
        onFullScreen() {
            this.fullscreen = document["fullScreen"] || document["mozFullScreen"] || document["webkitIsFullScreen"] || false
        },
        mapCreateMarker(e, color) {
            try {
                const svgPath = "M0-48c-9.8 0-17.7 7.8-17.7 17.4 0 15.5 17.7 30.6 17.7 30.6s17.7-15.4 17.7-30.6c0-9.6-7.9-17.4-17.7-17.4z"
                const svgShadow = {
                    path: svgPath,
                    strokeColor: "white",
                    strokeWeight: 3,
                    rotation: 0,
                    scale: 0.65
                }
                const svgMain = {
                    path: svgPath,
                    fillColor: color,
                    fillOpacity: 1,
                    strokeWeight: 0,
                    rotation: 0,
                    scale: 0.65
                }

                const dropShadowMarker = new google.maps.Marker({
                    icon: {
                        url: "/images/map/shadow.png",
                        size: new google.maps.Size(37, 34),
                        origin: new google.maps.Point(0, 0),
                        anchor: new google.maps.Point(10, 34)
                    },
                    position: e.position,
                    zIndex: 0,
                    map: this.map
                })
                const shadowMarker = new google.maps.Marker({
                    position: e.position,
                    icon: svgShadow,
                    title: e.title,
                    zIndex: this.eventObjects[e.id].zIndex - 1,
                    map: this.map
                })
                const mainMarker = new google.maps.Marker({
                    position: e.position,
                    icon: svgMain,
                    title: e.title,
                    zIndex: this.eventObjects[e.id].zIndex,
                    map: this.map
                })

                mainMarker.addListener("click", () => this.mapMarkerClick(e))
                mainMarker.addListener("mouseover", () => this.mapHighlightRoute(e, true))
                mainMarker.addListener("mouseout", () => this.mapHighlightRoute(e, false))

                const markerObj = {main: mainMarker, shadow: shadowMarker}
                this.eventObjects[e.id].marker = markerObj
            } catch (ex) {
                console.error("UpcomingEventsMap.mapCreateMarker", e.id, ex)
            }
        },
        mapDrawRoute(e, color) {
            try {
                const evObj = this.eventObjects[e.id]

                const lineSymbol = {
                    path: "M 0,0 5,15 -5,15 0,0 z",
                    fillColor: color,
                    fillOpacity: mapStrokeOpacity.default,
                    strokeColor: "black",
                    strokeWeight: 1,
                    scale: 0.5
                }

                const points = google.maps.geometry.encoding.decodePath(e.route.polyline)
                const polyShadow = new google.maps.Polyline({
                    path: points,
                    strokeColor: "white",
                    strokeOpacity: mapStrokeOpacity.default,
                    strokeWeight: mapStrokeWeight.default + 2,
                    zIndex: evObj.zIndex - 1,
                    map: this.map
                })
                const polyMain = new google.maps.Polyline({
                    path: points,
                    strokeColor: color,
                    strokeOpacity: mapStrokeOpacity.default,
                    strokeWeight: mapStrokeWeight.default,
                    zIndex: evObj.zIndex,
                    icons: [
                        {
                            icon: lineSymbol,
                            repeat: "80px",
                            offset: "100%"
                        }
                    ],
                    map: this.map
                })

                // Append start of the route as the event position.
                e.position = points[0]

                this.eventObjects[e.id].polyline = {main: polyMain, shadow: polyShadow}
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
            if (!this.eventObjects[e.id].polyline || this.fullscreen) return

            const bounds = new google.maps.LatLngBounds()
            const points = this.eventObjects[e.id].polyline.main.getPath().getArray()
            points.forEach((p) => bounds.extend(p))
            this.map.fitBounds(bounds)
        },
        mapHighlightRoute(e, highlight, clicked) {
            if (!this.eventObjects[e.id].polyline) return

            const evObj = this.eventObjects[e.id]
            if (!e.visible) return

            let mainOptions = null
            let shadowOptions = null

            if (clicked) {
                mainOptions = {strokeOpacity: mapStrokeOpacity.click, strokeWeight: mapStrokeWeight.click, zIndex: zIndexMax}
                shadowOptions = {strokeOpacity: mapStrokeOpacity.click, strokeWeight: mapStrokeWeight.click + 2, zIndex: zIndexMax - 1}
            } else if (highlight) {
                mainOptions = {strokeOpacity: mapStrokeOpacity.highlight, strokeWeight: mapStrokeWeight.highlight, zIndex: zIndexMax - 2}
                shadowOptions = {strokeOpacity: mapStrokeOpacity.highlight, strokeWeight: mapStrokeWeight.highlight + 2, zIndex: zIndexMax - 3}
            } else if (!this.selectedEvent || this.selectedEvent.id != e.id) {
                mainOptions = {strokeOpacity: mapStrokeOpacity.default, strokeWeight: mapStrokeWeight.default, zIndex: evObj.zIndex}
                shadowOptions = {strokeOpacity: mapStrokeOpacity.default, strokeWeight: mapStrokeWeight.default + 2, zIndex: evObj.zIndex - 1}
            }

            if (mainOptions) {
                evObj.polyline.main.setOptions(mainOptions)
                evObj.polyline.shadow.setOptions(shadowOptions)
            }
        },
        mapMarkerClick(e) {
            if (e.noMap) {
                window.open(this.getEventUrl(e), "strava")
                return
            }

            if (!e.visible) {
                this.tableRouteToggle(e, true)
            }

            const previousEvent = this.selectedEvent || null
            const isSameClick = previousEvent?.id == e.id || false
            const evObj = this.eventObjects[e.id]
            const marker = evObj.marker.main

            if (isSameClick) {
                return
            }

            this.selectedEvent = e

            zIndexMax += 3
            evObj.zIndex = zIndexMax
            evObj.marker.main.setOptions({zIndex: zIndexMax})
            evObj.marker.shadow.setOptions({zIndex: zIndexMax - 1})

            if (previousEvent) {
                this.mapHighlightRoute(previousEvent, false)
            }

            this.mapHighlightRoute(e, true, true)
            this.mapSetBounds(e)
            this.map.setCenter(marker.getPosition())

            const evDate = this.eventDates.find((ed) => ed.event.id == e.id)
            const weather = evDate?.weather.map((w) => `${w.temperature} ${w.summary}`) || null

            // If weather is the same at the start and end, only show a single row.
            let htmlWeather
            if (weather?.length > 0) {
                const htmlWeatherSingle = weather[0]
                const htmlWeatherMulti = `Start: ${weather[0]}<br />End: ${weather[weather.length - 1]}`
                htmlWeather = _.uniq(weather).length == 1 ? htmlWeatherSingle : htmlWeatherMulti
            } else {
                htmlWeather = "No weather forecast available"
            }

            this.mapInfoWindow.setContent(`
                <div class="black--text">
                <h3 class="mb-2">${e.title}</h3>
                <div>Next: ${this.$dayjs(_.min(e.dates)).format("lll")}</div>
                <div>Distance: ${this.getDistance(e)}</div>
                <div>Moving time: ${this.getEstimatedHours(e)}</div>
                <div>Total duration: ${this.getEstimatedHours(e, true)}</div>
                <div class="mt-2">${htmlWeather}</div>
                <div class="mt-3 font-weight-bold"><a href="${this.getEventUrl(e)}" target="strava">View on Strava...</a></div>
                </div>`)

            this.mapInfoWindow.open({
                anchor: marker,
                map: this.map
            })
        },
        tableRouteClick(e) {
            this.mapMarkerClick(e)
        },
        tableRouteToggle(e, forceVisible) {
            const evObj = this.eventObjects[e.id]

            if (forceVisible) {
                e.visible = true
            } else if (!e.visible && this.selectedEvent?.id == e.id) {
                this.selectedEvent = null
                this.mapInfoWindow.close()
            }

            const baseOptions = e.visible ? {opacity: 1, zIndex: zIndexMax - 1, strokeOpacity: mapStrokeOpacity.default} : {opacity: 0, zIndex: 0, strokeOpacity: 0}

            for (let obj of [evObj.marker.shadow, evObj.polyline?.shadow]) {
                obj?.setOptions(baseOptions)
            }

            if (baseOptions.zIndex > 0) {
                baseOptions.zIndex++
            }

            for (let obj of [evObj.marker.main, evObj.polyline?.main]) {
                obj?.setOptions(baseOptions)
            }
            if (evObj.polyline) {
                for (let obj of evObj.polyline.main.icons) {
                    obj.strokeOpacity = e.visible ? 1 : 0
                }
                evObj.polyline.main.set("icons", evObj.polyline.main.icons)
            }
        },
        getDistance(event) {
            if (!event.route?.distance) return "-"
            const distance = event.route?.distance
            const suffix = this.$store.state.user.profile.units == "imperial" ? " mi" : " km"
            return `${distance}${suffix}`
        },
        getEstimatedHours(event, total) {
            if (!event.route) return "-"
            const time = total ? event.route?.totalTime : event.route?.movingTime
            const duration = this.$dayjs.duration(time, "seconds")
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
