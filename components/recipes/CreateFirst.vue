<template>
    <div>
        <v-card outlined>
            <v-card-text>
                <div class="text-center text-md-left">
                    <p>
                        You haven't created any automations yet.
                    </p>
                    <v-btn color="primary" to="/automations/edit" title="Create a new automation" rounded nuxt>Create your first automation</v-btn>
                </div>
            </v-card-text>
        </v-card>
        <v-card class="mt-6" outlined>
            <v-card-title>
                What is an automation?
            </v-card-title>
            <v-card-text>
                <p>
                    An automation is a recipe with conditions and actions to be carried on your Strava activities.
                </p>
                <p>
                    For example you might want to mark as commute your rides starting between 9AM and 10AM and having a maximum distance of 19km.
                </p>
            </v-card-text>
        </v-card>
    </div>
</template>
