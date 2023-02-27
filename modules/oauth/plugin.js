/* eslint-disable import/no-unresolved, import/no-extraneous-dependencies, prefer-template */
import middleware from "@@/.nuxt/middleware"

const moduleName = "oauth"

const initStore = async (context) => {
    if (!context.store) {
        context.error("The OAuth module requires a Vuex store")
        return
    }

    context.store.registerModule(moduleName, {
        namespaced: true,
        state: {
            userId: context.req && context.req.userId,
            accessToken: context.req && context.req.accessToken
        }
    })
}

const isAuthenticatedRoute = (component) => (typeof component.options.authenticated === "function" ? component.options.authenticated(component) : component.options.authenticated)

const checkAuthenticatedRoute = ({route: {matched}}) =>
    process.client
        ? matched.some(({components}) => Object.values(components).some((c) => isAuthenticatedRoute(c)))
        : matched.some(({components}) => components && Object.values(components).some(({_Ctor}) => _Ctor && Object.values(_Ctor).some((c) => c && c.options && isAuthenticatedRoute(c))))

const redirectToOAuth = ({redirect}, action, redirectUrl = "") => {
    const encodedRedirectUrl = `/auth/${action}?redirect-url=${encodeURIComponent(redirectUrl)}`

    if (process.client) {
        window.location.assign(encodedRedirectUrl)
    } else {
        redirect(302, encodedRedirectUrl)
    }
}

const redirectToAccessDenied = () => {
    const encodedRedirectUrl = `/error?status=403&message=${encodeURIComponent("You don't have access to this environment.")}`

    if (process.client) {
        window.location.assign(encodedRedirectUrl)
    } else {
        redirect(302, encodedRedirectUrl)
    }
}

middleware.auth = (context) => {
    const isAuthenticated = checkAuthenticatedRoute(context)
    const accessToken = context.store.state[moduleName]?.accessToken || null

    if (!isAuthenticated || (accessToken && !context.req?.accessDenied)) {
        return
    }

    if (context.req?.accessDenied) {
        redirectToAccessDenied()
    } else {
        redirectToOAuth(context, "login", context.route.fullPath)
    }
}

export default async (context, inject) => {
    await initStore(context)

    const createAuth =
        (action) =>
        (redirectUrl = context.route.fullPath) =>
            redirectToOAuth(context, action, redirectUrl)

    inject("login", createAuth("login"))
    inject("logout", createAuth("logout"))
}
