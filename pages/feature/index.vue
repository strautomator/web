<template>
    <v-main fluid>
        <h2 class="display-2 font-weight-bold mb-4">Strautomator features</h2>

        <v-divider class="mt-6 mb-6"></v-divider>

        <v-card>
            <v-card-text>
                <feature-ai-insights />
            </v-card-text>
        </v-card>

        <v-divider class="mt-6 mb-6"></v-divider>

        <v-card>
            <v-card-text>
                <feature-ai />
            </v-card-text>
        </v-card>
        <v-divider class="mt-6 mb-6"></v-divider>

        <v-card>
            <v-card-text>
                <feature-battery-tracker />
            </v-card-text>
        </v-card>
        <v-divider class="mt-6 mb-6"></v-divider>

        <v-card>
            <v-card-text>
                <feature-calendar />
            </v-card-text>
        </v-card>
        <v-divider class="mt-6 mb-6"></v-divider>

        <v-card>
            <v-card-text>
                <feature-commute />
            </v-card-text>
        </v-card>
        <v-divider class="mt-6 mb-6"></v-divider>

        <v-card>
            <v-card-text>
                <feature-counter />
            </v-card-text>
        </v-card>
        <v-divider class="mt-6 mb-6"></v-divider>

        <v-card>
            <v-card-text>
                <feature-ftp />
            </v-card-text>
        </v-card>

        <v-divider class="mt-6 mb-6"></v-divider>

        <v-card>
            <v-card-text>
                <feature-gearwear />
            </v-card-text>
        </v-card>
        <v-divider class="mt-6 mb-6"></v-divider>

        <v-card>
            <v-card-text>
                <feature-mapstyles />
            </v-card-text>
        </v-card>
        <v-divider class="mt-6 mb-6"></v-divider>

        <v-card>
            <v-card-text>
                <feature-mute />
            </v-card-text>
        </v-card>
        <v-divider class="mt-6 mb-6"></v-divider>

        <v-card>
            <v-card-text>
                <feature-records />
            </v-card-text>
        </v-card>
        <v-divider class="mt-6 mb-6"></v-divider>

        <v-card>
            <v-card-text>
                <feature-spotify />
            </v-card-text>
        </v-card>
        <v-divider class="mt-6 mb-6"></v-divider>

        <v-card>
            <v-card-text>
                <feature-upcoming-events-map />
            </v-card-text>
        </v-card>
        <v-divider class="mt-6 mb-6"></v-divider>

        <v-card>
            <v-card-text>
                <feature-weather />
            </v-card-text>
        </v-card>
    </v-main>
</template>

<script>
import FeatureAi from "./ai.vue"
import FeatureAiInsights from "./ai-insights.vue"
import FeatureBatteryTracker from "./battery-tracker.vue"
import FeatureCalendar from "./calendar.vue"
import FeatureCommute from "./commute.vue"
import FeatureCounter from "./counter.vue"
import FeatureFTP from "./ftp.vue"
import FeatureGearwear from "./gearwear.vue"
import FeatureMapstyles from "./mapstyles.vue"
import FeatureMute from "./mute.vue"
import FeatureRecords from "./records.vue"
import FeatureSpotify from "./spotify.vue"
import FeatureUpcomingEventsMap from "./upcoming-events-map.vue"
import FeatureWeather from "./weather.vue"

export default {
    layout: "feature",
    components: {
        FeatureAi,
        FeatureAiInsights,
        FeatureBatteryTracker,
        FeatureCalendar,
        FeatureCommute,
        FeatureCounter,
        FeatureFTP,
        FeatureGearwear,
        FeatureMapstyles,
        FeatureMute,
        FeatureRecords,
        FeatureSpotify,
        FeatureUpcomingEventsMap,
        FeatureWeather
    },
    head() {
        return {
            title: "Strautomator features"
        }
    },
    methods: {
        login() {
            this.$login()
        }
    }
}
</script>
