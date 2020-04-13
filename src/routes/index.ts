// Route for the root / path of the website.

export default function (req, res, next) {
    if (req.originalUrl != "/") {
        return next()
    }

    if (!req.headers.cookie || req.headers.cookie.toString().indexOf("strautsession=") < 0) {
        return res.redirect("/home")
    } else {
        return res.redirect("/dashboard")
    }
}
