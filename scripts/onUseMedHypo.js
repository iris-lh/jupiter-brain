const _ = require('lodash')

module.exports = function onUseMedHypo(game, helpers, item) {
  const player = game.getPlayer()

  // TODO this should be a game.healCreature function or something
  player.hp += helpers.diceRoll(item.useDiceCount, item.useDiceSize) + item.bonus
  if (player.hp > player.hpMax) {player.hp = player.hpMax}
  player.ap -= item.useApCostBase

  // TODO this should belong to a game.removeEntity function or something. Lodash doesnt belong here.
  player.inventory = _.without(player.inventory, item)
  game.state.entities = _.without(game.state.entities, item)
}