export default {
    methods: {
        getGearType(gear) {
            return gear.id.substring(0, 1) == "b" ? "Bike" : "Shoes"
        },
        getGearIcon(gear) {
            if (gear.id.substring(0, 1) == "b") return "mdi-bike"
            else return "mdi-shoe-print"
        },
        getGearHours(seconds) {
            if (!seconds) return 0
            return (seconds / 3600).toFixed(1).replace(".0", "")
        },
        getComponentIcon(comp) {
            const name = comp?.name.toLowerCase().replace(/ /g, "") || ""
            if (name.includes("battery")) return "mdi-battery-70"
            if (name.includes("bearing") || name.includes("headset") || name.includes("bottom bracket")) return "mdi-dots-circle"
            if (name.includes("cassette") || name.includes("drivetrain")) return "mdi-cog-outline"
            if (name.includes("chain")) return "mdi-link"
            if (name.includes("cleat")) return "mdi-shoe-cleat"
            if (name.includes("pedal")) return "mdi-bike-pedal"
            if (name.includes("suspension") || name.includes("hydro")) return "mdi-hydraulic-oil-level"
            if (name.includes("tire") || name.includes("tyre")) return "mdi-tire"
            if (name.includes("oil") || name.includes("wax")) return "mdi-oil"
            if (name.includes("shoe")) return "mdi-shoe-sneaker"
            return "mdi-wrench-cog"
        },
        getDeviceIdName(id) {
            return id
                .split(".")
                .map((v) => v.charAt(0).toUpperCase() + v.slice(1))
                .join(" ")
        },
        getFitDeviceName(id) {
            const user = this.$store.state.user
            return user.fitDeviceNames ? user.fitDeviceNames[id] || "" : ""
        }
    }
}
