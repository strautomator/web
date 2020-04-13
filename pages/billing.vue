<template>
    <v-layout column>
        <v-container>
            <h1>Billing</h1>
            <v-form>
                <p>Hi {{ user.profile.firstName }}!</p>
            </v-form>
            <div v-if="!isPro">
                <p>You're currently using our free version. Subscribe now to a <strong>PRO</strong> account for only {{ price }} EUR / year and enjoy all the extra features!</p>
                <ul class="mb-8">
                    <li>Unlimited automations</li>
                    <li>Unlimited rules per automation</li>
                    <li>Weather data on your activities</li>
                    <li>No automatic links added to activity description</li>
                    <li>More features to some soon!</li>
                </ul>
                <div class="text-center">
                    <form action="https://www.paypal.com/cgi-bin/webscr" method="post" target="_top">
                        <input type="hidden" name="cmd" value="_s-xclick" />
                        <input type="hidden" name="hosted_button_id" value="C35BXTFR2ASFU" />
                        <input type="image" src="/images/paypal-checkout.png" border="0" name="submit" alt="Subscribe now via PayPal!" />
                        <img alt="" border="0" src="https://www.paypalobjects.com/en_US/i/scr/pixel.gif" width="1" height="1" />
                    </form>
                </div>
            </div>
            <div v-else></div>
        </v-container>
    </v-layout>
</template>

<style></style>

<script>
export default {
    authenticated: true,
    head() {
        return {
            title: "Billing"
        }
    },
    async asyncData({$axios, env, error, params, store}) {
        try {
            const now = new Date().getTime() / 1000

            return {
                now: now,
                user: store.state.oauth.user,
                isPro: store.state.oauth.user.dateBilling && store.state.oauth.user.dateBilling > now,
                price: 10
            }
        } catch (ex) {
            error({
                statusCode: 500,
                message: ex.toString()
            })
        }
    }
}
</script>
