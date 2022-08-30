import Vue from "vue"

Vue.prototype.$getLocalStorage = (key) => {
    try {
        if (process.server) {
            return null
        }

        const itemJson = window.localStorage.getItem(key)
        if (!itemJson) {
            return null
        }

        const item = JSON.parse(itemJson)
        if (!item || (item.expires && item.expires < Math.round(new Date().valueOf() / 1000))) {
            return null
        }

        return item.data
    } catch (ex) {
        console.error("Vue.getLocalStorage", key, ex)
        return null
    }
}

Vue.prototype.$setLocalStorage = (key, data, maxAgeSeconds) => {
    try {
        if (process.server) {
            return
        }

        const item = {data: data}

        // Optional age to set the expiration timestamp (as seconds).
        if (maxAgeSeconds) {
            item.expires = Math.round(new Date().valueOf() / 1000) + maxAgeSeconds
        }

        window.localStorage.setItem(key, JSON.stringify(item, null, 0))
    } catch (ex) {
        console.error("Vue.setLocalStorage", key, ex)
    }
}
