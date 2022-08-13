<template>
    <v-layout column>
        <v-container fluid>
            <h1>
                Charts
                <v-btn class="float-right mt-3 text-h6 font-weight-bold" color="primary" to="/automations/history" title="Go to automation history" x-small fab rounded nuxt>
                    <v-icon small>mdi-history</v-icon>
                </v-btn>
            </h1>

            <v-card outlined>
                <v-card-text>
                    <div class="d-flex" :class="{'flex-column': !$breakpoint.mdAndUp}">
                        <div class="flex-grow-0">
                            <v-select label="Charts" v-model="chartSource" :items="chartSourceList" :class="{'mr-2': $breakpoint.mdAndUp}" outlined rounded dense return-object></v-select>
                        </div>
                        <div class="flex-grow-0">
                            <v-select label="Period" v-model="period" :items="periodList" :class="{'mr-2': $breakpoint.mdAndUp}" outlined rounded dense></v-select>
                        </div>
                        <div class="flex-grow-0">
                            <v-select label="Chart style" v-model="chartType" :items="chartTypeList" outlined rounded dense></v-select>
                        </div>
                    </div>
                    <div class="mt-4 pl-4 pr-4" v-if="loading">
                        <p>
                            <v-progress-circular class="mr-1 mt-n1" size="16" width="2" indeterminate></v-progress-circular>
                            Loading statistics...
                        </p>
                    </div>
                    <canvas id="main-chart" :height="$breakpoint.mdAndUp ? '' : '320'"></canvas>
                </v-card-text>
            </v-card>

            <v-alert class="mt-4 text-center text-md-left">
                <div class="mb-3 mb-md-0">
                    Thinking about the future instead?
                    <br v-if="!$breakpoint.mdAndUp" />
                    Try the <n-link to="/calendar/upcoming" title="View your upcoming club events on the map" nuxt>Upcoming Events Map</n-link>.
                </div>
            </v-alert>
        </v-container>
    </v-layout>
</template>

<script>
import Chart from "chart.js/auto"
import "chartjs-adapter-dayjs-3"
import _ from "lodash"
import userMixin from "~/mixins/userMixin.js"
import recipeMixin from "~/mixins/recipeMixin.js"

export default {
    authenticated: true,
    mixins: [userMixin, recipeMixin],
    head() {
        return {
            title: "Charts"
        }
    },
    data() {
        const chartSourceList = [{value: "automations", text: "Automations"}]

        const chartTypeList = [
            {value: "bar", text: "Bars"},
            {value: "line", text: "Lines"}
        ]

        const periodList = [
            {value: 28, text: "Last 4 weeks"},
            {value: 90, text: "Last 3 months"},
            {value: 180, text: "Last 6 months"},
            {value: 365, text: "Last year"}
        ]

        return {
            loading: true,
            dayFormat: "MMM Do",
            monthFormat: "MMM YYYY",
            chartSource: "automations",
            chartSourceList: chartSourceList,
            chartTypeList: chartTypeList,
            period: 28,
            periodList: periodList,
            chartType: "bar",
            suggestedMax: 1,
            dataPoints: null,
            processedActivities: null
        }
    },
    watch: {
        chartSource(newValue, oldValue) {
            if (newValue != oldValue) this.createChart()
        },
        period(newValue, oldValue) {
            if (newValue != oldValue) this.createChart()
        },
        chartType(newValue, oldValue) {
            if (newValue != oldValue) this.createChart()
        }
    },
    async fetch() {
        try {
            this.processedActivities = await this.$axios.$get(`/api/strava/${this.user.id}/activities/processed`)
        } catch (ex) {
            this.$webError("Charts.fetch", ex)
        }
    },
    mounted() {
        setTimeout(this.createChart, 1500)
    },
    beforeDestroy() {
        if (this.$data.chart) {
            this.$data.chart.destroy()
        }
    },
    methods: {
        createChart() {
            if (!this.processedActivities || this.processedActivities.length == 0) {
                return
            }

            if (this.loading) {
                this.loading = false
            }

            let now = this.$dayjs()
            const datasets = []

            // Default colours.
            const bgColors = ["#F44336AA", "#9C27B0AA", "#3F51B5AA", "#00BCD4AA", "#009688AA", "#CDDC39AA", "#795548AA", "#607D8BAA", "#4CAF50AA"]

            // Duplicate downloaded activities so we can process them.
            const activities = _.cloneDeep(this.processedActivities)

            // Get time unit depending on selected period.
            const timeUnit = this.period > 90 ? "month" : this.period > 28 ? "week" : "day"

            // Iterate user recipes to build the individual datasets.
            for (let recipe of Object.values(this.$store.state.user.recipes)) {
                const dataset = {
                    uid: recipe.id,
                    label: recipe.title,
                    data: []
                }

                if (this.chartType == "bar") {
                    dataset.backgroundColor = bgColors.shift()
                } else {
                    dataset.borderColor = bgColors.shift()
                }

                datasets.push(dataset)
            }

            // Reset suggested max.
            this.suggestedMax = 1

            // Removed older activities.
            now = now.subtract(this.period, "days")
            _.remove(activities, this.getActivityDateFilter(now))

            // Iterate to create the data points.
            for (let i = this.period; i > 0; i--) {
                if (this.period > 180) {
                    i -= 14
                    now = now.add(15, "days")
                } else if (this.period > 90) {
                    i -= 6
                    now = now.add(7, "days")
                } else {
                    now = now.add(1, "days")
                }

                this.populateDatapoints(datasets, activities, now)
            }

            // Canvas object.
            const ctx = document.getElementById("main-chart")

            // Destroy existing chart.
            if (this.$data.chart) {
                this.$data.chart.destroy()
                ctx.innerHTML = ""
            }

            // Create Chart.js on canvas.
            this.$data.chart = new Chart(ctx, {
                type: this.chartType,
                options: {
                    responsive: true,
                    lineTension: 1,
                    scales: {
                        x: {
                            axis: "x",
                            type: "time",
                            time: {
                                unit: timeUnit,
                                tooltipFormat: "YYYY-MM-DD"
                            }
                        },
                        y: {
                            axis: "y",
                            suggestedMax: this.suggestedMax,
                            ticks: {
                                precision: 0
                            }
                        }
                    },
                    tooltips: {
                        callbacks: {
                            title: (items, data) => {
                                const tti = items[0]
                                const tDate = tti.label.toString()

                                if (this.period > 180) {
                                    const fromDate = this.$dayjs(tDate).subtract(15, "days")
                                    const toDate = this.$dayjs(tDate)
                                    return `${fromDate.format(this.dayFormat)} to ${toDate.format(this.dayFormat)}`
                                }

                                if (this.period > 90) {
                                    const fromDate = this.$dayjs(tDate).subtract(7, "days")
                                    const toDate = this.$dayjs(tDate)
                                    return `${fromDate.format(this.dayFormat)} to ${toDate.format(this.dayFormat)}`
                                }

                                return this.$dayjs(tti.label).format(this.dayFormat)
                            }
                        }
                    }
                },
                data: {
                    datasets: datasets
                }
            })
        },
        getActivityDateFilter(maxMoment) {
            return (a) => this.$dayjs(a.dateStart).unix() + (a.utcStartOffset || 0) <= maxMoment.utc().unix()
        },
        populateDatapoints(datasets, activities, maxMoment) {
            const periodActivities = _.remove(activities, this.getActivityDateFilter(maxMoment))

            for (let ds of datasets) {
                const counter = _.filter(periodActivities, (a) => a.recipes[ds.uid]).length

                if (counter >= this.suggestedMax) {
                    this.suggestedMax = counter + 1
                }

                ds.data.push({x: maxMoment.toDate(), y: counter})
            }
        }
    }
}
</script>
