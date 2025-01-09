<template>
    <v-dialog v-model="visible" width="540" overlay-opacity="0.95" persistent>
        <v-card>
            <v-toolbar color="primary">
                <v-toolbar-title>{{ deviceId }}</v-toolbar-title>
                <v-spacer></v-spacer>
                <v-toolbar-items>
                    <v-btn icon @click.stop="hideDialog">
                        <v-icon>mdi-close</v-icon>
                    </v-btn>
                </v-toolbar-items>
            </v-toolbar>
            <v-card-text>
                <v-form v-model="deviceValid" ref="deviceForm">
                    <p class="mt-3">Please enter a friendly name for this device:</p>
                    <div>
                        <v-text-field v-model="deviceName" label="Device name" maxlength="50" :loading="saving" :error-messages="serverError" validate-on-blur outlined rounded></v-text-field>
                    </div>
                </v-form>
                <div class="text-right">
                    <v-spacer></v-spacer>
                    <v-btn class="mr-2" color="grey" title="Cancel and close dialog" @click.stop="hideDialog" text rounded>
                        <v-icon left>mdi-cancel</v-icon>
                        Cancel
                    </v-btn>
                    <v-btn color="primary" title="Save device name" @click="saveDeviceName" rounded>
                        <v-icon left>mdi-check</v-icon>
                        {{ !deviceName || deviceName.trim().length < 1 ? "Clear name" : "Save name" }}
                    </v-btn>
                </div>
            </v-card-text>
        </v-card>
    </v-dialog>
</template>

<script>
import _ from "lodash"
import userMixin from "~/mixins/userMixin.js"

export default {
    mixins: [userMixin],
    props: ["device-id", "device-name", "show-dialog"],
    data() {
        return {
            deviceSaved: false,
            deviceValid: false,
            saving: false,
            serverError: []
        }
    },
    computed: {
        visible() {
            return this.showDialog
        }
    },
    methods: {
        hideDialog() {
            this.$emit("closed", this.deviceSaved)
            this.deviceSaved = false
        },
        async saveDeviceName() {
            try {
                this.saving = true
                const deviceNames = await this.$axios.$post(`/api/users/${this.user.id}/fit-device-names`, {[this.deviceId]: this.deviceName})
                this.saving = false

                this.$store.commit("setUserData", {fitDeviceNames: deviceNames})
                this.deviceSaved = true

                this.hideDialog()
            } catch (ex) {
                this.saving = false

                if (ex.response && ex.response.data?.message) {
                    this.serverError = [ex.response.data.message]
                } else {
                    this.$webError(this, "FitDeviceNameDialog.saveDeviceName", ex)
                }
            }
        }
    }
}
</script>
