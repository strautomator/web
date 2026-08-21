<template>
    <v-layout column>
        <v-container fluid>
            <h1>Upload FIT files</h1>

            <v-alert class="mt-4" border="top" color="error" v-if="!user.isPro" colored-border>
                <div class="mt-1">Uploading FIT files is a PRO feature.</div>
                <v-btn class="mt-3" color="primary" title="Subscribe to PRO" to="/billing" small nuxt rounded>
                    <v-icon left>mdi-star</v-icon>
                    Get PRO
                </v-btn>
            </v-alert>

            <template v-else-if="!processing && !finished">
                <div class="mb-4">
                    Just linked your Garmin or Wahoo account? You can send your older activities to Strautomator by uploading them with a ZIP file. Useful in case you want to process older activities with automations that rely on sensors IDs or other
                    FIT-only data.
                </div>

                <ul class="ml-0 pl-4 pb-0 mb-4 mt-4">
                    <li>Export the FIT files from Garmin Connect or from the Wahoo app, and put them all in a single ZIP archive.</li>
                    <li>Up to {{ maxFiles }} FIT files per archive, with a maximum archive size of {{ maxSizeMB }}MB.</li>
                    <li>Files are extracted and processed one by one, so bigger archives simply take longer.</li>
                    <li>The parsed FIT data will be deleted from our database after some days.</li>
                </ul>

                <v-card class="mt-6" outlined>
                    <v-card-text class="pb-0">
                        <v-file-input v-model="file" label="ZIP archive with your FIT files" accept=".zip,application/zip" prepend-icon="mdi-folder-zip" :error-messages="fileError" outlined rounded dense show-size></v-file-input>
                        <div class="text-center text-md-right mb-4">
                            <v-btn color="primary" title="Upload and process the FIT files" @click="uploadFile" :disabled="!file" rounded>
                                <v-icon left>mdi-upload</v-icon>
                                Upload and process
                            </v-btn>
                        </div>
                    </v-card-text>
                </v-card>
            </template>

            <template v-else-if="processing">
                <v-card class="mt-4" outlined>
                    <v-card-title class="accent">Processing your activities</v-card-title>
                    <v-card-text class="pt-4">
                        <div class="mb-2">{{ progressText }}</div>
                        <v-progress-linear :value="progressValue" color="primary" height="12" rounded striped></v-progress-linear>
                        <div class="mt-4" v-if="results.length > 0">
                            <div class="caption" v-for="(result, index) in latestResults" :key="`processing-${index}`">
                                <v-icon class="mr-1" small>{{ getSourceIcon(result) }}</v-icon>
                                {{ result.filename }}
                            </div>
                        </div>
                    </v-card-text>
                </v-card>
            </template>

            <template v-else>
                <v-alert class="mt-4" border="top" color="error" v-if="jobError">
                    {{ jobError }}
                </v-alert>

                <v-card class="mt-4" outlined>
                    <v-card-title class="accent">{{ summaryTitle }}</v-card-title>
                    <v-card-text class="pt-4">
                        <p v-if="processedResults.length == 0">No valid Garmin or Wahoo FIT files were found in the uploaded archive.</p>
                        <v-simple-table v-else>
                            <thead v-if="$breakpoint.mdAndUp">
                                <tr>
                                    <th></th>
                                    <th>Activity</th>
                                    <th>Distance</th>
                                    <th>Total time</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="(result, index) in processedResults" :key="`processed-${index}`">
                                    <td width="1">
                                        <v-icon :title="result.source">{{ getSourceIcon(result) }}</v-icon>
                                    </td>
                                    <td>
                                        <div class="mt-2 mb-2">
                                            {{ result.name }}
                                            <br />
                                            {{ $dayjs(result.dateStart).format("lll") }}
                                        </div>
                                    </td>
                                    <td>{{ getDistance(result) }}</td>
                                    <td>{{ getDuration(result.totalTime) }}</td>
                                </tr>
                            </tbody>
                        </v-simple-table>

                        <div class="mt-6" v-if="failedResults.length > 0">
                            <div class="font-weight-bold mb-2">{{ failedResults.length }} file(s) could not be processed</div>
                            <ul class="ml-0 pl-4">
                                <li v-for="(result, index) in failedResults" :key="`failed-${index}`">{{ result.filename }}: {{ result.error }}</li>
                            </ul>
                        </div>

                        <div class="mt-6">
                            <v-btn class="mr-2 mb-2" color="primary" title="Upload another archive" @click="reset" small rounded>
                                <v-icon left>mdi-upload</v-icon>
                                Upload another archive
                            </v-btn>
                            <v-btn class="mb-2" color="primary" title="Go to my recent activities" to="/activities/recent" small nuxt rounded outlined>
                                <v-icon left>mdi-history</v-icon>
                                Recent activities
                            </v-btn>
                        </div>
                    </v-card-text>
                </v-card>
            </template>
        </v-container>
    </v-layout>
</template>

<script>
import userMixin from "~/mixins/userMixin.js"

export default {
    authenticated: true,
    mixins: [userMixin],
    head() {
        return {
            title: "Upload FIT files"
        }
    },
    data() {
        return {
            file: null,
            fileError: null,
            processing: false,
            finished: false,
            uploadPercent: 0,
            total: 0,
            results: [],
            jobError: null,
            maxSize: 104857600,
            maxFiles: 500
        }
    },
    computed: {
        maxSizeMB() {
            return Math.round(this.maxSize / 1024 / 1024)
        },
        progressValue() {
            if (this.total > 0) {
                return Math.round((this.results.length / this.total) * 100)
            }
            return this.uploadPercent
        },
        progressText() {
            if (this.total > 0) {
                return `Parsing the FIT files... ${this.results.length} of ${this.total} processed.`
            }
            if (this.uploadPercent < 100) {
                return `Uploading your archive... ${this.uploadPercent}%`
            }
            return "Extracting the FIT files from your archive..."
        },
        latestResults() {
            return this.results.slice(-5).reverse()
        },
        processedResults() {
            return this.results.filter((r) => !r.error)
        },
        failedResults() {
            return this.results.filter((r) => r.error)
        },
        summaryTitle() {
            return `${this.processedResults.length} activities processed`
        }
    },
    async fetch() {
        try {
            const limits = await this.$axios.$get("/api/fitupload/limits")
            this.maxSize = limits.maxSize
            this.maxFiles = limits.maxFiles
        } catch (ex) {
            this.$webError(this, "FitUpload.fetch", ex)
        }
    },
    methods: {
        getSourceIcon(result) {
            if (result.error) return "mdi-alert-circle-outline"
            return result.source == "wahoo" ? "mdi-alpha-w-circle" : "mdi-triangle"
        },
        getDistance(result) {
            if (!result.distance) return "-"
            const imperial = this.user.profile.units == "imperial"
            const distance = imperial ? result.distance * 0.621371 : result.distance
            return `${distance.toFixed(1)} ${imperial ? "mi" : "km"}`
        },
        getDuration(seconds) {
            if (!seconds) return "-"
            const duration = this.$dayjs.duration(seconds, "seconds")
            let hours = Math.floor(duration.asHours())
            let minutes = duration.minutes()
            if (hours < 10) hours = `0${hours}`
            if (minutes < 10) minutes = `0${minutes}`
            return `${hours}:${minutes}`
        },
        reset() {
            this.file = null
            this.fileError = null
            this.processing = false
            this.finished = false
            this.uploadPercent = 0
            this.total = 0
            this.results = []
            this.jobError = null
        },
        uploadFile() {
            if (!this.file) return

            if (this.file.size > this.maxSize) {
                this.fileError = `The archive is bigger than ${this.maxSizeMB}MB`
                return
            }

            this.fileError = null
            this.jobError = null
            this.results = []
            this.total = 0
            this.uploadPercent = 0
            this.processing = true

            // Results are streamed back as NDJSON, so we keep track of how much of the
            // response was already consumed and parse only the newly arrived lines.
            let parsedLength = 0
            const xhr = new XMLHttpRequest()

            const consume = () => {
                const text = xhr.responseText || ""
                const boundary = text.lastIndexOf("\n")
                if (boundary < parsedLength) return

                const lines = text.substring(parsedLength, boundary).split("\n")
                parsedLength = boundary + 1

                for (let line of lines) {
                    if (!line.trim()) continue

                    let data
                    try {
                        data = JSON.parse(line)
                    } catch (ex) {
                        continue
                    }

                    if (data.type == "start") {
                        this.total = data.total
                    } else if (data.type == "file") {
                        this.results.push(data.result)
                    } else if (data.type == "end") {
                        this.results = data.results
                    } else if (data.type == "error") {
                        this.jobError = data.message
                    }
                }
            }

            xhr.upload.onprogress = (e) => {
                if (e.lengthComputable) {
                    this.uploadPercent = Math.round((e.loaded / e.total) * 100)
                }
            }
            xhr.onprogress = consume
            xhr.onerror = () => {
                this.jobError = "The upload has failed, please try again."
                this.processing = false
                this.finished = true
            }
            xhr.onload = () => {
                if (xhr.status == 200) {
                    consume()
                } else {
                    let message = `Failed to process the archive (status ${xhr.status}).`
                    try {
                        message = JSON.parse(xhr.responseText).message || message
                    } catch (ex) {
                        // Response was not a JSON error.
                    }
                    this.jobError = message
                }

                this.processing = false
                this.finished = true
            }

            xhr.open("POST", `/api/fitupload/${this.user.id}/zip`)
            xhr.setRequestHeader("Authorization", `Bearer ${this.$store.state.oauth.accessToken}`)
            xhr.setRequestHeader("Content-Type", "application/zip")
            xhr.send(this.file)
        }
    }
}
</script>
