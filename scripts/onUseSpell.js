module.exports = function onUseSpell(game, helpers, spell) {
  // TODO get user entity rather than player
  const caster = game.getPlayer()
  const target = game.getTargetOf(caster.id)
  var success = true

  if ( !enoughFp(game, caster, spell) ) { return false }

  spell.useEffects.forEach(effectName => {
    switch (effectName) {
      case  'heal-self': success =   effectHeal(game, helpers, spell, caster, caster); break;
      case 'heal-other': success =   effectHeal(game, helpers, spell, caster, target); break;
      case       'harm': success =   effectHarm(game, helpers, spell, caster, target); break;
      case      'spawn': success =        spawn(game, helpers, spell, caster, target); break;
    }
  })

  game.addMessage(`You cast ${spell.name}.`)
  const flavor = success ? spell.useFlavorSuccess : spell.useFlavorFailure
  game.addMessage(flavor)
  helpers.adjustAp(caster, -spell.useApCost)
  helpers.adjustFp(caster, -spell.useFpCost)
}

function enoughFp(game, caster, spell) {
  if (caster.fp < spell.useFpCost) {
    if ( caster.tags.includes('player') ) game.addMessage('Not enough FP.')
    return false
  }

  return true
}

function checkTarget(game, target) {
  if (!target) {
    if ( caster.tags.includes('player') ) game.addMessage('The spell requires a target.')
    return false
  }
}

function effectHeal(game, helpers, spell, caster, target) {
  var success = true

  if ( !checkTarget(game, target) ) return false

  const useDiceCount = spell.level + Math.floor(spell.level / 2)
  const useDiceSize = 4

  if (target.hp >= target.hpMax) return false

  // TODO game.healCreature
  target.hp += helpers.diceRoll(useDiceCount, useDiceSize) + spell.level

  if (target.hp > target.hpMax) {
    target.hp = target.hpMax
  }

  return success
}

function effectHarm(game, helpers, spell, caster, target) {
  var success = true

  if (!checkTarget(game, target)) return false

  const useDiceCount = spell.level + Math.floor(spell.level / 2)
  const useDiceSize = 4
  const total = helpers.diceRoll(useDiceCount, useDiceSize) + spell.level
  // TODO game.damageCreature
  target.hp -= total
  if (target.hp < target.hpMax) {target.hp = target.hpMax}

  return success
}

function spawn(game, helpers, spell, caster, target) {
  success = true
  spell.inventory.forEach(entityId => {
    const entity = game.addEntity(entityId)
    entity.x = caster.x
    entity.y = caster.y
  })
  return success
}