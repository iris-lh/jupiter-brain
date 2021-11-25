const xterm = require('xterm')
const xtermAddonFit = require('xterm-addon-fit')

const Game = require('./classes/Game')
const Renderer = require('./classes/Renderer')

const game = new Game()

const renderer = new Renderer(game)

var term = new xterm.Terminal({cols: 90, rows:30, scrollback: 0});
const fitAddon = new xtermAddonFit.FitAddon();
term.loadAddon(fitAddon)
term.setOption('fontSize', '22')
term.open(document.getElementById('terminal'));
term.write(renderer.render(game))

let input = ''

term.focus()
fitAddon.fit()

window.onresize = e => {
  fitAddon.fit()
}

term.onKey(e => {
  if (e.key === '\r') {
    term.clear()
    game.loop(input)
    input = ''
    term.write('\r' + renderer.render(game))
  } 
  else if (e.domEvent.key === 'Escape' && game.state.uiContext !== 'map') {
    term.clear()
    game.loop('m')
    input = ''
    term.write('\r' + renderer.render(game))
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
    game.loop('n')
    term.write('\r' + renderer.render(game))
  }
  else if (e.domEvent.key === 'ArrowDown') {
    term.clear()
    game.loop('s')
    term.write('\r' + renderer.render(game))
  }
  else if (e.domEvent.key === 'ArrowLeft') {
    term.clear()
    game.loop('w')
    term.write('\r' + renderer.render(game))
  }
  else if (e.domEvent.key === 'ArrowRight') {
    term.clear()
    game.loop('e')
    term.write('\r' + renderer.render(game))
  }
  else {
    input += e.key
    term.write(e.key);
  }
});