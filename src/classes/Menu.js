const helpers = require('../helpers')

module.exports = class Menu {
  constructor(id, title, x, y, items) {
    this.id = id
    this.title = title
    this.x = x
    this.y = y
    this.items = items
    this.cursorPos = {x: 0, y: 0}
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