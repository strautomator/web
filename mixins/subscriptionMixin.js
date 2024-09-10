export default {
    data() {
        const currency = this.$store.state.expectedCurrency
        let currencySymbol
        if (currency == "CHF") currencySymbol = "₣"
        else if (currency == "EUR") currencySymbol = "€"
        else if (currency == "GBP") currencySymbol = "£"
        else if (currency == "USD") currencySymbol = "$"
        return {
            currency: currency,
            currencySymbol: currencySymbol
        }
    },
    methods: {
        getSubscriptionSource(subscription) {
            if (!subscription) return "?"
            if (subscription.source == "friend") return "Friend"
            else if (subscription.source == "github") return "GitHub"
            else if (subscription.source == "paddle") return "Paddle"
            else if (subscription.source == "paypal") return "PayPal"
            else if (subscription.source == "n26") return "N26"
            else if (subscription.source == "revolut") return "Revolut"
            else if (subscription.source == "amex") return "American Express"
            else if (subscription.source == "traderepublic") return "Trade Republic"
            return "?"
        }
    }
}
