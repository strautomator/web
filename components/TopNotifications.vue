<template>
    <div>
        <v-badge color="primary" offset-x="18" offset-y="18" v-if="unreadCount > 0" :content="unreadCount" bordered>
            <v-btn @click="togglePanel()" title="View my notifications" icon>
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
                <div class="caption">{{ $dayjs(currentNotification.dateCreated).format("lll") }}</div>
                <div class="mt-2">
                    {{ currentNotification.body }}
                    <n-link v-if="currentNotification.href" :to="currentNotification.href" title="Fix notification" nuxt><v-icon color="secondary" @click="hidePanel()" small>mdi-open-in-new</v-icon></n-link>
                </div>
            </template>
        </v-snackbar>
    </div>
</template>

<script>
import _ from "lodash"
import userMixin from "~/mixins/userMixin.js"

export default {
    authenticated: true,
    mixins: [userMixin],
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
            const bikes = _.map(this.user.profile.bikes, "id")
            const shoes = _.map(this.user.profile.shoes, "id")
            const gearIds = _.concat(bikes, shoes, ["none"])
            const recipes = Object.entries(this.user.recipes)

            this.notifications = await this.$axios.$get(`/api/notifications/${this.user.id}/unread`)
            this.unreadCount = this.notifications.length

            for (let [id, recipe] of recipes) {
                for (let action of recipe.actions) {
                    if (action.type == "gear" && gearIds.indexOf(action.value) < 0) {
                        const title = `Invalid gear ${action.value}: ${action.friendlyValue}`
                        const body = `Your automation "${recipe.title}" has an invalid gear set. Please update it or delete it to avoid triggering unnecessary alerts.`
                        const href = `/automations/edit?id=${recipe.id}`
                        this.addNotification(title, body, href)
                    }
                }
            }
        } catch (ex) {
            this.$webError("TopNotifications.fetch", ex)
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
        addNotification(title, body, href) {
            const notification = {title: title, body: body, href: href, read: false, dateCreated: new Date()}
            this.notifications.push(notification)
            this.unreadCount++
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

                if (notification.id) {
                    await this.$axios.$post(`/api/notifications/read`, [notification.id], {progress: false})
                }
            } catch (ex) {
                console.error("TopNotifications.markAsRead", `Notification ${notification.id}`)
                console.error(ex)
            }
        }
    }
}
</script>
