const _ = require('lodash')

const color = require('../color')

// TODO theres actually no reason for this to be a class honestly
module.exports = class Renderer {
  constructor() {}

  _renderRoomDesc(game) {
    const lines = []
    const room = game.getCurrentRoom()
    lines.push(room.desc)

    game.getNearbyEntitiesWithout('player').forEach((entity, i) => {
      if (!entity.stored) {
        const article = 'aeiou'.includes(entity.name[0].toLowerCase()) ? 'an' : 'a'
        if (entity.tags.includes('creature')) {
          if (entity.hp > 0) {
            lines.push(`  ${i}. There is ${article} ${color.red(entity.name)}. ${entity.hp} hp`)
          } 
        }
        else {
          lines.push(`  ${i}. There is ${article} ${entity.name}.`)
        }
      }
    })
    return lines.join('\r\n')
  }

  _renderCommands(game) {
    // const exits = game.getCurrentRoom().exits.map(exit => {
    //   if (exit === 'n') {
    //     return color.whiteBg(color.black('n')) + 'orth'
    //   }
    //   else if (exit === 's') {
    //     return color.whiteBg(color.black('s')) + 'outh'
    //   }
    //   else if (exit === 'e') {
    //     return color.whiteBg(color.black('e')) + 'ast'
    //   }
    //   else if (exit === 'w') {
    //     return color.whiteBg(color.black('w')) + 'est'
    //   }
    // })
    const commands = []
    _.forOwn(game.commands[game.state.uiContext], (command, key) => {
      commands.push(command.longForm.replace(`(${key})`, color.whiteBg(color.black(key))))
    })
    commands.push(color.whiteBg(color.black('?')))
    const lines = [
      // `\r\nCOMMANDS: ${game.state.uiContext === 'map' ? exits.concat(commands).join(', ') : commands.join(', ')}`
      `\r\nCOMMANDS: ${commands.join(', ')}`
    ]
    return lines.join('\r\n')
  }

  _renderMap(game) {
    const wall = color.whiteBg(' ')
    const lines = []
    const player = game.getPlayer()
    lines.push(`DEPTH: ${game.state.depth}                                         \r\n`)
    lines.push(wall + _.repeat(wall, game.state.map.sizeX + 1) + '\r\n')
    for (var y=0; y<game.state.map.sizeY; y++) {
      lines.push(wall)
      for (var x=0; x<game.state.map.sizeX; x++) {
        const cell = game.getCell(x, y)
        var icon
        if (cell.type) {
          const exploredBg = cell.room.explored 
            ? function(str){return color.grayBrightBg(str)}
            : function(str){return str}
          icon = ' '
          if (cell.x == player.x && cell.y == player.y) {
            icon = color.cyanBg('@')
          }

          // FIXME This seems like a really messy way of displaying structure icons. these icons should be defined in a template i think.
          else if (cell.structures.includes('structure-exit')) {
            icon = color.greenBg('X')
          }
          else if (cell.structures.includes('structure-enhancement-station')) {
            icon = color.greenBg('E')
          }
          else if (cell.structures.includes('structure-recycler')) {
            icon = color.greenBg('R')
          }
          else {
            icon = exploredBg(cell.room.icon)
          }
        } else {
          icon = wall
        }
        lines.push(icon)
      }
      lines.push(wall + '\r\n')
    }
    lines.push(wall + _.repeat(wall, game.state.map.sizeX + 1) + '\r\n')
    return lines.join('')
  }

  _renderContextMap(game) {
    const mapLines = this._renderMap(game)
    const lines = []

    lines.push('')
    lines.push(this._renderRoomDesc(game))
    lines.push('')
    if (game.state.messages.length) {
      lines.push(game.state.messages.join('\r\n'))
      lines.push('')
    }
    lines.push(this._renderTargetLine(game))
    lines.push(`${this._renderSelfLine(game)}`)
    return mapLines + lines.join('\r\n')
  }

  _padLines(lines) {
    var longest = lines[0]
    lines.forEach(line => {
      if (line.length > longest.length) {
        longest = line
      }
    })
    return lines.map(line => {
      if (line.length < longest.length) {
        line =  ' '.repeat(longest.length - line.length) + line
      }
      return line 
    })
  }

  // TODO change _renderEquipped to new equipment slot system
  _renderEquipped(game) {
    const lines = []
    const player = game.getPlayer()
    lines.push('  EQUIPPED:')
    player.equipmentSlots.forEach(slot => {
      const itemId = player.equipped[slot]
      const item = game.getEntity(itemId)
      slot = slot.toUpperCase().replaceAll('-',' ').replaceAll('hyphen', '-')
      const line =`${slot}: ${item ? item.name : 'Nothing'}` 
      lines.push(line)
    })
    return this._padLines(lines).join('\r\n')
  }

  _renderCarrying(game) {
    const lines = []
    const player = game.getPlayer()
    lines.push(`  CARRYING: ${player.inventory.length ? '' : 'Nothing'}`)
    player.inventory.forEach((itemId, i) => {
      const item = game.getEntity(itemId)
      lines.push(`    ${i}. ${item.name}`)
    })
    return lines.join('\r\n')
  }

  _renderContextInventory(game) {
    const lines = []
    lines.push('INVENTORY')
    lines.push('')
    lines.push(this._renderEquipped(game))
    lines.push('')
    lines.push(this._renderCarrying(game))
    lines.push('')
    if (game.state.messages.length) {
      lines.push(game.state.messages.join('\r\n'))
      lines.push('')
    }
    lines.push(this._renderSelfLine(game))
    return lines.join('\r\n')
  }

  _renderContextRecycler(game) {
    const lines = []
    const player = game.getPlayer()
    lines.push('RECYCLER')
    lines.push('')
    lines.push(`  CARRYING: ${player.inventory.length ? '' : 'Nothing'}`)
    player.inventory.forEach((item, i) => {
      lines.push(`    ${i}. ${item.name} (${Math.floor(3 * 1.618**item.level)}n)`)
    })
    lines.push('')
    if (game.state.messages.length) {
      lines.push(game.state.messages.join('\r\n'))
      lines.push('')
    }
    lines.push(this._renderSelfLine(game))
    return lines.join('\r\n')
  }

  _renderPlayerStats(game) {
    const getModStr = function(name) {
      return game.getAttributeMod(player, name) >= 0 
        ? '+' + game.getAttributeMod(player, name) 
        : game.getAttributeMod(player, name) 
    }
    const lines = []
    const player = game.getPlayer()
    lines.push(`LVL: ${player.level} | ENHANCEMENT COST: ${player.naniteCost}n`)
    lines.push('')
    lines.push(`0. INT: ${player.int} | ${getModStr('int')}`)
    lines.push(`1. WIS: ${player.wis} | ${getModStr('wis')}`)
    lines.push(`2. CHA: ${player.cha} | ${getModStr('cha')}`)
    lines.push(`3. STR: ${player.str} | ${getModStr('str')}`)
    lines.push(`4. DEX: ${player.dex} | ${getModStr('dex')}`)
    lines.push(`5. CON: ${player.con} | ${getModStr('con')}`)
    lines.push('')
    lines.push(`AC: ${game.getAc(player)}`)
    return lines.join('\r\n')
  }

  _renderContextCharacterSheet(game) {
    const lines = []
    const player = game.getPlayer()

    lines.push('CHARACTER SHEET')
    lines.push('')
    lines.push(this._renderPlayerStats(game))
    lines.push('')
    if (game.state.messages.length) {
      lines.push(game.state.messages.join('\r\n'))
      lines.push('')
    }
    lines.push(this._renderSelfLine(game))
    return lines.join('\r\n')
  }

  _renderContextMessageHistory(game) {
    const lines = []
    lines.push('MESSAGE HISTORY')
    lines.push('')
    lines.push(game.state.messageHistory.join('\r\n'))
    return lines.join('\r\n')
  }

  _renderContextSystem(game) {
    const saveList = JSON.parse(localStorage.getItem('saveList'))
    const lines = []
    lines.push('SYSTEM MENU')
    lines.push('')
    lines.push('SAVES')
    saveList.forEach((save, i) => {
      if (save) {
        lines.push(`  ${i}. ${save.name}`)
      } else {
        lines.push(`  ${i}. empty`)
      }
    })
    return lines.join('\r\n')
  }

  _renderContextEnhancementStation(game) {
    const lines = []
    const player = game.getPlayer()

    lines.push('ENHANCEMENT STATION')
    lines.push('')
    lines.push(this._renderPlayerStats(game))
    lines.push('')
    if (game.state.messages.length) {
      lines.push(game.state.messages.join('\r\n'))
      lines.push('')
    }
    lines.push(this._renderSelfLine(game))
    return lines.join('\r\n')
  }

  _renderSelfLine(game) {
    const player = game.getPlayer()
    return `SELF: ${player.hp}/${player.hpMax} HP | ${player.ap}/${player.apMax} AP | ${player.nanites}n`
  }

  _renderTargetLine(game) {
    const target = game.getTargetOf('player')
    var targetLine = 'TARGET: None'
    if (target) {
      let targetStatus = color.cyan('Unhurt')
      const targetHpPercent = target.hp / target.hpMax
      if (targetHpPercent >= 1) {
        targetStatus = color.cyan('Unhurt')
      } else if (targetHpPercent >= 0.66) {
        targetStatus = color.green('Wounded')
      } else if (targetHpPercent >= 0.33) {
        targetStatus = color.yellow('Badly Wounded')
      } else if (targetHpPercent > 0) {
        targetStatus = color.red('Mortally Wounded')
      } else if (targetHpPercent <= 0) {
        targetStatus = color.redBg( color.black(' Dead ') )
      }
      targetLine = target.id 
        ? `Target: ${target.name} | ${targetStatus}` 
        : `Target: ${target.name}`
    }
    return targetLine
  }

  render(game) {
    const lines = []
    const prompt = '> '

    switch(game.state.uiContext) {
      case 'map':
        lines.push(this._renderContextMap(game))
        break;
      case 'inventory':
        lines.push(this._renderContextInventory(game))
        break;
      case 'characterSheet':
        lines.push(this._renderContextCharacterSheet(game))
        break;
      case 'messageHistory':
        lines.push(this._renderContextMessageHistory(game))
        break;
      case 'system':
        lines.push(this._renderContextSystem(game))
        break;
      case 'enhancementStation':
        lines.push(this._renderContextEnhancementStation(game))
        break;
      case 'recycler':
        lines.push(this._renderContextRecycler(game))
        break;
    }

    lines.push(this._renderCommands(game))

    lines.push(prompt)

    return lines.join('\r\n')
  }
} 