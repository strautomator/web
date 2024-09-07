<template>
    <v-dialog v-model="visible" width="440" overlay-opacity="0.95">
        <v-card>
            <v-toolbar color="primary">
                <v-toolbar-title>Change email address</v-toolbar-title>
                <v-spacer></v-spacer>
                <v-toolbar-items>
                    <v-btn icon @click.stop="hideDialog">
                        <v-icon>mdi-close</v-icon>
                    </v-btn>
                </v-toolbar-items>
            </v-toolbar>
            <v-card-text>
                <v-form v-model="emailValid" ref="emailForm">
                    <p class="mt-3">
                        Please enter your email address below.<br />
                        You'll get a message with a link to confirm it.
                    </p>
                    <div>
                        <v-text-field v-model="userEmail" label="Email" placeholder="@" maxlength="150" :loading="saving" :rules="inputRules" :error-messages="serverError" validate-on-blur outlined rounded></v-text-field>
                    </div>
                </v-form>
                <div class="text-right">
                    <v-spacer></v-spacer>
                    <v-btn class="mr-2" color="grey" title="Stay here" @click.stop="hideDialog" text rounded>
                        <v-icon left>mdi-cancel</v-icon>
                        Cancel
                    </v-btn>
                    <v-btn color="primary" title="Save email address" :disabled="userEmail.length < 6" @click="saveEmail" rounded>
                        <v-icon left>mdi-check</v-icon>
                        Save email
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
    props: ["show-dialog"],
    data() {
        return {
            userEmail: this.$store.state.user.email || "",
            emailValid: false,
            emailSaved: false,
            saving: false,
            serverError: []
        }
    },
    computed: {
        visible() {
            return this.showDialog
        },
        inputRules() {
            const rules = {
                required: (value) => !!value || "Email is required",
                email: (value) => {
                    const pattern = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
                    return pattern.test(value) || "Invalid email address"
                }
            }

            return [rules.required, rules.email]
        }
    },
    methods: {
        hideDialog() {
            this.$emit("closed", this.emailSaved)
            this.emailSaved = false
        },
        async saveEmail() {
            try {
                if (this.$refs.emailForm.validate()) {
                    if (this.userEmail != this.$store.state.user.email) {
                        this.saving = true
                        await this.$axios.$post(`/api/users/${this.user.id}/email`, {email: this.userEmail})
                        this.saving = false

                        this.$store.commit("setUserData", {email: this.userEmail})
                        this.emailSaved = true
                    }

                    this.hideDialog()
                }
            } catch (ex) {
                this.saving = false

                if (ex.response && ex.response.data.message) {
                    this.serverError = [ex.response.data.message]
                } else {
                    this.$webError(this, "EmailDialog.saveEmail", ex)
                }
            }
        }
    }
}
</script>
