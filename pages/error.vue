<template></template>

<script>
export default {
    asyncData({error, req, redirect}) {
        if (req) {
            if (req.error) {
                return error({title: req.error.title, message: req.error.message, statusCode: req.error.status})
            }

            if (req.query && req.query.status) {
                return error({title: req.query.title, message: req.query.message, statusCode: req.query.status})
            }
        }

        redirect("/")
    }
}
</script>
