<template>
    <div class="mt-8 mb-4 text-left">
        <v-card color="black" class="mb-4 home-panel">
            <v-card-text>
                <h2 class="mb-4">Strautomator features</h2>
                <ul class="text-body-1 ml-n1">
                    <li><n-link to="/feature/weather" nuxt>Weather data on your activities</n-link></li>
                    <li><n-link to="/feature/commute" nuxt>Automatically tag your commutes</n-link></li>
                    <li><n-link to="/feature/counter" nuxt>Auto-incrementing activity counter</n-link></li>
                    <li><n-link to="/feature/gearwear" nuxt>Track your equipment mileage</n-link></li>
                    <li><n-link to="/feature/calendar" nuxt>Export your Strava calendar</n-link></li>
                    <li><n-link to="/feature/ftp" nuxt>Auto update your FTP</n-link></li>
                </ul>
            </v-card-text>
        </v-card>
    </div>
</template>
