// Index

const expresser = require("expresser")
expresser.app.init()

app = expresser.app.get("/", (req, res) => {
    app.renderView(req, res, "index.html")
})
