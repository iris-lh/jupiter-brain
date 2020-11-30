const _ = require('lodash')

const color = require('../color')

module.exports = class Renderer {
  constructor() {}

  _renderRoom(game) {
    const lines = []
    const room = game.getCurrentRoom()
    lines.push(room.desc)
    const creatures = game.getNearbyCreaturesWithout('player')
    const items = game.getNearbyItems()

    if (creatures.length) {
      lines.push("\nCREATURES")
    }
    creatures.forEach((creature, i) => {
      const article = 'aeiou'.includes(creature.name[0].toLowerCase()) ? 'an' : 'a'
      if (creature.hp > 0) {
        lines.push(`  ${i}. There is ${article} ${creature.name}. ${creature.hp} hp`)
      } 
      else if (creature.hp <= 0) {
        lines.push(`  ${i}. There is ${article} ${creature.name} ${creature.remainsName}.`)
      }
    })

    if (items.length) {
      lines.push("\nITEMS")
    }
    game.getNearbyItems().forEach((item, i) => {
      if (!item.stored) {
        const article = 'aeiou'.includes(item.name[0].toLowerCase()) ? 'an' : 'a'
        lines.push(`  ${i}. There is ${article} ${item.name} ${item.id}.`)
      }
    })
    return lines.join('\n')
  }

  _renderCommands(game) {
    const exits = game.getCurrentRoom().exits.map(exit => {
      if (exit === 'n') {
        return '(n)orth'
      }
      else if (exit === 's') {
        return '(s)outh'
      }
      else if (exit === 'e') {
        return '(e)ast'
      }
      else if (exit === 'w') {
        return '(w)est'
      }
    })
    const commands = [
      '(t)arget',
      '(a)ttack',
      // 'm',
      '(l)ook',
      '(g)rab',
      '(d)rop',
      'e(q)uip',
      '(i)nventory',
      '(c)haracter',
      // 'c',
      // 'S',
      '?'
    ]
    const lines = [
      `\nCOMMANDS: ${exits.concat(commands).join(', ')}`
    ]
    return lines.join('\n')
  }

  _renderMap(game) {
    const wall = color.white('█')
    const lines = []
    const player = game.getPlayer()
    lines.push(wall + _.repeat(wall, game.state.map.sizeX + 1) + '\n')
    for (var y=0; y<game.state.map.sizeY; y++) {
      lines.push(wall)
      for (var x=0; x<game.state.map.sizeX; x++) {
        const cell = game.state.map.getCell(x, y)
        var icon
        if (cell.type) {
          icon = ' '
          if (cell.x == player.x && cell.y == player.y) {
            icon = color.cyan('@')
          } 
          else {
            icon = cell.room.icon
          }
        } else {
          icon = wall
        }
        lines.push(icon)
      }
      lines.push(wall + '\n')
    }
    lines.push(wall + _.repeat(wall, game.state.map.sizeX + 1) + '\n')
    return lines.join('')
  }

  _renderInventory(game) {
    const lines = []
    const player = game.getPlayer()
    lines.push(`WIELDING: ${player.wielding ? player.wielding.name : 'Nothing'}`)
    lines.push(`WEARING: ${player.wearing ? player.wearing.name : 'Nothing'}`)
    lines.push(`CARRYING:`)
    player.inventory.forEach((item, i) => {
      lines.push(`  ${i}. ${item.name} ${item.id}`)
    })
    return lines.join('\n')
  }

  _renderCharacterSheet(game) {
    const lines = []
    const player = game.getPlayer()
    lines.push(`LVL: ${player.level}`)
    lines.push(`INT: ${player.attributes.int}`)
    lines.push(`WIS: ${player.attributes.wis}`)
    lines.push(`CHA: ${player.attributes.cha}`)
    lines.push(`STR: ${player.attributes.str}`)
    lines.push(`DEX: ${player.attributes.dex}`)
    lines.push(`CON: ${player.attributes.con}`)
    return lines.join('\n')
  }

  _renderMessageHistory(game) {
    const lines = game.state.messageHistory 
    return lines.join('\n')
  }

  _renderSelfLine(game) {
    return `Self: ${game.getPlayer().hp}/${game.getPlayer().hpMax} hp | ${game.getPlayer().ap}/${game.getPlayer().apMax} ap`
  }

  _renderTargetLine(game) {
    const target = game.getTargetOf('player')
    var targetLine = 'No target'
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
  
    if (game.state.uiContext === 'map') {
      lines.push(this._renderMap(game))
      lines.push(this._renderRoom(game))

      lines.push('')
      if (game.state.messages.length) {
        lines.push(game.state.messages.join('\n'))
        lines.push('')
      }

      lines.push(`${this._renderSelfLine(game)} // ${this._renderTargetLine(game)}`)
    } 
    else if (game.state.uiContext === 'inventory') {
      lines.push('INVENTORY')
      lines.push('')
      lines.push(this._renderInventory(game))
      lines.push('')
      lines.push(this._renderSelfLine(game))
    }
    else if (game.state.uiContext === 'characterSheet') {
      lines.push('CHARACTER SHEET')
      lines.push('')
      lines.push(this._renderCharacterSheet(game))
      lines.push('')
      lines.push(this._renderSelfLine(game))
    }
    else if (game.state.uiContext === 'messageHistory') {
      lines.push('MESSAGE HISTORY')
      lines.push('')
      lines.push(this._renderMessageHistory(game))
    }
    
    // lines.push('')
    // if (game.state.messages.length) {
    //   lines.push(game.state.messages.join('\n'))
    //   lines.push('')
    // }

    // lines.push(`${this._renderSelfLine(game)} // ${this._renderTargetLine(game)}`)

    lines.push(this._renderCommands(game))

    lines.push(prompt)

    return lines.join('\n')
  }
} 