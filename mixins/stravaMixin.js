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
            if (sportType == "Ride" || sportType == "VirtualRide") return "mdi-bike"
            if (sportType == "Run" || sportType == "VirtualRun") return "mdi-run"
            if (sportType == "Walk") return "mdi-walk"
            if (sportType == "Golf") return "mdi-golf"
            if (sportType == "Skateboard") return "mdi-skateboard"
            if (sportType == "Snowboard") return "mdi-snowboard"
            if (sportType == "Swim") return "mdi-swim"
            if (sportType == "Yoga") return "mdi-yoga"
            if (sportType == "Sail") return "mdi-sail-boat"
            if (sportType == "IceSkate") return "mdi-skate"
            if (sportType == "CrossFit" || sportType == "WeightTraining") return "mdi-weight-lifter"
            if (sportType.indexOf("Ski") > 0) return "mdi-ski"
            return "mdi-dumbbell"
        },
        // Convert sport type enum to readable text (with spaces).
        getSportName(enumValue) {
            return enumValue.replace(/([A-Z])/g, " $1").trim()
        }
    }
}
