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

    const template = yaml.parse(this.loadText(url))

    this.templateCache[templateName] = template

    return template
  }

  loadScript(scriptName) {
    if (this.scriptCache[scriptName]) return this.scriptCache[scriptName]

    const url = `${this.scriptsPath}/${scriptName}.js`

    const scriptString = this.loadText(url)
    const script = eval(scriptString)

    this.scriptCache[scriptName] = script

    return script
  }
}
