<template>
    <div>
        <v-badge color="primary" offset-x="18" offset-y="18" v-if="unreadCount > 0" :content="unreadCount" bordered>
            <v-btn @click="togglePanel()" icon>
                <v-icon>mdi-bell</v-icon>
            </v-btn>
        </v-badge>
        <v-snackbar v-model="visible" color="accent" elevation="24" timeout="-1" :max-width="960" :width="960" multi-line vertical rounded top>
            <template v-slot:action="{attrs}">
                <v-btn v-if="unreadCount < 1" v-bind="attrs" color="primary" title="Close notifications" @click="hidePanel()" rounded text>
                    Close
                    <v-icon>mdi-close</v-icon>
                </v-btn>
                <v-btn v-else v-bind="attrs" color="primary" title="Go to next notification" @click="getNextUnread()" rounded text>
                    Next
                    <v-icon>mdi-arrow-right-bold</v-icon>
                </v-btn>
            </template>
            <template v-if="currentNotification">
                <div class="text-body-1 font-weight-bold secondary--text">{{ currentNotification.title }}</div>
                <div class="caption">{{ $moment(currentNotification.dateCreated).format("lll") }}</div>
                <div class="mt-2">{{ currentNotification.body }}</div>
            </template>
        </v-snackbar>
    </div>
</template>

<script>
import _ from "lodash"

export default {
    authenticated: true,
    data() {
        return {
            currentNotification: null,
            notifications: [],
            unreadCount: 0,
            visible: false
        }
    },
    async fetch() {
        try {
            this.notifications = await this.$axios.$get(`/api/notifications/unread`)
            this.unreadCount = this.notifications.length
        } catch (ex) {
            this.notifications = []
            this.$webError("Notifications.fetch", ex)
        }
    },
    methods: {
        hidePanel() {
            this.visible = false
        },
        togglePanel() {
            if (this.visible) {
                this.hidePanel()
            } else {
                this.getNextUnread()
                this.visible = true
            }
        },
        getNextUnread() {
            this.currentNotification = _.find(this.notifications, {read: false})

            if (this.currentNotification) {
                this.markAsRead(this.currentNotification)
            }
        },
        async markAsRead(notification) {
            try {
                this.unreadCount--
                notification.read = true
                await this.$axios.$post(`/api/notifications/read/${notification.id}`, null, {progress: false})
            } catch (ex) {
                console.error("Notifications.markAsRead", `Notification ${notification.id}`)
                console.error(ex)
            }
        }
    }
}
</script>
