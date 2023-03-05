import _ from "lodash"

export default {
    data() {
        return {
            stravaStatus: null
        }
    },
    methods: {
        async getStravaStatus() {
            try {
                const res = await fetch("https://status.strava.com/api/v2/summary.json")
                const data = await res.json()

                if (data.incidents && data.incidents.length > 0) {
                    const incident = _.find(data.incidents, (i) => i.impact.toLowerCase() == "critical" || i.impact.toLowerCase() == "major")
                    if (!incident || incident.resolved_at) return

                    this.stravaStatus = incident.name
                }
            } catch (ex) {
                console.error("Could not get API status from Strava", ex)
            }
        },
        // Returns the material icon for the specified sport type.
        getSportIcon(sportType) {
            if (!sportType) return "mdi-incognito"
            if (sportType == "Ride") return "mdi-bike"
            if (sportType == "GravelRide" || sportType == "MountainBikeRide") return "mdi-bicycle"
            if (sportType == "EBikeRide" || sportType == "EMountainBikeRide") return "mdi-bicycle-electric"
            if (sportType == "VirtualRide") return "mdi-bike-fast"
            if (sportType == "Run" || sportType == "TrailRun") return "mdi-run"
            if (sportType == "VirtualRun") return "mdi-run-fast"
            if (sportType == "Walk") return "mdi-walk"
            if (sportType == "Golf") return "mdi-golf"
            if (sportType == "Skateboard") return "mdi-skateboard"
            if (sportType == "Snowboard") return "mdi-snowboard"
            if (sportType == "Swim") return "mdi-swim"
            if (sportType == "Yoga" || sportType == "Pilates") return "mdi-yoga"
            if (sportType == "Sail") return "mdi-sail-boat"
            if (sportType == "IceSkate") return "mdi-skate"
            if (sportType == "Hike") return "mdi-hiking"
            if (sportType == "Tennis") return "mdi-tennis"
            if (sportType == "Racquetball" || sportType == "Squash") return "mdi-racquetball"
            if (sportType == "Badminton") return "mdi-badminton"
            if (sportType == "Rowing" || sportType == "VirtualRow") return "mdi-rowing"
            if (sportType == "CrossFit" || sportType == "WeightTraining") return "mdi-weight-lifter"
            if (sportType.indexOf("Ski") > 0) return "mdi-ski"

            return "mdi-dumbbell"
        },
        // Convert sport type enum to readable text (with spaces).
        getSportName(enumValue) {
            return enumValue.replace(/([A-Z])/g, " $1").trim()
        },
        // Get map of all record icons and their keys.
        getAllRecordIcons() {
            return {
                distance: "mdi-map-marker-distance",
                movingTime: "mdi-clock-outline",
                elevationGain: "mdi-slope-uphill",
                speedMax: "mdi-speedometer",
                speedAvg: "mdi-speedometer-medium",
                hrMax: "mdi-heart-plus",
                hrAvg: "mdi-heart",
                wattsMax: "mdi-lightning-bolt",
                wattsAvg: "mdi-lightning-bolt-outline",
                calories: "mdi-nutrition"
            }
        },
        // Get record icon for the specified field.
        getRecordIcon(field) {
            const icons = this.getAllRecordIcons()
            return icons[field]
        },
        // Helper to get field name from camelCase.
        getFriendlyUpdatedField(field) {
            return field.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())
        },
        // Check if the passed activity has broken a personal record, and returns
        // an array with the record key (field) and its details.
        isActivityRecord(activity) {
            const records = this.$store.state.athleteRecords
            if (!records) return false

            // Find a record with a matching activity ID.
            return records[activity.sportType] ? Object.entries(records[activity.sportType]).find((e) => e[1].activityId == activity.id) : null
        }
    }
}
