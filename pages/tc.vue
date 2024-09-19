<template>
    <v-main fluid>
        <div class="stripe"></div>
        <div class="py-2"></div>

        <v-container class="text-center" fluid>
            <div class="home-wrapper">
                <h1 class="font-weight-light mt-1 mb-2" :class="$breakpoint.mdAndUp ? 'display-1' : 'headline'">Strautomator</h1>
                <h2 class="display-2 font-weight-bold mb-4">Terms and Conditions</h2>

                <v-card color="black" class="mb-2 text-left">
                    <v-card-text>
                        <h4 class="mt-2 mb-6">Policy effective as of September 20th, 2024</h4>
                        <h2 class="mt-2 mb-4">About Strautomator</h2>
                        <p>
                            Please read these Terms of Service ("Terms", "Terms of Service") carefully before using the Strautomator website (the "Service"), available at https://strautomator.com, and operated by Igor Ramadas ("us", "we", or "our").
                        </p>
                        <p>
                            Your access to and use of the Service is conditioned upon your acceptance of and compliance with these Terms. These Terms apply to all visitors, users and others who wish to access or use the Service. By accessing or using
                            the Service you agree to be bound by these Terms. If you disagree with any part of the terms then you do not have permission to access and use the Service.
                        </p>

                        <h2 class="mt-6 mb-4">Privacy</h2>
                        <p>Your privacy is important to us. It is our policy to respect your privacy and comply with any applicable law and regulation regarding any personal information we may collect about you.</p>

                        <h3 class="mt-6 mb-4">Information we collect</h3>
                        <p>
                            Information we collect includes both information you knowingly and actively provide us when using the Service, and any information automatically sent by your devices in the course of accessing the Service.We only ask for
                            personal information when we truly need it to provide a service to you. We collect it by fair and lawful means, with your knowledge and consent. We also let you know why we’re collecting it and how it will be used.
                        </p>

                        <h3 class="mt-1 mb-2">Personal information</h3>
                        <p>We may ask for personal information, or get information provided by 3rd party integrations, which may include one or more of the following:</p>
                        <ul class="mb-6">
                            <li>Email address</li>
                            <li>Social media profile from Strava</li>
                            <li>Addresses used in automations</li>
                            <li>Activity metadata from Strava</li>
                            <li>Activity metadata from Garmin</li>
                            <li>Activity metadata from Wahoo</li>
                            <li>Soundtracks played at Spotify</li>
                        </ul>

                        <h3 class="mt-1 mb-2">Security of your personal information</h3>
                        <p>
                            When we collect and process personal information, and while we retain this information, we will protect it within commercially acceptable means to prevent loss and theft, as well as unauthorized access, disclosure,
                            copying, use, or modification.
                        </p>
                        <p>
                            Although we will do our best to protect the personal information you provide to us, we advise that no method of electronic transmission or storage is 100% secure, and no one can guarantee absolute data security. We will
                            comply with laws applicable to us in respect of any data breach.
                        </p>
                        <p>You are responsible for ensuring the security of your own information within the bounds of our services.</p>

                        <h3 class="mt-1 mb-2">Storage of your personal information</h3>
                        <p>
                            We keep your personal information only for as long as we need to. This time period may depend on what we are using your information for, in accordance with this policy. If your personal information is no longer required,
                            we will delete it within 30 days. Information stored in the server's access log cannot be removed on-demand, but it will be automatically discarded after around 90 days.
                        </p>

                        <h3 class="mt-6 mb-4">Disclosure of information to 3rd parties</h3>
                        <p>We do not disclose any of your personal information to third parties or individuals, except when required by the EU law.</p>
                        <p>If you wish to use AI-based features, some of your activity metadata will be sent out to an external AI provider (Anthropic, Google or OpenAI) for processing.</p>
                        <p>If you subscribe to Strautomator PRO, some of your personal details will be exchanged with our Merchant of Record, Paddle.com.</p>

                        <h3 class="mt-6 mb-4">Controlling your personal information</h3>
                        <p>You always retain the right to withhold personal information from us, with the understanding that your experience of the Service may be affected.</p>
                        <p>
                            If we receive personal information about you from a third party, we will protect it as set out in this policy. If you believe that any information we hold about you is inaccurate, out of date, incomplete, irrelevant, or
                            misleading, please contact us using the details provided in this policy. We will take reasonable steps to correct any information found to be inaccurate, incomplete, misleading, or out of date.
                        </p>
                        <p>
                            If you believe that we have breached a relevant data protection law and wish to make a complaint, please contact us using the details provided at the footer of this policy and provide us with full details of the alleged
                            breach. We will promptly investigate your complaint and respond to you, setting out the outcome of our investigation and the steps we will take to deal with your complaint.
                        </p>

                        <h4 class="mt-1 mb-2">Feature: "Privacy mode"</h4>
                        <p>
                            You have the option on your account preferences to enable a feature called "Privacy mode". If such feature is enabled, Strautomator will anonymize some of your account details and delete some of the processed data related
                            to your account, including but not limited to:
                        </p>
                        <ul class="mb-6">
                            <li>Your Strava username and location</li>
                            <li>Dates when you changed GearWear components</li>
                            <li>Processed activity dates and sport details</li>
                        </ul>
                        <p>Additionally, some of the Service features will be disabled, including:</p>
                        <ul class="mb-6">
                            <li>Processing of activity data via external AI providers</li>
                            <li>Tracking of personal activity records</li>
                            <li>History log for GearWear components</li>
                        </ul>
                        <p>
                            Although the "Privacy mode" will decrease our knowledge about your personal and activity data being transmitted to use by Strava, we confirm that it doesn't fully anonymize your details, and it is still possible to link
                            the information stored by the Service with your account on Strava.
                        </p>

                        <h2 class="mt-6 mb-4">Subscriptions</h2>
                        <p>
                            Some of our services are available only via a subscription plan named Strautomator PRO (the "Subscription"), billed on a monthly or yearly basis, or bought with a single lifetime payment. The Subscription might also be
                            unlocked via affiliate campaigns.
                        </p>
                        <p>The monthly or yearly price of the Subscription varies per country and date. The accepted payment currencies are CHF, EUR, GBP and USD. The Subscription will automatically renew at the end of the billing cycle.</p>
                        <p>Users are free to cancel their existing Subscription at any time, through the "Account" page of the Service. Cancellations are effective immediately, unless stated otherwise during the cancellation process.</p>

                        <h3 class="mt-4 mb-2">Fee changes</h3>
                        <p>At our discretion, we might change the price of the Subscription. Existing subscribers might be affected by the new price, but not before the end of their current billing cycle.</p>
                        <p>Users that have purchased a lifetime subscription are not affected by price changes, and will be able to continue using all the features that were available at the time of the payment.</p>

                        <h3 class="mt-4 mb-2">Updates to the Subscription</h3>
                        <p>
                            New features and integration with new services are not guaranteed in the future. Features that are currently available to Free accounts, might be removed and restricted to users paying for the Subscription. We do not
                            guarantee that existing features of the Subscription will be available in the future. We do, however, remove features only when strictly necessary, for example due to requests made by Strava, or due to legal reasons.
                        </p>
                        <p>We might release special features that require an additional one-time payment in the future.</p>

                        <h3 class="mt-4 mb-2">Suspension of the Subscription</h3>
                        <p>
                            We reserve the right to suspend and cancel any existing Subscription, if we find that it is not being used in accordance with the Terms and Conditions of the Service, or due to legal reasons and sanctions. This applies to
                            all subscriptions, regardless of their payment date or payment method.
                        </p>

                        <h3 class="mt-4 mb-2">Payment processing</h3>
                        <p>
                            Subscription payments are handled by our Merchant of Record, "Paddle.com Market Ltd.". Users that purchased a paid Subscription prior to September 14th, 2024, are billed by "PayPal (Europe) S.à r.l. et Cie, S.C.A.".
                            Payments for subscriptions made in the form of a Sponsorship via GitHub.com are handled by "Stripe, Inc".
                        </p>
                        <p>We do not collect, process or store credit cards, debit cards, bank details, or other sensitive payment details. All the information related to payment are strictly stored and processed by our payment providers.</p>
                        <p>Questions about payment details should be sent directly to the payment provider, using their contact details that you received via email when the Subscription was made.</p>

                        <h3 class="mt-4 mb-2">Merchant of Record</h3>
                        <p>The online reseller Paddle.com, registered as "Paddle.com Market Ltd.", is our Merchant of Record.</p>
                        <p></p>

                        <h3 class="mt-4 mb-2">Refunds</h3>
                        <p>
                            We do not guarantee refunds for any Subscription payments that have already been made. We do not guarantee refunds for subscriptions made by mistake. We might, however, give partial refunds, at our discretion, on a
                            per-case basis.
                        </p>
                        <p>It's your responsibility to cancel your Subscription before the next billing cycle, if you do not wish to be charged.</p>
                        <p>
                            The Service is fully dependent on the Strava API, which is a 3rd party provider. We cannot guarantee that the Strava API will work or exist at any time in the future. If for any reason Strava decides to disable their API,
                            or in the event that our connection to their API is terminated, all of the core features of the Service will cease to work. In such case, subscribers that had their last payment made in the last 30 days are entitled to a
                            refund for that last payment alone.
                        </p>
                        <p>All refunds are processed by our Merchant of Record, Paddle.com.</p>

                        <h3 class="mt-4 mb-2">Migration from PayPal to Paddle.com</h3>
                        <p>
                            Subscriptions made directly via PayPal, prior to September 14th, 2024, will continue to be billed up until December 31st, 2025. Affected users will be notified via email, and have the opportunity to resubscribe via
                            Paddle.com at the current subscription price. Some users might be eligible for a discount code. From January 1st, 2026, existing PRO subscriptions billed directly via PayPal will be cancelled, and users who have not
                            resubscribed via Paddle.com will have their PRO account reverted to a Free account.
                        </p>

                        <h2 class="mt-6 mb-4">Limitation of liability</h2>
                        <p>
                            In no event shall Strautomator, nor its developers, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of
                            profits, data, use, goodwill, or other intangible losses, resulting from:
                        </p>
                        <ul class="mb-6">
                            <li>Your access to or use of or inability to access or use the Service</li>
                            <li>Any conduct or content of any 3rd party on the Service</li>
                            <li>Any content obtained from the Service</li>
                            <li>Unauthorized access to data transmitted to or from the Service</li>
                        </ul>

                        <h2 class="mt-6 mb-4">Limits of our Terms</h2>
                        <p>
                            Our website may link to external sites that are not operated by us. Please be aware that we have no control over the content and policies of those sites, and cannot accept responsibility or liability for their respective
                            terms and conditions.
                        </p>

                        <h2 class="mt-6 mb-4">Changes to this policy</h2>
                        <p>
                            At our discretion, we may change our Terms and Conditions to reflect updates to the Service, current acceptable practices, or legislative or regulatory changes. If we decide to change our Terms and Conditions, we will post
                            the changes here at the same link by which you are accessing now. The full history of changes to our Terms and Conditions are available in our public source control repository, at GitHub.
                        </p>

                        <h2 class="mt-6 mb-4">Contact us</h2>
                        <p>For any questions or concerns, you may contact us on the following email: info@strautomator.com</p>

                        <div class="text-center mt-6">
                            <v-btn color="primary" @click="goBack" rounded>Back {{ backTarget }}</v-btn>
                        </div>
                    </v-card-text>
                </v-card>
            </div>
        </v-container>
    </v-main>
</template>

<script>
import _ from "lodash"
import FreeProTable from "~/components/FreeProTable.vue"

export default {
    authenticated: false,
    layout: "landing",
    components: {FreeProTable},
    head() {
        return {
            title: "Terms and Conditions"
        }
    },
    data() {
        return {
            backTarget: this.$store.state.user ? "to the Dashboard" : "home",
            releases: null
        }
    },
    methods: {
        goBack() {
            if (this.$store.state.user) {
                document.location.href = "/dashboard"
            } else {
                document.location.href = "/home"
            }
        }
    }
}
</script>
