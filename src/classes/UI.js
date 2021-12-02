const Menu = require('./Menu')

module.exports = class UI {
  constructor () {
    this.menus = {}
    this.activeMenuId = null
    this.context = 'map'
    
    EVENT.subscribe('ui', 'uiSetContext', this.onSetContext.bind(this))
    EVENT.subscribe('ui', 'uiSetActiveMenu', this.onSetActiveMenu.bind(this))

    this.addMenus(['ui-menu-gameplay', 'ui-menu-system'])
  }

  addMenus(menus) {
    menus.forEach(menu => {
      this.addMenuTemplate(menu)
    })
  }

  onSetContext(context) {
    this.clearActiveMenu()
    this.setContext(context)
  }

  onSetActiveMenu(id) {
    if (!this.menus[id]) this.addMenuTemplate(id)
    this.setActiveMenu(id)
  }

  addMenu(menuParams) {
    this.menus[menuParams.id] = new Menu(menuParams)
  }

  addMenuTemplate(id) {
    const params = LOADER.loadTemplate(id)
    this.menus[params.id] = new Menu(params)
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

  confirmIndex(index) {
    const menu = this.getActiveMenu()
    if (!menu) return
    if (menu.selectIndex(index)) this.confirm()
  }

  confirm() {
    const menu = this.getActiveMenu()
    const event = menu.getSelected().event
    EVENT.fire(event.name, event.params)
  }

  cancel() {}
}
