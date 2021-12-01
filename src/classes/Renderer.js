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
      if (!entity.carried) {
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
    lines.push(`DEPTH: ${game.state.depth}\r\n`)
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

  _renderInventory(game) {
    const lines = []
    const player = game.getPlayer()
    lines.push(`  INVENTORY: ${player.inventory.length ? '' : 'Nothing'}`)
    player.inventory.forEach((itemId, i) => {
      const item = game.getEntity(itemId)
      lines.push(`    ${i}. ${item.name}`)
    })
    return lines.join('\r\n')
  }

  _renderCybernetics(game) {
    const lines = []
    const player = game.getPlayer()
    lines.push(`  CYBERNETICS: ${player.inventory.length ? '' : 'Nothing'}`)
    player.equipped.forOwn((itemId, i) => {
      const item = game.getEntity(itemId)
      if (!item.tags.includes('cybernetics'))
      lines.push(`    ${i}. ${item.name}`)
    })
    return lines.join('\r\n')
  }

  _renderContextInventory(game) {
    const lines = []
    lines.push(this._renderInventory(game))
    lines.push('')
    if (game.state.messages.length) {
      lines.push(game.state.messages.join('\r\n'))
      lines.push('')
    }
    lines.push(this._renderSelfLine(game))
    return lines.join('\r\n')
  }

  _renderContextEquipment(game) {
    const lines = []
    lines.push(this._renderEquipped(game))
    lines.push('')
    if (game.state.messages.length) {
      lines.push(game.state.messages.join('\r\n'))
      lines.push('')
    }
    lines.push(this._renderSelfLine(game))
    return lines.join('\r\n')
  }

  _renderContextCybernetics(game) {
    const lines = []
    lines.push(this._renderCybernetics(game))
    lines.push('')
    if (game.state.messages.length) {
      lines.push(game.state.messages.join('\r\n'))
      lines.push('')
    }
    lines.push(this._renderSelfLine(game))
    return lines.join('\r\n')
  }

  _renderContextSpells(game) {

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
    return `SELF: ${player.hp}/${player.hpMax} HP | ${player.fp}/${player.fpMax} FP | ${player.ap}/${player.apMax} AP | ${player.nanites}n`
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

  _renderMenu(game, ui, lines, x = 0, y = 0) {
    const menu = ui.getActiveMenu()
    menu.items.forEach((item, i) => {
      const marker = i == menu.cursorPos.y ? '> ' : '  '
      lines[i+y] = `${marker}${i}. ${item.text}`
    })

    return lines.join('\r\n')
  }

  render(game, ui) {
    var lines = []
    const prompt = '> '

    switch(game.state.uiContext) {
      case 'map':
        lines.push(this._renderContextMap(game, ui))
        break;
      case 'inventory':
        lines.push(this._renderContextInventory(game, ui))
        break;
      case 'equipment':
        lines.push(this._renderContextInventory(game, ui))
        break;
      case 'cybernetics':
        lines.push(this._renderContextInventory(game, ui))
        break;
      case 'spells':
        lines.push(this._renderContextInventory(game, ui))
        break;
      case 'characterSheet':
        lines.push(this._renderContextCharacterSheet(game, ui))
        break;
      case 'messageHistory':
        lines.push(this._renderContextMessageHistory(game, ui))
        break;
      case 'system':
        lines.push(this._renderContextSystem(game, ui))
        break;
      case 'enhancementStation':
        lines.push(this._renderContextEnhancementStation(game, ui))
        break;
      case 'recycler':
        lines.push(this._renderContextRecycler(game, ui))
        break;
    }

    const menu = ui.getActiveMenu()

    if (menu) {
      lines[0] = this._renderMenu(game, ui, lines[0].split('\r\n'), menu.x, menu.y)
    }

    lines.push(this._renderCommands(game, ui))

    lines.push(prompt)

    return lines.join('\r\n')
  }
} 