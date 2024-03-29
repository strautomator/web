const {parse} = require("qs")
const Handler = require("./handler")

const setCustomValues = (options, req) => async (key) => {
    if (typeof options[key] !== "function") return
    options[key] = await options[key](req)
}

module.exports = (options) => async (req, res, next) => {
    const customKeys = ["oauthHost", "oauthClientID", "oauthClientSecret"]
    const optionSetter = setCustomValues(options, req)
    await Promise.all(customKeys.map(optionSetter))

    const handler = new Handler({req, res, next, options})

    // Refresh the token with the OAuth provider
    // useful for client side 401 handling
    if (handler.isRoute("refresh")) {
        const {accessToken} = (await handler.updateToken()) || {}
        res.writeHead(accessToken ? 200 : 401, {"Content-Type": "application/json"})

        if (accessToken) {
            const body = JSON.stringify({accessToken})
            return res.end(body)
        }

        const body = JSON.stringify({error: "Invalid session"})
        return res.end(body)
    }

    // Start the OAuth dance.
    if (handler.isRoute("login")) {
        const arrUrl = req.url.split("?")
        arrUrl.shift()

        const redirectUrl = parse(arrUrl.join("?"))["redirect-url"] || "/"
        return handler.redirectToOAuth(redirectUrl)
    }

    // Complete the OAuth dance.
    if (handler.isRoute("callback")) {
        return handler.authenticateCallbackToken()
    }

    // Clear the session.
    if (handler.isRoute("logout")) {
        return handler.logout()
    }

    // Check to see if the request has a valid bearer token.
    await handler.checkRequestAuthorization()

    // On any other route, refresh the token when necessary.
    await handler.updateToken()

    return next()
}
