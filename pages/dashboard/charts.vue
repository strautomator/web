<template>
    <v-layout column>
        <v-container fluid>
            <h1 class="mb-4">Charts</h1>
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
        </v-container>
    </v-layout>
</template>

<script>
import _ from "lodash"
import Chart from "chart.js"
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
            {value: "4w", text: "Last 4 weeks"},
            {value: "3m", text: "Last 3 months"},
            {value: "6m", text: "Last 6 months"}
        ]

        return {
            loading: true,
            chartSource: "automations",
            chartSourceList: chartSourceList,
            chartTypeList: chartTypeList,
            period: "3m",
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
            this.processedActivities = await this.$axios.$get("/api/strava/activities/processed")
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

            const dayFormat = "MMM Do"
            const monthFormat = "MMM YY"
            const now = this.$moment()
            const datasets = []
            const labels = []

            // Default colours.
            const bgColors = ["#F44336AA", "#9C27B0AA", "#3F51B5AA", "#00BCD4AA", "#009688AA", "#CDDC39AA", "#795548AA", "#607D8BAA", "#4CAF50AA"]

            // Duplicate downloaded activities so we can process them.
            const activities = _.cloneDeep(this.processedActivities)

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

            // Build chart data depending on the period.
            if (this.period == "4w") {
                now.subtract(28, "days")
                _.remove(activities, this.getActivityDateFilter(now))

                for (let i = 14; i > 0; i--) {
                    now.add(2, "day")
                    labels.push(now.format(dayFormat))
                    this.populateDatapoints(datasets, activities, now)
                }
            } else if (this.period == "3m") {
                now.subtract(3, "months")
                _.remove(activities, this.getActivityDateFilter(now))

                for (let i = 12; i > 0; i--) {
                    now.add(7, "days")
                    labels.push(now.format(dayFormat))
                    this.populateDatapoints(datasets, activities, now)
                }
            } else if (this.period == "6m") {
                now.subtract(6, "months")
                _.remove(activities, this.getActivityDateFilter(now))

                for (let i = 12; i > 0; i--) {
                    now.add(15, "days")
                    labels.push(now.format(dayFormat))
                    this.populateDatapoints(datasets, activities, now)
                }
            }

            // Destroy existing chart.
            if (this.$data.chart) {
                this.$data.chart.destroy()
            }

            // Create Chart.js on canvas.
            const ctx = document.getElementById("main-chart")
            this.$data.chart = new Chart(ctx, {
                type: this.chartType,
                options: {
                    responsive: true,
                    lineTension: 1,
                    scales: {
                        yAxes: [
                            {
                                ticks: {
                                    precision: 0,
                                    suggestedMax: this.suggestedMax
                                }
                            }
                        ]
                    }
                },
                data: {
                    labels: labels,
                    datasets: datasets
                }
            })
        },
        getActivityDateFilter(maxMoment) {
            return (a) => this.$moment(a.dateStart).unix() + (a.utcStartOffset || 0) <= maxMoment.unix()
        },
        populateDatapoints(datasets, activities, maxMoment) {
            const periodActivities = _.remove(activities, this.getActivityDateFilter(maxMoment))

            for (let ds of datasets) {
                const counter = _.filter(periodActivities, (a) => a.recipes[ds.uid]).length

                if (counter >= this.suggestedMax) {
                    this.suggestedMax = counter + 1
                }

                ds.data.push(counter)
            }
        }
    }
}
</script>
