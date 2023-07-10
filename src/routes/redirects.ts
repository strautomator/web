// Redirection routes

export default function (req, res, next) {
    const settings = require("setmeup").settings
    const redirect = settings.app.redirects.find((r) => r.from === req.url)

    if (redirect) {
        res.writeHead(301, {Location: redirect.to})
        res.end()
    } else {
        next()
    }
}
