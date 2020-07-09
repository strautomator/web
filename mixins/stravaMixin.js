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
                const issueKeywords = ["garmin", "uploads", "site degraded", "strava degraded", "site outage", "site slowness", "site instability"]

                if (data.incidents && data.incidents.length > 0) {
                    const incident = _.find(data.incidents, (i) => i.impact.toLowerCase() == "critical" || i.impact.toLowerCase() == "major")
                    if (!incident) return

                    const description = incident.name.toLowerCase()

                    for (let keyword of issueKeywords) {
                        if (description.indexOf(keyword) >= 0) {
                            this.stravaStatus = incident.name
                            return
                        }
                    }
                }
            } catch (ex) {
                console.error("Could not get API status from Strava", ex)
            }
        }
    }
}
