const _ = require('lodash')

const helpers = require('./helpers')
const storage = require('./storage')

module.exports = {
  handleContextMap(game) {game.switchUiContext('map')},
  handleContextInventory(game) {game.switchUiContext('inventory')},
  handleContextCharacterSheet(game) {game.switchUiContext('characterSheet')},
  handleContextMessageHistory(game) {game.switchUiContext('messageHistory')},
  handleContextDebug(game) {game.switchUiContext('debug')},
  handleContextSystem(game) {game.switchUiContext('system')},

  handleNewGame(game, commandSuffix) {
    game.state = _.merge({}, game.defaultState)
    game.addEntity('creature-player')
    game.goToNewMap()
    game.autoSave()
  },

  handleSave(game, commandSuffix) {
    const index = parseInt(commandSuffix)
    game.state.saveIndex = index

    storage.save(game, index)
  },

  handleLoad(game, commandSuffix) {
    const index = parseInt(commandSuffix)
    const save = storage.load(game.state.saveIndex)
    if (save) {
      game.state = save
    }
  },

  handleNewMap(game) {
    game.goToNewMap()
  },

  handleIncreaseAttribute(game, commandSuffix) {
    const index = parseInt(commandSuffix)
    const player = game.getPlayer()
    const attributes = [
      'int',
      'wis',
      'cha',
      'str',
      'dex',
      'con'
    ]
    const attributeName = attributes[index]
    if (player.nanites >= player.naniteCost) {
      const missingHp = player.hpMax - player.hp
      player.nanites -= player.naniteCost
      player.level += 1
      player[attributeName] += 1
      player.naniteCost = Math.floor(player.naniteCost * 1.618)
      
      player.hpMax = player.hpMax + player.hitDie / 2 + player.level * helpers.calculateAttributeMod(player.con)
      player.hp = player.hpMax - missingHp
      game.addMessage(`${attributeName.toUpperCase()} increased.`)

    }
    else {
      game.addMessage('Not enough nanites.')
    }
  },

  handleGrabItem(game, commandSuffix) {
    // TODO Do this with actions and make it cost AP
    const index = parseInt(commandSuffix)
    const player = game.getPlayer()
    const entity = game.getNearbyEntitiesWithout('player')[index]

    const grabable = entity.tags.includes('grabable')

    if (!entity) {
      game.addMessage('No item found.')
    }
    else if (grabable) {
      game.creatureGrabItem(player.id, entity.id)
    }
    else if (!grabable) {
      game.addMessage(`You cannot grab the ${entity.name}.`)
    }
    else {
      game.addMessage('No item found.')
    }
  },

  handleDropItem(game, commandSuffix) {
    const index = parseInt(commandSuffix)
    const player = game.getPlayer()
    if (player.inventory[index]) {
      game.creatureDropItem(player.id, index)
    }
  },

  handleRecycleItem(game, commandSuffix) {
    const index = parseInt(commandSuffix)
    const player = game.getPlayer()
    const item = player.inventory[index]
    if (item) {
      player.nanites += Math.floor(3 * 1.618**item.level-1)
      player.inventory = _.without(player.inventory, item)
    }
  },

  // handleEquipItem(game, commandSuffix) {
  //   const index = parseInt(commandSuffix)
  //   const player = game.getPlayer()
  //   const newItem = player.inventory[index]
  //   if (newItem) {
  //     const canEquip = _.intersection(newItem.equipableSlots, player.equipmentSlots).length > 0
  //     if (!canEquip) return
  //     // const oldItem = player[newItem.slot]
  //     const oldItem = _.find(player.equipped, item => item.equipable.includes(newItem.equipableSlots))
  //     if (oldItem) {
  //       player.inventory.push(oldItem)
  //     }
  //     // player[newItem.slot] = newItem
  //     player.equipped.push(newItem)
  //     player.inventory = _.without(player.inventory, newItem)
  //   }
  // },

  handleEquipItem(game, commandSuffix) {
    const index = parseInt(commandSuffix)
    const player = game.getPlayer()
    const itemId = player.inventory[index]
    game.creatureEquipItem(player.id, itemId)
  },
  

  // handleUnequipItem(game, commandSuffix) {
  //   const index = parseInt(commandSuffix)
  //   const slots = ['wielding','head','body','hands','feet']
  //   const slot = slots[index]
  //   const player = game.getPlayer()
  //   const item = player[slot]
  //   if (item) {
  //     player.inventory.push(item)
  //     player[slot] = null
  //   }
  // },

  handleUnequipSlot(game, commandSuffix) {
    const index = parseInt(commandSuffix)
    const player = game.getPlayer()
    const slotName = player.equipmentSlots[index]
    game.creatureUnequipSlot(player.id, slotName)
  },

  handleMove(game, dir) {
    const room = game.getCurrentRoom()
    const player = game.getPlayer()
    if (room.exits.includes(dir)) {
      game.addAction({type:'move', entityId: 'player', dir: dir})
      player.ap = 0
      game.setTargetOf('player', null)
    } else {
      game.addMessage('You cannot go that way.')
    }
  },

  handleTarget(game, commandSuffix) {
    const index = parseInt(commandSuffix)
    var targetId
    const player = game.getPlayer()
    const invalidIndex = !(index >= 0)
    if (invalidIndex) {
      const target = game.getFirstValidTargetOf(player.id)
      targetId = game.getFirstValidTargetOf(player.id) ? target.id : null
    } else {
      if (index + 1 > game.getNearbyEntitiesWithout('player').length) {
        game.addMessage(`No such option: ${index}`)
        index = 0
      }
      targetId = game.getNearbyEntitiesWithout('player')[index].id
    }
    const newTarget = game.getEntity(targetId)
    if (newTarget) {
      game.addMessage(`You target the ${newTarget.name}.`)
    } else {
      game.addMessage('No valid targets.')
    }
    game.setTargetOf(player.id, targetId)
  },

  handleAttack(game) {
    const player = game.getPlayer()
    const target = game.getTargetOf(player.id) || game.getFirstValidTargetOf(player.id)
    if (!target) {
      game.addMessage('No valid targets.')
      return
    }

    player.ap -= game.getApCost(player)
    game.addAction({type: 'attack', entityId: player.id, defenderId: target.id})
  },

  handleUse(game,commandSuffix = 0){
    
    const index = commandSuffix ? parseInt(commandSuffix) : 0
    const player = game.getPlayer()
    const context = game.state.uiContext
    let item
    if (context === 'inventory') {
      item = player.inventory[index]
    } else if (context === 'map') {
      item = game.getNearbyEntitiesWithout('player')[index]
    }
    if (item && item.onUse) {
      const script = game.loader.loadScript(item.onUse)
      game.addMessage(`You use the ${item.name}.`)
      script(game, helpers, item)
    }
    else {
      game.addMessage(`You cannot use that.`)
    }
  },

  handleLook(game, commandSuffix) {
    const index = parseInt(commandSuffix)
    const player = game.getPlayer()

    if ('nsew'.includes(commandSuffix)) {
      let x = 0
      let y = 0
      let dirLine = ''
      switch(commandSuffix) {
        case 'n':
          y = -1
          dirLine = 'NORTH OF YOU:'
          break;
        case 's':
          y = 1
          dirLine = 'SOUTH OF YOU:'
          break;
        case 'e':
          x = 1
          dirLine = 'EAST OF YOU:'
          break;
        case 'w':
          x = -1
          dirLine = 'WEST OF YOU:'
          break;
      }

      // FIXME I feel like a lot of this stuff should be happening in the renderer
      const cell = game.getCell(x + player.x, y + player.y)
      if (cell.type) {
        const entities = game.getEntitiesAt(cell.x, cell.y)
        game.addMessage(dirLine)

        if (entities.length) {
          entities.forEach(entity => {
            const article = 'aeiou'.includes(entity.name[0].toLowerCase()) ? 'an' : 'a'
            const entityName = entity.tags.includes('creature') ? color.red(entity.name) : entity.name
            game.addMessage(`  There is ${article} ${entityName}`)
          })
        }
        else {
          game.addMessage('  Nothing')
        }
      }
    }
    else {
      let entities
      if (game.state.uiContext === 'map') {
        entities = game.getNearbyEntitiesWithout('player')
      }
      else if (game.state.uiContext === 'inventory') {
        entities = player.inventory
      }
  
      const e = entities[index]
      game.addMessage(e.desc)
      if (e.tags.includes('creature')) {
        game.addMessage(`LVL ${e.level}`)
      }
  
      if (e.tags.includes('weapon')) {
        game.addMessage(`DAM: ${e.diceCount}d${e.diceSize}+${e.damBonus} | HIT: +${e.hitBonus} | USES: ${e.hitAttribute}`)
        game.addMessage(`CRIT: ${e.critRange}/x${e.critMult} | BASE AP COST: ${e.apCostBase}`)
      }
    }
  },

  // DEBUG FUNCTIONS

  handleDebugSpawnEntity(game, commandSuffix) {
    const player = game.getPlayer()
    game.addEntity(commandSuffix, player.x, player.y)
  },

  handleDebugAddNanites(game, commandSuffix) {
    const player = game.getPlayer()
    player.nanites += parseInt(commandSuffix)
  }
}