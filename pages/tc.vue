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
                        <p>Last updated: 2022-07-01</p>
                        <p>Welcome to <b>Strautomator</b> (“we”, “our”, “us”... or "me", Igor Ramadas)!</p>
                        <p>These Terms of Service (“Terms”, “Terms of Service”) govern your use of our website located at <b>strautomator.com</b> (together or individually “Service”).</p>
                        <p>Our Privacy Policy also governs your use of our Service and explains how we collect, safeguard and disclose information that results from your use of our web pages.</p>
                        <p>Your agreement with us includes these Terms and our Privacy Policy (“Agreements”). You acknowledge that you have read and understood Agreements, and agree to be bound of them.</p>
                        <p>
                            If you do not agree with (or cannot comply with) Agreements, then you may not use the Service, but please let us know by emailing at <b>info@strautomator.com</b> so we can try to find a solution. These Terms apply to all
                            visitors, users and others who wish to access or use Service.
                        </p>
                        <p>2. <b>Free accounts</b></p>
                        <p>By using our Service, not bound to a Subscription (the Free account), you agree to the processing of your Strava account details, including private activities and private performance data.</p>
                        <p>Free accounts have no cost, and are guaranteed to work for free as long as the Service exists.</p>
                        <p>3. <b>PRO accounts</b></p>
                        <p>By using our Service, bound to a Subscription (the PRO account), you agree to the processing of your Strava account details, including private activities and private performance data.</p>
                        <p>
                            If you wish to subscribe to the PRO account, you may be asked to supply certain information relevant to your Subscription including but not limited to, your PayPal billing account, as well as some private information like
                            name, email and country of residence.
                        </p>
                        <p>You represent and warrant that: (i) you have the legal right to use any card(s) or other payment method(s) in connection with any Purchase; and that (ii) the information you supply to us is true, correct and complete.</p>
                        <p>
                            We reserve the right to refuse or cancel your Subscription at any time for reasons including but not limited to: product or service availability, errors in the description or price of the product or service, error in your
                            payment information or other reasons.
                        </p>
                        <p>We reserve the right to refuse or cancel your Subscription if fraud or an unauthorized or illegal transaction is suspected.</p>
                        <p>
                            At the end of each Billing Cycle, your Subscription will automatically renew under the exact same conditions unless you cancel it or Strautomator cancels it. You may cancel your Subscription renewal either through your
                            online account management page or by contacting info@strautomator.com.
                        </p>
                        <p>
                            A valid payment method is required to process the payment for your Subscription. You shall provide us with accurate and complete billing information that may include but not limited to full name, country or and a valid
                            payment method information. By submitting such payment information, you automatically authorize Strautomator to charge all Subscription fees incurred through your account to any such payment instruments.
                        </p>
                        <p>Should automatic billing fail to occur for any reason, Strautomator reserves the right to terminate your access to the Service with immediate effect.</p>
                        <p>4. <b>Promotions</b></p>
                        <p>
                            Any contests, sweepstakes or other promotions (collectively, “Promotions”) made available through Service may be governed by rules that are separate from these Terms of Service. If you participate in any Promotions, please
                            review the applicable rules as well as our Privacy Policy. If the rules for a Promotion conflict with these Terms of Service, Promotion rules will apply.
                        </p>
                        <p>5. <b>Fee Changes</b></p>
                        <p>Strautomator, in its sole discretion and at any time, may modify Subscription fees for the Subscriptions. Any Subscription fee change will become effective at the end of the then-current Billing Cycle.</p>
                        <p>Strautomator will provide you with a reasonable prior notice of any change in Subscription fees to give you an opportunity to terminate your Subscription before such change becomes effective.</p>
                        <p>Your continued use of Service after Subscription fee change comes into effect constitutes your agreement to pay the modified Subscription fee amount.</p>
                        <p>6. <b>Refunds</b></p>
                        <p>We issue refunds for Contracts within <b>1 days</b> of the original purchase of the Contract.</p>
                        <p>7. <b>Content</b></p>
                        <p>
                            Content found on or through this Service are the property of Strautomator or used with permission. You may not distribute, modify, transmit, reuse, download, repost, copy, or use said Content, whether in whole or in part,
                            for commercial purposes or for personal gain, without express advance written permission from us.
                        </p>
                        <p>8. <b>Prohibited Uses</b></p>
                        <p>You may use Service only for lawful purposes and in accordance with Terms. You agree not to use Service:</p>
                        <p>0.1. In any way that violates any applicable national or international law or regulation.</p>
                        <p>0.2. For the purpose of exploiting, harming, or attempting to exploit or harm minors in any way by exposing them to inappropriate content or otherwise.</p>
                        <p>0.3. To transmit, or procure the sending of, any advertising or promotional material, including any “junk mail”, “chain letter,” “spam,” or any other similar solicitation.</p>
                        <p>0.4. To impersonate or attempt to impersonate Company, a Company employee, another user, or any other person or entity.</p>
                        <p>0.5. In any way that infringes upon the rights of others, or in any way is illegal, threatening, fraudulent, or harmful, or in connection with any unlawful, illegal, fraudulent, or harmful purpose or activity.</p>
                        <p>0.6. To engage in any other conduct that restricts or inhibits anyone’s use or enjoyment of Service, or which, as determined by us, may harm or offend Company or users of Service or expose them to liability.</p>
                        <p>Additionally, you agree not to:</p>
                        <p>0.1. Use Service in any manner that could disable, overburden, damage, or impair Service or interfere with any other party’s use of Service, including their ability to engage in real time activities through Service.</p>
                        <p>0.2. Use any robot, spider, or other automatic device, process, or means to access Service for any purpose, including monitoring or copying any of the material on Service.</p>
                        <p>0.3. Use any manual process to monitor or copy any of the material on Service or for any other unauthorized purpose without our prior written consent.</p>
                        <p>0.4. Use any device, software, or routine that interferes with the proper working of Service.</p>
                        <p>0.5. Introduce any viruses, trojan horses, worms, logic bombs, or other material which is malicious or technologically harmful.</p>
                        <p>0.6. Attempt to gain unauthorized access to, interfere with, damage, or disrupt any parts of Service, the server on which Service is stored, or any server, computer, or database connected to Service.</p>
                        <p>0.7. Attack Service via a denial-of-service attack or a distributed denial-of-service attack.</p>
                        <p>0.8. Take any action that may damage or falsify Company rating.</p>
                        <p>0.9. Otherwise attempt to interfere with the proper working of Service.</p>
                        <p>9. <b>Analytics</b></p>
                        <p>We may use third-party Service Providers to monitor and analyze the use of our Service.</p>
                        <p>10. <b>Intellectual Property</b></p>
                        <p>
                            Service and its original content (excluding Content provided by users), features and functionality are and will remain the exclusive property of Strautomator and its licensors. Service is protected by copyright, trademark,
                            and other laws of and foreign countries. Our trademarks may not be used in connection with any product or service without the prior written consent of Strautomator.
                        </p>
                        <p>11. <b>Error Reporting and Feedback</b></p>
                        <p>
                            You may provide us either directly at info@strautomator.com or via third party sites and tools with information and feedback concerning errors, suggestions for improvements, ideas, problems, complaints, and other matters
                            related to our Service (“Feedback”). You acknowledge and agree that: (i) you shall not retain, acquire or assert any intellectual property right or other right, title or interest in or to the Feedback; (ii) Company may
                            have development ideas similar to the Feedback; (iii) Feedback does not contain confidential information or proprietary information from you or any third party; and (iv) Company is not under any obligation of
                            confidentiality with respect to the Feedback. In the event the transfer of the ownership to the Feedback is not possible due to applicable mandatory laws, you grant Company and its affiliates an exclusive, transferable,
                            irrevocable, free-of-charge, sub-licensable, unlimited and perpetual right to use (including copy, modify, create derivative works, publish, distribute and commercialize) Feedback in any manner and for any purpose.
                        </p>
                        <p>12. <b>Links To Other Web Sites</b></p>
                        <p>Our Service may contain links to third party web sites or services that are not owned or controlled by Strautomator.</p>
                        <p>
                            Strautomator has no control over, and assumes no responsibility for the content, privacy policies, or practices of any third party web sites or services. We do not warrant the offerings of any of these entities/individuals
                            or their websites.
                        </p>
                        <p>
                            YOU ACKNOWLEDGE AND AGREE THAT COMPANY SHALL NOT BE RESPONSIBLE OR LIABLE, DIRECTLY OR INDIRECTLY, FOR ANY DAMAGE OR LOSS CAUSED OR ALLEGED TO BE CAUSED BY OR IN CONNECTION WITH USE OF OR RELIANCE ON ANY SUCH CONTENT,
                            GOODS OR SERVICES AVAILABLE ON OR THROUGH ANY SUCH THIRD PARTY WEB SITES OR SERVICES.
                        </p>
                        <p>WE STRONGLY ADVISE YOU TO READ THE TERMS OF SERVICE AND PRIVACY POLICIES OF ANY THIRD PARTY WEB SITES OR SERVICES THAT YOU VISIT.</p>
                        <p>13. <b>Termination</b></p>
                        <p>
                            We may terminate or suspend your account and bar access to Service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever and without limitation, including but not limited to a
                            breach of Terms.
                        </p>
                        <p>If you wish to terminate your account, you may simply discontinue using Service.</p>
                        <p>All provisions of Terms which by their nature should survive termination shall survive termination, including, without limitation, ownership provisions, warranty disclaimers, indemnity and limitations of liability.</p>
                        <p>14. <b>Changes To Service</b></p>
                        <p>
                            We reserve the right to withdraw or amend our Service, and any service or material we provide via Service, in our sole discretion without notice. We will not be liable if for any reason all or any part of Service is
                            unavailable at any time or for any period. From time to time, we may restrict access to some parts of Service, or the entire Service, to users, including registered users.
                        </p>
                        <p>15. <b>Amendments To Terms</b></p>
                        <p>We may amend Terms at any time by posting the amended terms on this site. It is your responsibility to review these Terms periodically.</p>
                        <p>
                            Your continued use of the Platform following the posting of revised Terms means that you accept and agree to the changes. You are expected to check this page frequently so you are aware of any changes, as they are binding
                            on you.
                        </p>
                        <p>By continuing to access or use our Service after any revisions become effective, you agree to be bound by the revised terms. If you do not agree to the new terms, you are no longer authorized to use Service.</p>
                        <p>16. <b>Waiver And Severability</b></p>
                        <p>
                            No waiver by Company of any term or condition set forth in Terms shall be deemed a further or continuing waiver of such term or condition or a waiver of any other term or condition, and any failure of Company to assert a
                            right or provision under Terms shall not constitute a waiver of such right or provision.
                        </p>
                        <p>
                            If any provision of Terms is held by a court or other tribunal of competent jurisdiction to be invalid, illegal or unenforceable for any reason, such provision shall be eliminated or limited to the minimum extent such that
                            the remaining provisions of Terms will continue in full force and effect.
                        </p>
                        <p>17. <b>Acknowledgement</b></p>
                        <p>BY USING SERVICE OR OTHER SERVICES PROVIDED BY US, YOU ACKNOWLEDGE THAT YOU HAVE READ THESE TERMS OF SERVICE AND AGREE TO BE BOUND BY THEM.</p>

                        <div class="text-center mt-4">
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

export default {
    authenticated: false,
    layout: "landing",
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
