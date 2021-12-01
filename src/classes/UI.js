module.exports = class UI {
  constructor (game) {
    this.game = game
    this.menus = {}
    this.activeMenuId = null
    this.context = ''
  }

  addMenu(menu) {
    this.menus[menu.id] = menu
  }

  setActiveMenu(menuId) {
    this.activeMenuId = menuId
  }

  getActiveMenu() {
    if (typeof this.activeMenuId === 'string') return this.menus[this.activeMenuId]
    else return null
  }
  
  clearActiveMenu() {
    this.activeMenuId = null
  }

  setContext(context) {
    this.context = context
  }

  moveCursor(x, y) {
    this.getActiveMenu().moveCursor(x, y)
  }

  confirm() {}

  cancel() {}
}
