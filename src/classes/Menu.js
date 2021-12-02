const helpers = require('../helpers')

module.exports = class Menu {
  constructor(params) {
    this.id = params.id || `menu-untitled-${Math.random()}`
    this.title = params.title || 'Menu'
    this.popup = params.popup || false
    this.x = params.x || 0
    this.y = params.y || 0
    this.items = params.items

    this.cursorPos = {x: 0, y: 0}
  }

  selectIndex(index) {
    if (index > this.items.length - 1) return false
    this.cursorPos.y = index
    return true
  }

  moveCursor(x, y) {
    this.cursorPos.y = helpers.clamp(
      this.cursorPos.y + y,
      0, 
      this.items.length - 1
    )

    this.cursorPos
  }

  getSelected() {
    return this.items[this.cursorPos.y]
  }
}