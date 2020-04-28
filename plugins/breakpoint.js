import Vue from "vue"

const defaults = {
    xs: true,
    xsOnly: false,
    sm: true,
    smOnly: true,
    smAndDown: true,
    smAndUp: false,
    md: false,
    mdOnly: false,
    mdAndDown: false,
    mdAndUp: false,
    lg: false,
    lgOnly: false,
    lgAndDown: false,
    lgAndUp: false,
    xl: false,
    xlOnly: false
}

Vue.prototype.$breakpoint = new Vue({
    data: () => ({...defaults})
})

export default async function({app}) {
    app.mixins = app.mixins || []
    app.watch = app.watch || {}

    for (const prop in defaults) {
        app.watch[`$vuetify.breakpoint.${prop}`] = function(value) {
            this.$breakpoint[prop] = value
        }
    }

    app.mixins.push({
        mounted() {
            for (const prop in defaults) {
                this.$breakpoint[prop] = this.$vuetify.breakpoint[prop]
            }
        }
    })
}
