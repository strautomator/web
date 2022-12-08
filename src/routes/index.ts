// Route for the root / path of the website.

export default function (req, res, next) {
    if (req.originalUrl != "/") {
        return next()
    }

    const settings = require("setmeup").settings

    // Force remove the www.
    if (req.hostname.toLowerCase().substring(0, 4) == "www.") {
        return res.redirect(301, settings.app.url)
    }

    // Logged users go to dashboard, others to home.
    if (!req.headers.cookie || !req.headers.cookie.toString().includes(`${settings.cookie.sessionName}=`)) {
        return res.redirect(302, "/home")
    } else {
        return res.redirect(302, "/dashboard")
    }
}
