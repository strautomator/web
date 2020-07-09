export default {
    methods: {
        getGearType(gear) {
            return gear.id.substring(0, 1) == "b" ? "Bike" : "Shoes"
        },
        getGearIcon(gear) {
            if (gear.id.substring(0, 1) == "b") return "mdi-bike"
            else return "mdi-shoe-print"
        },
        getHours(seconds) {
            if (!seconds) return 0
            return (seconds / 3600).toFixed(1).replace(".0", "")
        },
    }
}
