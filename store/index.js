export const state = () => ({
    user: null,
    lastUserFetch: null,
    recipeProperties: null,
    recipeActions: null,
    recipeMaxLength: null
})

export const getters = {
    user(state) {
        return state.user
    },
    lastUserFetch(state) {
        return state.lastUserFetch
    }
}

export const mutations = {
    setRecipeOptions(state, data) {
        state.recipeProperties = data.recipeProperties
        state.recipeActions = data.recipeActions
        state.recipeMaxLength = data.recipeMaxLength
    },
    setUser(state, data) {
        state.user = data
    },
    setUserSubscription(state, data) {
        state.user.subscription = data
    },
    setLastUserFetch(state, data) {
        state.lastUserFetch = data
    },
    addUserRecipe(state, recipe) {
        state.user.recipes[recipe.id] = recipe
    },
    deleteUserRecipe(state, recipe) {
        delete state.user.recipes[recipe.id]
    }
}

export const actions = {
    async nuxtServerInit({commit, dispatch, state}) {
        if (process.server) {
            const core = require("strautomator-core")
            const settings = require("setmeup").settings

            const recipeOptions = {
                recipeProperties: core.recipes.propertyList,
                recipeActions: core.recipes.actionList,
                recipeMaxLength: settings.recipes.maxLength
            }

            commit("setRecipeOptions", recipeOptions)
        }

        let user = state.user
        let oauth = state.oauth

        if (!user && oauth && oauth.accessToken) {
            await dispatch("assignUser")
        }
    },
    async assignUser({commit, state}) {
        let user = state.oauth.user
        commit("setUser", user)
    }
}
