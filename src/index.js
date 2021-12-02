const xterm = require('xterm')
const xtermAddonFit = require('xterm-addon-fit')

const Game = require('./classes/Game')
const Renderer = require('./classes/Renderer')
const Ui = require('./classes/Ui')
const EventSystem = require('./classes/EventSystem')
const Loader = require('./classes/Loader')

LOADER = new Loader()
EVENT = new EventSystem()
UI = new Ui()

const game = new Game()

const renderer = new Renderer(game)

var term = new xterm.Terminal({cols: 90, rows:30, scrollback: 0});
const fitAddon = new xtermAddonFit.FitAddon();
term.loadAddon(fitAddon)
term.setOption('fontSize', '22')
term.open(document.getElementById('terminal'));
term.write(renderer.render(game, UI))

let input = ''

term.focus()
fitAddon.fit()

window.onresize = e => {
  fitAddon.fit()
}

term.onKey(e => {
  const menu = UI.getActiveMenu()
  if (e.key === '\r') {
    term.clear()

    if (menu) UI.confirm()
    else game.loop(input)

    input = ''
    term.write('\r' + renderer.render(game, UI))
  }
  else if (e.domEvent.key === 'Escape') {
    term.clear()

    if (menu) UI.clearActiveMenu()
    else if (UI.context == 'map') EVENT.fire('uiSetActiveMenu', 'ui-menu-gameplay')
    else UI.setContext('map')

    input = ''
    term.write('\r' + renderer.render(game, UI))
  }
  else if (e.domEvent.key === 'Backspace') {
    if (input.length) {
      input = input.substring(0, input.length - 1)
      term.write('\b')
      term.write(' ')
      term.write('\b')
    }
  } 
  else if ('0123456789'.includes(e.domEvent.key) && menu) {
    term.clear()

    const index = parseInt(e.domEvent.key)
    UI.confirmIndex(index)

    term.write('\r' + renderer.render(game, UI))
  }
  else if (e.domEvent.key === 'ArrowUp') {
    term.clear()
    if (menu) UI.moveCursor(0, -1)
    else game.loop('n')
    term.write('\r' + renderer.render(game, UI))
  }
  else if (e.domEvent.key === 'ArrowDown') {
    term.clear()
    if (menu) UI.moveCursor(0, 1)
    else game.loop('s')
    term.write('\r' + renderer.render(game, UI))
  }
  else if (e.domEvent.key === 'ArrowLeft') {
    term.clear()
    if (menu) UI.moveCursor(-1, 0)
    else game.loop('w')
    term.write('\r' + renderer.render(game, UI))
  }
  else if (e.domEvent.key === 'ArrowRight') {
    term.clear()
    if (menu) UI.moveCursor(1, 0)
    else game.loop('e')
    term.write('\r' + renderer.render(game, UI))
  }
  else {
    input += e.key
    term.write(e.key);
  }
});