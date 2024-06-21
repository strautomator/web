<template>
    <v-layout column>
        <v-container fluid>
            <h1>My Account</h1>
            <v-snackbar v-if="$route.query.garmin == 'linked' && user?.garmin" v-model="garminLinked" class="text-left" color="success" :timeout="5000" rounded bottom>
                Garmin account "{{ this.user.garmin.id }}" linked successfully!
                <template v-slot:action="{attrs}">
                    <v-icon v-bind="attrs" @click="closeAlert">mdi-close-circle</v-icon>
                </template>
            </v-snackbar>
            <v-snackbar v-if="$route.query.wahoo == 'linked' && user?.wahoo" v-model="wahooLinked" class="text-left" color="success" :timeout="5000" rounded bottom>
                Wahoo account "{{ this.user.wahoo.id }}" linked successfully!
                <template v-slot:action="{attrs}">
                    <v-icon v-bind="attrs" @click="closeAlert">mdi-close-circle</v-icon>
                </template>
            </v-snackbar>
            <v-snackbar v-else-if="user && !user.wahoo" v-model="wahooUnlinked" class="text-left" color="success" :timeout="5000" rounded bottom>
                Wahoo account unlinked successfully!
                <template v-slot:action="{attrs}">
                    <v-icon v-bind="attrs" @click="closeAlert">mdi-close-circle</v-icon>
                </template>
            </v-snackbar>
            <v-snackbar v-if="$route.query.spotify == 'linked' && user?.spotify" v-model="spotifyLinked" class="text-left" color="success" :timeout="5000" rounded bottom>
                Spotify account "{{ this.user.spotify.email }}" linked successfully!
                <template v-slot:action="{attrs}">
                    <v-icon v-bind="attrs" @click="closeAlert">mdi-close-circle</v-icon>
                </template>
            </v-snackbar>
            <v-snackbar v-else-if="user && !user.spotify" v-model="spotifyUnlinked" class="text-left" color="success" :timeout="5000" rounded bottom>
                Spotify account unlinked successfully!
                <template v-slot:action="{attrs}">
                    <v-icon v-bind="attrs" @click="closeAlert">mdi-close-circle</v-icon>
                </template>
            </v-snackbar>
            <div>
                <div class="mt-3">
                    {{ user.profile.firstName }} {{ user.profile.lastName }}
                    <span v-if="user.preferences.privacyMode">(anonymized)</span>
                </div>
                <div class="mb-3">
                    <span class="mr-1" v-if="user.email">{{ user.email }}</span>
                    <span class="mr-1" v-else-if="user.confirmEmail">{{ user.confirmEmail }} <v-icon color="secondary" small>mdi-alert-circle</v-icon></span>
                    <br v-if="(user.email || user.confirmEmail) && $breakpoint.mdAndDown" />
                    <v-btn class="ml-n1 ml-md-0" title="Set your email address" :color="user.email ? '' : 'primary'" @click="emailDialog = true" rounded x-small>{{
                        user.confirmEmail ? "pending confirmation" : user.email ? "change email" : "set email address"
                    }}</v-btn>
                </div>

                <div>
                    Account ID {{ user.id }}
                    <a :href="stravaProfileUrl" target="strava" title="Go to my profile on Strava..."><v-icon color="primary" class="ml-1 mt-n1" small>mdi-open-in-new</v-icon></a>
                </div>
                <div v-if="user.fitnessLevel">
                    Fitness level: {{ user.fitnessLevel }}/5 ({{ $store.state.fitnessLevel[user.fitnessLevel] }})
                    <n-link to="/help?q=fitness level" title="Your estimated fitness from 1 (Untrained) to 5 (Elite)" nuxt><v-icon color="primary" class="ml-1 mt-n1" small>mdi-help-circle-outline</v-icon></n-link>
                </div>
                <div>Registered on {{ dateRegistered }}</div>
                <div>Units on Strava: {{ user.profile.units }}</div>
                <div v-if="user.spotify">Spotify ID: {{ user.spotify.email }}</div>
                <div class="ml-n1 mt-3 text-left">
                    <v-btn class="ma-1" color="primary" title="Garmin account" @click="garminDialog = true" :disabled="!user.isPro" nuxt small rounded>
                        <v-icon left>mdi-triangle</v-icon>
                        {{ !user.isPro ? "Link Garmin account (PRO only)" : user.garmin ? "Unlink Garmin account" : "Link Garmin account" }}
                    </v-btn>
                    <v-btn class="ma-1" color="primary" title="Wahoo account" @click="wahooDialog = true" :disabled="!user.isPro" nuxt small rounded>
                        <v-icon left>mdi-alpha-w-circle</v-icon>
                        {{ !user.isPro ? "Link Wahoo account (PRO only)" : user.wahoo ? "Unlink Wahoo account" : "Link Wahoo account" }}
                    </v-btn>
                    <v-btn class="ma-1" color="primary" title="Spotify account" @click="spotifyDialog = true" nuxt small rounded>
                        <v-icon left>mdi-spotify</v-icon>
                        {{ user.spotify ? "Unlink Spotify account" : "Link Spotify account" }}
                    </v-btn>
                </div>
            </div>
            <v-card class="mt-5" outlined>
                <v-card-title class="accent">My preferences</v-card-title>
                <v-card-text>
                    <div class="mt-6 d-flex" :class="{'flex-column': !$breakpoint.mdAndUp}">
                        <div class="flex-grow-1">
                            <v-select label="Weather provider" v-model="weatherProvider" :items="listWeatherProviders" :class="{'mr-1': $breakpoint.mdAndUp}" outlined rounded></v-select>
                        </div>
                        <div class="flex-grow-1">
                            <v-select label="Temperature unit" v-model="weatherUnit" :items="listWeatherUnits" :class="{'ml-1 mr-1': $breakpoint.mdAndUp}" outlined rounded></v-select>
                        </div>
                        <div class="flex-grow-1">
                            <v-select label="Wind speed unit" v-model="windSpeedUnit" :items="listWindSpeedUnits" :class="{'ml-1 mr-1': $breakpoint.mdAndUp}" outlined rounded></v-select>
                        </div>
                        <div class="flex-grow-1">
                            <v-select label="Language" v-model="language" :items="listLanguages" :class="{'ml-1': $breakpoint.mdAndUp}" outlined rounded></v-select>
                        </div>
                    </div>
                    <div v-if="user.isPro" class="mb-8 mt-n2 text-center text-md-left">
                        <n-link title="Help me selecting a weather provider" to="/weather/select" nuxt router>
                            <v-icon color="primary" class="mt-n1" small>mdi-information-outline</v-icon>
                            Need help choosing a weather provider?
                        </n-link>
                    </div>
                    <div class="mt-n1">
                        <h3 class="mb-2">FTP auto update{{ user.isPro ? "" : " (PRO only)" }}</h3>
                        <div class="body-2">Strautomator can automatically update your cycling FTP and your estimated fitness level based on your recent activities.</div>
                        <v-switch class="mt-2" title="FTP auto-update" v-model="ftpAutoUpdate" :disabled="!user.isPro" :label="ftpAutoUpdate ? 'Yes, auto-update my Strava FTP' : 'No, leave my Strava FTP alone'"></v-switch>
                    </div>
                    <div class="mb-8 mt-n2 text-center text-md-left">
                        <v-btn class="ma-1" color="primary" title="Estimate my FTP" @click="showFtpDialog" outlined rounded small>
                            <v-icon left>mdi-flash</v-icon>
                            What's my estimated FTP?
                        </v-btn>
                    </div>
                    <div class="mt-4">
                        <h3 class="mb-2">Delayed processing</h3>
                        <div class="body-2">
                            Do you want Strautomator to wait a few minutes before processing your activities? Useful if you have other services updating your Strava as well, or if you want to have some time to change details / add photos before your
                            automations are executed.
                        </div>
                        <v-switch class="mt-2" title="Delayed processing" v-model="delayedProcessing" :label="delayedProcessing ? 'Yes, delay the processing' : 'No, process activities ASAP'"></v-switch>
                        <v-alert color="accent" class="body-2" v-if="user.isPro && user.garmin" dense>Delayed processing is recommended if you're having issues Garmin automation conditions.</v-alert>
                    </div>
                    <div class="mt-4">
                        <h3 class="mb-2">GearWear delay</h3>
                        <div class="body-2">GearWear tracking is done with a default of 2 days delay, so you have plenty of time to make sure your activities are set with the correct gear. You can change that delay, if you want.</div>
                        <v-radio-group v-model="gearwearDelayDays" :row="$breakpoint.mdAndUp">
                            <v-radio label="1 day (yesterday)" :value="1"></v-radio>
                            <v-radio label="2 days" :value="2"></v-radio>
                            <v-radio label="3 days" :value="3"></v-radio>
                        </v-radio-group>
                    </div>
                    <div class="mt-4">
                        <h3 class="mb-2">Yearly counter reset</h3>
                        <div class="body-2">Do you want to have your automation counters automatically reset every year?</div>
                        <v-switch class="mt-2" title="Yearly automation counter reset" v-model="resetCounter" :label="resetCounter ? 'Yes, reset counters every year' : 'No, do not reset counters'"></v-switch>
                        <v-row no-gutters>
                            <v-col xs="12" md="3" v-if="resetCounter">
                                <v-menu v-model="dateMenu" :close-on-content-click="false" :nudge-right="40" transition="scale-transition" min-width="290px" offset-y>
                                    <template v-slot:activator="{on, attrs}">
                                        <v-text-field v-model="dateResetCounterFormatted" v-bind="attrs" v-on="on" label="Reset date" type="text" prepend-icon="mdi-calendar" outlined readonly rounded dense></v-text-field>
                                    </template>
                                    <v-date-picker v-model="dateResetCounter" @input="dateMenu = false" :min="minDateReset" :max="maxDateReset" no-title></v-date-picker>
                                </v-menu>
                            </v-col>
                        </v-row>
                    </div>

                    <div class="mt-4" v-if="linksOn > 0">
                        <h3 class="mb-2">Hashtag preference</h3>
                        <div class="body-2">Do you prefer using hashtags on activity names instead of an URL on activity descriptions for linkbacks?</div>
                        <v-switch class="mt-2" title="Hashtag preference" v-model="activityHashtag" :label="activityHashtag ? 'Yes, hashtag on activity names' : 'No, use a link on descriptions'"></v-switch>
                    </div>
                    <div class="mt-4">
                        <h3 class="mb-2">Omit tag suffixes</h3>
                        <div class="body-2">Enable to hide suffixes (km/h, mph, etc) when replacing activity tags in your automations.</div>
                        <v-switch class="mt-2" title="Omit tag suffixes" v-model="noSuffixes" :label="noSuffixes ? 'Yes, omit tag suffixes' : 'Do not omit'"></v-switch>
                    </div>
                    <div class="mt-4">
                        <h3 class="mb-2">Privacy mode</h3>
                        <div class="body-2">
                            Opt-in to disable the personal records tracking, anonymize your name and save as little information about processed activities as possible. Some features will be disabled.
                            <n-link to="/help?q=privacy mode" title="More details about the privacy mode" nuxt>More details...</n-link>
                        </div>
                        <v-switch class="mt-2" title="Privacy mode" v-model="privacyMode" :label="privacyMode ? 'Yes, enable the privacy mode' : 'No, I want all the features'" @change="confirmPrivacyDialog"></v-switch>
                    </div>
                    <div class="mt-4">
                        <h3 class="mb-2">Linkback preference</h3>
                        <div class="body-2">
                            <span v-if="linksOn == 1">A linkback will be added to all activities processed by Strautomator.</span>
                            <span v-else-if="linksOn > 0">A linkback {{ user.isPro ? "can" : "will" }} be added to {{ 100 / linksOn }}% of the activities processed by Strautomator.</span>
                            <span v-else>A linkback won't be added to your activities.</span>
                            <v-radio-group v-model="linksOn" :row="$breakpoint.mdAndUp">
                                <v-radio label="100%" :value="1"></v-radio>
                                <v-radio label="50%" :value="2"></v-radio>
                                <v-radio label="20%" :value="5"></v-radio>
                                <v-radio label="10%" :value="10"></v-radio>
                                <v-radio :label="user.isPro ? 'No links' : 'No links (PRO only)'" :value="0" :disabled="!user.isPro"></v-radio>
                            </v-radio-group>
                        </div>
                    </div>
                    <div class="mt-4">
                        <h3 class="mb-2">AI preferences {{ user.isPro ? "" : "(PRO only)" }}</h3>
                        <div class="body-2 mb-4">You can select your preferred AI provider, used to generate activity names and descriptions.</div>
                        <v-radio-group v-model="aiProvider" :row="$breakpoint.mdAndUp" :disabled="!user.isPro">
                            <v-radio label="Default" :value="''"></v-radio>
                            <v-radio label="Anthropic" :value="'anthropic'"></v-radio>
                            <v-radio label="Gemini" :value="'gemini'"></v-radio>
                            <v-radio label="OpenAI" :value="'openai'"></v-radio>
                        </v-radio-group>
                        <div class="body-2 mb-4">You can also enhance the generated content by setting a custom prompt, that will be appended to the default prompt.</div>
                        <v-text-field
                            v-model="aiPrompt"
                            maxlength="100"
                            placeholder="Enter a custom prompt or leave it blank"
                            @blur="delaySavePreferences()"
                            :label="user.isPro ? 'Append AI prompt' : 'Append AI prompt (PRO Only)'"
                            :disabled="!user.isPro"
                            outlined
                            rounded
                        ></v-text-field>
                    </div>
                    <div class="mt-n2 text-center text-md-left">
                        <n-link title="Help me selecting a weather provider" to="/activities/fortune" nuxt router>
                            <v-icon color="primary" class="mt-n1" small>mdi-information-outline</v-icon>
                            Want to test the AI generated features?
                        </n-link>
                    </div>
                </v-card-text>
            </v-card>
            <h3 class="mt-5 mb-3">Status: {{ $store.state.user.isPro ? "PRO" : "Free" }} account</h3>
            <free-pro-table />
            <div class="mt-4 text-center text-md-left">
                <v-btn color="primary" to="/billing" title="PRO Subscription" rounded nuxt>
                    <v-icon left>mdi-credit-card-outline</v-icon>
                    {{ user.isPro ? "View my subscription" : "Subscribe to PRO" }}
                </v-btn>
            </div>
            <div class="mt-6 text-center text-md-left">
                <v-btn color="primary" class="mr-md-2" title="My notifications" to="/account/notifications" small outlined rounded nuxt>
                    <v-icon left>mdi-bell</v-icon>
                    My notifications
                </v-btn>
                <v-btn color="primary" class="mt-2 mt-md-0 mr-md-2" title="Download my data" to="/account/download" small outlined rounded nuxt>
                    <v-icon left>mdi-archive-arrow-down</v-icon>
                    Download my data
                </v-btn>
                <v-btn color="removal" class="mt-2 mt-md-0" title="Time to say goodbye?" to="/account/goodbye" small outlined rounded nuxt>
                    <v-icon left>mdi-cancel</v-icon>
                    Close my account
                </v-btn>
            </div>

            <email-dialog :show-dialog="emailDialog" @closed="hideEmailDialog" />
            <v-snackbar v-model="emailSaved" class="text-left" color="success" :timeout="5000" rounded bottom>
                Please open your inbox and confirm your email address.
                <template v-slot:action="{attrs}">
                    <v-icon v-bind="attrs" @click="emailSaved = false">mdi-close-circle</v-icon>
                </template>
            </v-snackbar>
            <v-snackbar v-model="emailConfirmed" class="text-left" color="success" :timeout="5000" rounded bottom>
                Your email {{ $store.state.user.email }} was confirmed successfully!
                <template v-slot:action="{attrs}">
                    <v-icon v-bind="attrs" @click="emailConfirmed = false">mdi-close-circle</v-icon>
                </template>
            </v-snackbar>
        </v-container>

        <v-dialog v-model="garminDialog" width="540" overlay-opacity="0.95">
            <v-card>
                <v-toolbar color="primary">
                    <v-toolbar-title>Garmin account</v-toolbar-title>
                    <v-spacer></v-spacer>
                    <v-toolbar-items>
                        <v-btn icon @click.stop="hideGarminDialog">
                            <v-icon>mdi-close</v-icon>
                        </v-btn>
                    </v-toolbar-items>
                </v-toolbar>
                <v-card-text>
                    <p class="mt-4" v-if="!user.garmin">You can link your Garmin account to your Strautomator profile to use ANT+ sensor IDs and other Garmin data on your automations.</p>
                    <p class="mt-4" v-else>You have linked the Garmin account {{ user.garmin.id }} to your profile. If you unlink it, existing automations having Garmin related properties will stop working.</p>
                    <div class="text-right mt-1">
                        <v-spacer></v-spacer>
                        <v-btn class="mr-2" color="grey" title="Close" @click.stop="hideGarminDialog" text rounded>
                            <v-icon left>mdi-cancel</v-icon>
                            Cancel
                        </v-btn>
                        <v-btn color="primary" title="Proceed to authentication with Garmin" @click="linkGarmin" v-if="!user.garmin" rounded>
                            <v-icon left>mdi-link</v-icon>
                            Go to Garmin
                        </v-btn>
                        <v-btn color="primary" title="Unlink my Garmin account" @click="unlinkGarmin" v-else rounded>
                            <v-icon left>mdi-link-off</v-icon>
                            Unlink
                        </v-btn>
                    </div>
                </v-card-text>
            </v-card>
        </v-dialog>

        <v-dialog v-model="wahooDialog" width="540" overlay-opacity="0.95">
            <v-card>
                <v-toolbar color="primary">
                    <v-toolbar-title>Wahoo account</v-toolbar-title>
                    <v-spacer></v-spacer>
                    <v-toolbar-items>
                        <v-btn icon @click.stop="hideWahooDialog">
                            <v-icon>mdi-close</v-icon>
                        </v-btn>
                    </v-toolbar-items>
                </v-toolbar>
                <v-card-text>
                    <p class="mt-4" v-if="!user.wahoo">You can link your Wahoo account to your Strautomator profile to use ANT+ sensor IDs paired to your device on your automations.</p>
                    <p class="mt-4" v-else>You have linked the Wahoo account {{ user.wahoo.id }} to your profile. If you unlink it, existing automations having Wahoo related properties will stop working.</p>
                    <div class="text-right mt-1">
                        <v-spacer></v-spacer>
                        <v-btn class="mr-2" color="grey" title="Close" @click.stop="hideWahooDialog" text rounded>
                            <v-icon left>mdi-cancel</v-icon>
                            Cancel
                        </v-btn>
                        <v-btn color="primary" title="Proceed to authentication with Wahoo" @click="linkWahoo" v-if="!user.wahoo" rounded>
                            <v-icon left>mdi-link</v-icon>
                            Go to Wahoo
                        </v-btn>
                        <v-btn color="primary" title="Unlink my Wahoo account" @click="unlinkWahoo" v-else rounded>
                            <v-icon left>mdi-link-off</v-icon>
                            Unlink
                        </v-btn>
                    </div>
                </v-card-text>
            </v-card>
        </v-dialog>

        <v-dialog v-model="spotifyDialog" width="540" overlay-opacity="0.95">
            <v-card>
                <v-toolbar color="primary">
                    <v-toolbar-title>Spotify account</v-toolbar-title>
                    <v-spacer></v-spacer>
                    <v-toolbar-items>
                        <v-btn icon @click.stop="hideSpotifyDialog">
                            <v-icon>mdi-close</v-icon>
                        </v-btn>
                    </v-toolbar-items>
                </v-toolbar>
                <v-card-text>
                    <p class="mt-4" v-if="!user.spotify">You can link your Spotify account to your Strautomator profile to use recent tracks as part of conditions or actions in your automations.</p>
                    <p class="mt-4" v-else>You have linked the Spotify account {{ user.spotify.email }} to your profile. If you unlink it, existing automations having Spotify related properties might stop working.</p>
                    <div class="text-right mt-1">
                        <v-spacer></v-spacer>
                        <v-btn class="mr-2" color="grey" title="Close" @click.stop="hideSpotifyDialog" text rounded>
                            <v-icon left>mdi-cancel</v-icon>
                            Cancel
                        </v-btn>
                        <v-btn color="primary" title="Proceed to authentication with Spotify" @click="linkSpotify" v-if="!user.spotify" rounded>
                            <v-icon left>mdi-link</v-icon>
                            Go to Spotify
                        </v-btn>
                        <v-btn color="primary" title="Unlink my Spotify account" @click="unlinkSpotify" v-else rounded>
                            <v-icon left>mdi-link-off</v-icon>
                            Unlink
                        </v-btn>
                    </div>
                </v-card-text>
            </v-card>
        </v-dialog>

        <v-dialog v-model="ftpDialog" width="540" overlay-opacity="0.95">
            <v-card>
                <v-toolbar color="primary">
                    <v-toolbar-title>Estimate my FTP</v-toolbar-title>
                    <v-spacer></v-spacer>
                    <v-toolbar-items>
                        <v-btn icon @click.stop="hideFtpDialog">
                            <v-icon>mdi-close</v-icon>
                        </v-btn>
                    </v-toolbar-items>
                </v-toolbar>
                <v-card-text>
                    <p class="mt-4" v-if="ftpResult === null">
                        <v-progress-circular class="mr-1" size="16" width="2" indeterminate></v-progress-circular>
                        Estimating your FTP, please wait, this can take up to 2 minutes...
                    </p>
                    <p class="mt-4" v-else-if="ftpResult === false">Could not estimate your FTP. You need to have at least 1 recent cycling activity with power for the estimation to work.</p>
                    <template v-else>
                        <p class="mt-4 text-body-1 font-weight-bold">Estimated FTP: {{ ftpResult.recentlyUpdated ? ftpResult.ftpCurrentWatts : ftpResult.ftpWatts }} watts</p>
                        <p>
                            Estimation based on {{ ftpResult.activityCount }} activities.<br />
                            Best effort of {{ ftpResult.bestWatts }} watts:
                            <a target="StravaActivity" :href="'https://www.strava.com/activities/' + ftpResult.bestActivity.id">{{ $dayjs(ftpResult.bestActivity.dateStart).format("ll") }}</a>
                        </p>
                        <p v-if="ftpResult.ftpWatts == ftpResult.ftpCurrentWatts">Keep up the good work!</p>
                        <p v-else-if="!ftpResult.recentlyUpdated">Do you want to update your FTP from {{ ftpResult.ftpCurrentWatts || "0" }} to {{ ftpResult.ftpWatts }} watts on your Strava account now?</p>
                        <v-alert color="accent" v-else>Your FTP was recently updated by Strautomator, so you'll have to wait 24 hours before using this feature.</v-alert>
                    </template>

                    <div class="text-right mt-1">
                        <v-spacer></v-spacer>
                        <v-btn class="mr-2" color="grey" title="Close" @click.stop="hideFtpDialog" text rounded>
                            <v-icon left>mdi-cancel</v-icon>
                            Close
                        </v-btn>
                        <v-btn color="primary" title="Save the estimated FTP on Strava" :disabled="!ftpResult || ftpResult.recentlyUpdated || ftpResult.ftpWatts == ftpResult.ftpCurrentWatts" @click="saveEstimatedFtp" rounded>
                            <v-icon left>mdi-cloud-upload</v-icon>
                            Update
                        </v-btn>
                    </div>
                </v-card-text>
            </v-card>
        </v-dialog>

        <v-dialog v-model="privacyDialog" width="540" overlay-opacity="0.95">
            <v-card>
                <v-toolbar color="primary">
                    <v-toolbar-title>Privacy mode</v-toolbar-title>
                    <v-spacer></v-spacer>
                    <v-toolbar-items>
                        <v-btn icon @click.stop="cancelPrivacyDialog">
                            <v-icon>mdi-close</v-icon>
                        </v-btn>
                    </v-toolbar-items>
                </v-toolbar>
                <v-card-text>
                    <p class="mt-4">
                        If you enable the privacy mode, some of your profile data will be anonymized, your personal records won't be tracked, and most of your processed activities metadata will be discarded. AI integrations will also be disabled.
                    </p>
                    <p>This action is irreversible! If you enable the Privacy Mode and then disable it again, the data previously discarded cannot be recovered.</p>

                    <div class="text-right mt-1">
                        <v-spacer></v-spacer>
                        <v-btn class="mr-2" color="grey" title="Close" @click.stop="cancelPrivacyDialog" text rounded>
                            <v-icon left>mdi-cancel</v-icon>
                            Cancel
                        </v-btn>
                        <v-btn color="primary" title="Enable the privacy mode" @click="savePrivacyDialog" rounded>
                            <v-icon left>mdi-shield-check</v-icon>
                            Confirm
                        </v-btn>
                    </div>
                </v-card-text>
            </v-card>
        </v-dialog>
    </v-layout>
</template>

<script>
import _ from "lodash"
import EmailDialog from "~/components/account/EmailDialog.vue"
import FreeProTable from "~/components/FreeProTable.vue"
import userMixin from "~/mixins/userMixin.js"

export default {
    authenticated: true,
    components: {EmailDialog, FreeProTable},
    mixins: [userMixin],
    head() {
        return {
            title: "Account"
        }
    },
    created() {
        this.delaySavePreferences = _.debounce(this.savePreferences, 1000)

        if (this.$route.query.spotify) {
            this.refreshUser()
        }
    },
    data() {
        const user = this.$store.state.user
        const preferences = user.preferences
        const defaultLinksOn = user.isPro ? 0 : this.$store.state.linksOnPercent
        const linksOn = preferences.linksOn || defaultLinksOn
        const delayedProcessing = preferences.delayedProcessing || false
        const gearwearDelayDays = preferences.gearwearDelayDays || 2
        const hashtag = preferences.activityHashtag || false
        const privacyMode = preferences.privacyMode || false
        const noSuffixes = preferences.noSuffixes || false
        const ftpAutoUpdate = preferences.ftpAutoUpdate || false
        const language = preferences.language || "en"
        const aiProvider = preferences.aiProvider || ""
        const aiPrompt = preferences.aiPrompt || ""
        const weatherProvider = user.isPro ? preferences.weatherProvider || null : null
        const weatherUnit = preferences.weatherUnit || "c"
        const windSpeedUnit = preferences.windSpeedUnit ? preferences.windSpeedUnit : weatherUnit == "f" ? "mph" : "kph"
        const listWeatherProviders = _.cloneDeep(this.$store.state.weatherProviders)

        const now = this.$dayjs()
        const dateFormat = "YYYY-MM-DD"
        let dateResetCounter = preferences.dateResetCounter || null
        let resetCounter = dateResetCounter ? true : false
        let arrDateReset = dateResetCounter ? dateResetCounter.split("-") : null

        if (dateResetCounter) {
            dateResetCounter = now.month(parseInt(arrDateReset[0]) - 1).date(arrDateReset[1])
            if (dateResetCounter.isBefore(now)) {
                dateResetCounter = dateResetCounter.add(1, "year")
            }
        } else {
            dateResetCounter = now.add(1, "year")
        }

        if (!user.isPro) {
            for (let wp of listWeatherProviders) {
                if (wp.value) {
                    wp.disabled = true
                    wp.text += " (PRO only)"
                }
            }
        }

        return {
            savePending: false,
            emailDialog: false,
            emailSaved: false,
            emailConfirmed: false,
            garminDialog: this.$route.query.garmin == "link",
            garminLinked: this.$route.query.garmin == "linked",
            garminUnlinked: this.$route.query.garmin == "unlinked",
            wahooDialog: this.$route.query.wahoo == "link",
            wahooLinked: this.$route.query.wahoo == "linked",
            wahooUnlinked: this.$route.query.wahoo == "unlinked",
            spotifyDialog: this.$route.query.spotify == "link",
            spotifyLinked: this.$route.query.spotify == "linked",
            spotifyUnlinked: this.$route.query.spotify == "unlinked",
            linksOn: linksOn || defaultLinksOn,
            delayedProcessing: delayedProcessing,
            gearwearDelayDays: gearwearDelayDays,
            activityHashtag: hashtag,
            noSuffixes: noSuffixes,
            privacyMode: privacyMode,
            privacyDialog: false,
            ftpAutoUpdate: ftpAutoUpdate,
            ftpResult: null,
            ftpDialog: false,
            resetCounter: resetCounter,
            dateResetCounter: dateResetCounter.format(dateFormat),
            dateMenu: false,
            minDateReset: this.$dayjs().format(dateFormat),
            maxDateReset: this.$dayjs().add(1, "year").format(dateFormat),
            language: language,
            aiProvider: aiProvider,
            aiPrompt: aiPrompt,
            weatherProvider: weatherProvider,
            weatherUnit: weatherUnit,
            windSpeedUnit: windSpeedUnit,
            listWeatherProviders: listWeatherProviders,
            listWeatherUnits: [
                {value: "c", text: "Celsius"},
                {value: "f", text: "Fahrenheit"}
            ],
            listWindSpeedUnits: [
                {value: "m/s", text: "m/s"},
                {value: "kph", text: "kph"},
                {value: "mph", text: "mph"}
            ],
            listLanguages: [
                {value: "en", text: "English"},
                {value: "de", text: "Deutsch"},
                {value: "es", text: "Español"},
                {value: "fr", text: "Français"},
                {value: "it", text: "Italiano"},
                {value: "lt", text: "Lietuvių"},
                {value: "nl", text: "Nederlands"},
                {value: "pl", text: "Polski"},
                {value: "pt", text: "Português"}
            ]
        }
    },
    computed: {
        dateRegistered() {
            return this.$dayjs(this.user.dateRegistered).format("ll")
        },
        stravaProfileUrl() {
            return `https://www.strava.com/athletes/${this.user.id}`
        },
        dateResetCounterFormatted() {
            const result = this.$dayjs(this.dateResetCounter)
            return result.format("MMM DD")
        }
    },
    watch: {
        ftpAutoUpdate(newValue, oldValue) {
            this.preferenceChanged(newValue, oldValue)
        },
        linksOn(newValue, oldValue) {
            this.preferenceChanged(newValue, oldValue)
        },
        delayedProcessing(newValue, oldValue) {
            this.preferenceChanged(newValue, oldValue)
        },
        gearwearDelayDays(newValue, oldValue) {
            this.preferenceChanged(newValue, oldValue)
        },
        activityHashtag(newValue, oldValue) {
            this.preferenceChanged(newValue, oldValue)
        },
        weatherProvider(newValue, oldValue) {
            this.preferenceChanged(newValue, oldValue)
        },
        weatherUnit(newValue, oldValue) {
            this.preferenceChanged(newValue, oldValue)
        },
        windSpeedUnit(newValue, oldValue) {
            this.preferenceChanged(newValue, oldValue)
        },
        language(newValue, oldValue) {
            this.preferenceChanged(newValue, oldValue)
        },
        privacyMode(newValue, oldValue) {
            this.preferenceChanged(newValue, oldValue)
        },
        resetCounter(newValue, oldValue) {
            this.preferenceChanged(newValue, oldValue)
        },
        dateResetCounter(newValue, oldValue) {
            this.preferenceChanged(newValue, oldValue)
        },
        aiProvider(newValue, oldValue) {
            this.preferenceChanged(newValue, oldValue)
        }
    },
    async fetch() {
        try {
            if (this.$route.query?.token && this.$route.query?.email != this.$store.state.user.email) {
                await this.$axios.$post(`/api/users/${this.$store.state.user.id}/email/confirm`, {email: this.$route.query.email, token: this.$route.query.token})
                this.$store.commit("setUserConfirmEmail", null)
                this.$store.commit("setUserEmail", this.$route.query.email)
                this.emailConfirmed = true
            }
        } catch (ex) {
            this.$webError(this, "Account.fetch", ex)
        }
    },
    async beforeRouteLeave(to, from, next) {
        if (this.savePending) {
            await this.savePreferences()
        }

        next()
    },
    methods: {
        preferenceChanged(newValue, oldValue) {
            if (newValue != oldValue) {
                this.savePending = true
                this.delaySavePreferences()
            }
        },
        hideEmailDialog(emailSaved) {
            this.emailDialog = false
            this.emailSaved = emailSaved
        },
        hideGarminDialog() {
            this.garminDialog = false
        },
        async linkGarmin() {
            try {
                const result = await this.$axios.$get("/api/garmin/auth/url")
                document.location.href = result.url
            } catch (ex) {
                this.$webError(this, "Account.linkGarmin", ex)
            }
        },
        async unlinkGarmin(unlink) {
            try {
                await this.$axios.$get("/api/garmin/auth/unlink")
                await this.refreshUser()

                this.garminLinked = false
                this.garminUnlinked = true
                this.hideGarminDialog()
            } catch (ex) {
                this.$webError(this, "Account.unlinkGarmin", ex)
            }
        },
        hideWahooDialog() {
            this.wahooDialog = false
        },
        async linkWahoo() {
            try {
                const result = await this.$axios.$get("/api/wahoo/auth/url")
                document.location.href = result.url
            } catch (ex) {
                this.$webError(this, "Account.linkWahoo", ex)
            }
        },
        async unlinkWahoo(unlink) {
            try {
                await this.$axios.$get("/api/wahoo/auth/unlink")
                await this.refreshUser()

                this.wahooLinked = false
                this.wahooUnlinked = true
                this.hideWahooDialog()
            } catch (ex) {
                this.$webError(this, "Account.unlinkWahoo", ex)
            }
        },
        hideSpotifyDialog() {
            this.spotifyDialog = false
        },
        async linkSpotify() {
            try {
                const result = await this.$axios.$get("/api/spotify/auth/url")
                document.location.href = result.url
            } catch (ex) {
                this.$webError(this, "Account.linkSpotify", ex)
            }
        },
        async unlinkSpotify() {
            try {
                await this.$axios.$get("/api/spotify/auth/unlink")
                await this.refreshUser()

                this.spotifyLinked = false
                this.spotifyUnlinked = true
                this.hideSpotifyDialog()
            } catch (ex) {
                this.$webError(this, "Account.unlinkSpotify", ex)
            }
        },
        confirmPrivacyDialog() {
            this.privacyDialog = this.privacyMode
        },
        cancelPrivacyDialog() {
            this.privacyDialog = false
            this.privacyMode = false
        },
        savePrivacyDialog() {
            this.privacyDialog = false
            this.privacyMode = true
        },
        showFtpDialog() {
            this.ftpDialog = true
            this.estimateFtp()
        },
        hideFtpDialog() {
            this.ftpDialog = false
        },
        async estimateFtp() {
            if (this.ftpResult) return

            try {
                const result = await this.$axios.$get(`/api/strava/${this.user.id}/ftp/estimate`)

                if (!result) {
                    this.ftpResult = false
                } else {
                    this.ftpResult = result
                }
            } catch (ex) {
                this.$webError(this, "Account.estimateFtp", ex)
            }
        },
        async saveEstimatedFtp() {
            try {
                const result = await this.$axios.$post(`/api/strava/${this.user.id}/ftp/estimate`, {ftp: this.ftpResult.ftpWatts})

                if (!result) {
                    this.ftpResult.recentlyUpdated = true
                } else {
                    this.hideFtpDialog()
                }
            } catch (ex) {
                this.$webError(this, "Account.saveFtp", ex)
            }
        },
        async savePreferences() {
            this.savePending = false

            try {
                const arrDate = this.dateResetCounter.split("-")
                arrDate.shift()

                const data = {
                    ftpAutoUpdate: this.ftpAutoUpdate,
                    linksOn: this.linksOn,
                    delayedProcessing: this.delayedProcessing,
                    gearwearDelayDays: this.gearwearDelayDays,
                    activityHashtag: this.activityHashtag,
                    noSuffixes: this.noSuffixes,
                    privacyMode: this.privacyMode,
                    weatherProvider: this.weatherProvider,
                    weatherUnit: this.weatherUnit,
                    windSpeedUnit: this.windSpeedUnit,
                    language: this.language,
                    aiProvider: this.aiProvider,
                    aiPrompt: this.aiPrompt.trim().length > 2 ? this.aiPrompt : "",
                    dateResetCounter: this.resetCounter ? arrDate.join("-") : false
                }

                this.$store.commit("setUserPreferences", data)

                await this.$axios.$post(`/api/users/${this.user.id}/preferences`, data)
            } catch (ex) {
                this.$webError(this, "Account.savePreferences", ex)
                if (ex.response?.data?.message?.includes("ChatGPT")) {
                    this.aiPrompt = ""
                }
            }
        },
        closeAlert() {
            this.spotifyLinked = false
            this.spotifyUnlinked = false
        }
    }
}
</script>
