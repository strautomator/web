<template></template>

<script>
export default {
    asyncData({error, req, redirect}) {
        if (req) {
            if (req.error) {
                return error({message: req.error.message, statusCode: req.error.status})
            }

            if (req.query && req.query.status == "401") {
                return error({statusCode: 401})
            }
        }

        redirect("/")
    }
}
</script>
