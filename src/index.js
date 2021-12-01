const xterm = require('xterm')
const xtermAddonFit = require('xterm-addon-fit')

const Game = require('./classes/Game')
const Menu = require('./classes/Menu')
const Renderer = require('./classes/Renderer')
const UI = require('./classes/Ui')

const game = new Game()

const ui = new UI(game)
ui.addMenu(new Menu(
  'test-menu', 
  'Test Menu',
  0, 2,
  [
    {text: 'Status', event: {name: 'uiSetContext', params: 'status'}},
    {text: 'Inventory', event: {name: 'uiSetContext', params: 'inventory'}},
    {text: 'Equipment', event: {name: 'uiSetContext', params: 'equipment'}},
  ]
))
ui.setActiveMenu('test-menu')

const renderer = new Renderer(game)

var term = new xterm.Terminal({cols: 90, rows:30, scrollback: 0});
const fitAddon = new xtermAddonFit.FitAddon();
term.loadAddon(fitAddon)
term.setOption('fontSize', '22')
term.open(document.getElementById('terminal'));
term.write(renderer.render(game, ui))

let input = ''

term.focus()
fitAddon.fit()

window.onresize = e => {
  fitAddon.fit()
}

term.onKey(e => {
  const menu = ui.getActiveMenu()
  if (e.key === '\r') {
    term.clear()

    if (menu) console.log(menu.getSelected())
    else game.loop(input)

    input = ''
    term.write('\r' + renderer.render(game, ui))
  }
  else if (e.domEvent.key === 'Escape') {
    term.clear()
    if (menu) ui.clearActiveMenu()
    else ui.setActiveMenu('test-menu')
    input = ''
    term.write('\r' + renderer.render(game, ui))
  } 
  else if (e.domEvent.key === 'Backspace') {
    if (input.length) {
      input = input.substring(0, input.length - 1)
      term.write('\b')
      term.write(' ')
      term.write('\b')
    }
  } 
  else if (e.domEvent.key === 'ArrowUp') {
    term.clear()
    if (menu) ui.moveCursor(0, -1)
    else game.loop('n')
    term.write('\r' + renderer.render(game, ui))
  }
  else if (e.domEvent.key === 'ArrowDown') {
    term.clear()
    if (menu) ui.moveCursor(0, 1)
    else game.loop('s')
    term.write('\r' + renderer.render(game, ui))
  }
  else if (e.domEvent.key === 'ArrowLeft') {
    term.clear()
    if (menu) ui.moveCursor(-1, 0)
    else game.loop('w')
    term.write('\r' + renderer.render(game, ui))
  }
  else if (e.domEvent.key === 'ArrowRight') {
    term.clear()
    if (menu) ui.moveCursor(1, 0)
    else game.loop('e')
    term.write('\r' + renderer.render(game, ui))
  }
  else {
    input += e.key
    term.write(e.key);
  }
});