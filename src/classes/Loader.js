const yaml = require('yaml')

module.exports = class Loader {
  constructor() {
    this.templatesPath = 'templates'
    this.scriptsPath = 'scripts'

    this.templateCache = {}
    this.scriptCache = {}
  }

  loadText(url) {
    const request = new XMLHttpRequest
    request.open("GET", url, false);
    request.onerror = e => {
      console.error(xhr.statusText);
    }
    request.send(null)
    return request.responseText
  }

  loadTemplate(templateName) {
    if (this.templateCache[templateName]) return this.templateCache[templateName]

    const url = `${this.templatesPath}/${templateName}.yaml`
    const yamlStr = this.loadText(url)
    let parsedTemplate

    try {
      parsedTemplate = yaml.parse(yamlStr)
    } catch (error) {
      throw(`LOADER error: could not load template ${templateName}`)
    }

    this.templateCache[templateName] = parsedTemplate

    return parsedTemplate
  }

  loadScript(scriptName) {
    if (this.scriptCache[scriptName]) return this.scriptCache[scriptName]

    const url = `${this.scriptsPath}/${scriptName}.js`

    const scriptString = this.loadText(url)
    let script

    try {
      script = eval(scriptString)
    } catch (error) {
      throw(`LOADER error: could not load script ${scripteName}`)
    }

    this.scriptCache[scriptName] = script

    return script
  }
}
