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
        }
    }
}
