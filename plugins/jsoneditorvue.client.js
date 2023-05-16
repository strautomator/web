import Vue from "vue"
import JsonEditorVue from "json-editor-vue"

Vue.use(JsonEditorVue, {
    mode: "text",
    askToFormat: false,
    mainMenuBar: false,
    navigationBar: false,
    statusBar: false
})
