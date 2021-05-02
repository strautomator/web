<template>
    <v-layout column>
        <v-container fluid>
            <h1>Notifications</h1>
            <div v-if="unreadNotifications.length > 0">
                <v-alert class="mb-4" v-for="notification in unreadNotifications" :key="notification.id">
                    <div class="text-body-1 font-weight-bold secondary--text">{{ notification.title }}</div>
                    <div class="caption">{{ $dayjs(notification.dateCreated).format("lll") }}</div>
                    <div class="mt-2">{{ notification.body }}</div>
                </v-alert>
            </div>
            <div v-else>
                <v-alert class="mb-4" icon="mdi-bell-outline">You have no unread notifications!</v-alert>
            </div>
            <template v-if="readNotifications.length > 0">
                <v-card class="mt-6" outlined>
                    <v-card-title class="accent"> Previous Notifications </v-card-title>
                    <v-card-text>
                        <div class="mt-4">
                            <p>These will be deleted automatically after a few days.</p>
                            <div class="mt-4 mb-2" v-for="notification in readNotifications" :key="notification.id">
                                <v-divider class="mb-2" />
                                <div class="secondary--text">{{ notification.title }}</div>
                                <div class="caption">{{ $dayjs(notification.dateCreated).format("lll") }}</div>
                                <div class="mt-2">{{ notification.body }}</div>
                            </div>
                        </div>
                    </v-card-text>
                </v-card>
            </template>
            <div class="mt-4 text-center text-md-left">
                <v-btn color="primary" to="/account" title="Back to my account" small rounded outlined nuxt>
                    <v-icon left>mdi-arrow-left</v-icon>
                    Back to my account
                </v-btn>
            </div>
        </v-container>
    </v-layout>
</template>

<script>
import _ from "lodash"
import userMixin from "~/mixins/userMixin.js"

export default {
    authenticated: true,
    mixins: [userMixin],
    head() {
        return {
            title: "Notifications"
        }
    },
    data() {
        return {
            unreadNotifications: [],
            readNotifications: [],
            timerMarkAllRead: null
        }
    },
    mounted() {
        if (this.unreadNotifications.length > 0) {
            const timeout = this.unreadNotifications.length * 3000
            this.timerMarkAllRead = setTimeout(this.markAllRead, timeout)
        }
    },
    beforeDestroy() {
        if (this.timerMarkAllRead) {
            clearTimeout(this.timerMarkAllRead)
            this.timerMarkAllRead = null
        }
    },
    async fetch() {
        try {
            const notifications = await this.$axios.$get(`/api/notifications/all`)

            this.unreadNotifications = _.remove(notifications, {read: false})
            this.readNotifications = _.remove(notifications, {read: true})
        } catch (ex) {
            this.notifications = []
            this.$webError("NotificationHistory.fetch", ex)
        }
    },
    methods: {
        async markAllRead() {
            const ids = _.map(this.unreadNotifications, "id")

            try {
                await this.$axios.$post(`/api/notifications/read`, ids)
            } catch (ex) {
                console.error("NotificationHistory.markAllRead", `Notifications: ${ids.join(", ")}`)
                console.error(ex)
            }
        }
    }
}
</script>
