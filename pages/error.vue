<template></template>

<script>
export default {
    asyncData({error, req, redirect}) {
        if (req) {
            if (req.error) {
                return error({title: req.error.title || "", description: req.error.message || "", status: req.error.status})
            }

            if (req.query && req.query.status) {
                return error({title: req.query.title || "", description: req.query.message || "", status: req.query.status})
            }
        }

        redirect("/")
    }
}
</script>
