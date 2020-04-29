export const state = () => ({
    user: null,
    recipeProperties: null,
    recipeActions: null,
    recipeMaxLength: 100
})

export const getters = {
    user(state) {
        return state.user
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
            await dispatch("fetchUser")
        }
    },
    async fetchUser({commit, state}) {
        let oauth = state.oauth

        try {
            this.$axios.setToken(oauth.accessToken)

            const user = await this.$axios.$get(`/api/users/${oauth.userId}`)
            commit("setUser", user)
        } catch (ex) {
            if (process.server) {
                const logger = require("anyhow")
                logger.error("Store.fetchUser", `User ${oauth.userId}`, ex)
            }
        }
    }
}
