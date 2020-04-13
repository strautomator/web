export default {
    methods: {
        isCountryAvailable(country) {
            const countryList = ["at", "be", "bg", "hk", "cz", "dk", "eu", "ee", "fi", "fr", "de", "gr", "hu", "il", "is", "it", "lv", "lt", "lu", "mt", "nl", "no", "pl", "pt", "ro", "sk", "si", "es", "se", "ch", "uk"]
            return countryList.indexOf(country) < 0
        }
    }
}
