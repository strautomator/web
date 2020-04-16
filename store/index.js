export const state = () => ({
    recipeProperties: null,
    recipeActions: null
})

export const mutations = {
    setRecipeOptions(state, data) {
        state.recipeProperties = data.recipeProperties
        state.recipeActions = data.recipeActions
        state.recipeMaxLength = data.recipeMaxLength
    }
}

export const actions = {
    nuxtServerInit({commit}) {
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
    }
}
