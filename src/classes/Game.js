const _ = require('lodash')

const helpers = require('../helpers')
const color = require('../color')
const commands = require('../commands')
const inputHandlers = require('../inputHandlers')

const storage = require('../storage')
const spawn = require('../spawn')
const hydrateEntity = require('../hydrateEntity')
const Map = require('./Map')


module.exports = class Game {
  constructor() {
    const save = storage.load(0)
    this.defaultState = {
      uiContext: 'map',
      actions: [],
      messages: [],
      messageHistory: [],
      pass: false,
      map: null,
      rooms: [],
      entities: [],
      currentRoomId: null,
      initiative: [],
      depth: 0,
      creatureCount: 0,
      itemCount: 0,
      saveIndex: 0,
    }

    this.state = save || this.defaultState
    
    this.state.uiContext = 'map'
    
    this.commands = new commands(this)
    
    // NEW GAME
    if (!save) {
      this.goToNewMap()
      this.addEntity('creature-player', this.state.map.startX, this.state.map.startY)
      this.autoSave()
    }
  }

  loop(input) {
    this.state.messages = []
    this.handleInput(input)

    const player = this.getPlayer()
    if (player.ap <= 0) {
      this.state.pass = true
    }

    while (this.state.pass && this.getPlayer().hp > 0) {
      this.tick()
    }
    
    this.processActions()
    

    if (this.getPlayer().hp <= 0) {

      this.addMessage(color.redBg(color.black(' YOU ARE DEAD. Refresh page to start new game.')))
      localStorage.removeItem(this.state.saveIndex)
    } else {
      this.autoSave()
    }
  }

  tick() {
    const player = this.getPlayer()
    this.getEntitiesAt(player.x, player.y).forEach(entity => {
      if (entity.hp > 0 && player.hp > 0) {
        if (entity.id !== 'player') {
          const weaponId = entity.equipped[entity.wieldableSlots[0]]
          const weapon = this.getEntity(weaponId)
          while (weapon && entity.ap > 0 && entity.ap >= weapon.useApCost) {
            entity.target = 'player'
            helpers.adjustAp(entity, -this.getAttackApCost(entity))
            this.addAction({type: 'attack', entityId: entity.id, defenderId: entity.target})
          }
        }
      }
      if ( entity.tags.includes('regens-hp') ) helpers.regenHp(entity)
      if ( entity.tags.includes('regens-fp') ) helpers.regenFp(entity)
      if ( entity.tags.includes('regens-ap') ) helpers.regenAp(entity)
    })
    
    if (player.ap >= 0) {
      this.state.pass = false
    }
  }
  
  processMoveCreature(id, dir) {
    const creature = this.getEntity(id)
    const isPlayer = creature.id === 'player'
    
    if (isPlayer) {this.getCurrentRoom().explored = true}
    switch(dir) {
      case 'n':
        creature.y--
        break;
      case 's':
        creature.y++
        break;
      case 'e':
        creature.x++
        break;
      case 'w':
        creature.x--
        break;
    }
    if (isPlayer) {this.getCurrentRoom().explored = true}
  }

  spawnCreatures() {
    _.forOwn(this.state.map.cells, cell => {
      if (cell.room) {
       const spawns = spawn.rollSpawns(cell.room)
       spawns.forEach(templateName => {
         const creature = this.addEntity(templateName, cell.x, cell.y)
       })
      }
    })
  }

  spawnLoot() {
    this.spawnStructure('structure-exit')
    this.spawnStructure('structure-enhancement-station')
    this.spawnStructure('structure-recycler')
  }

  spawnStructure(templateName) {
    const cellsWithRooms = _.filter(this.state.map.cells, cell => cell.room !== null)
    const randomCell = _.sample(cellsWithRooms)
    const structure = this.addEntity(templateName, randomCell.x, randomCell.y)
    randomCell.structures.push(templateName)
  }

  // GETTERS

  getCell(x, y) {
    return this.state.map.cells[`${x},${y}`]
  }

  getPlayer() {
    return this.getEntity('player')
  }

  getEntity(id) {
    return _.find(this.state.entities, entity => entity.id == id)
  }

  getEntitiesWithout(excludeId) {
    return _.filter(this.state.entities, entity => entity.id !== excludeId)
  }

  // TODO change getAc to new equipment slot system
  getAc(creature) {
    var dexMod = helpers.calculateAttributeMod(creature.dex)
    var total = 0
    total += creature.baseAc
    if (creature.head) {
      total += creature.head.equipAcBonus
    }
    if (creature.body) {
      total += creature.body.equipAcBonus
    }
    if (creature.hands) {
      total += creature.hands.equipAcBonus
    }
    if (creature.feet) {
      total += creature.feet.equipAcBonus
    }
    total += dexMod
    return total
  }

  getAttackApCost(creature) {
    const wieldingSlot = creature.wieldableSlots[0]
    const weaponId = creature.equipped[wieldingSlot]
    const weapon = this.getEntity(weaponId)
    var netCost = weapon.useApCostBase
    var attributeTotal = 0
    weapon.useApAttributes.forEach(attribute => {
      attributeTotal += this.getAttributeMod(creature, attribute)
    })
    attributeTotal = Math.floor(attributeTotal/weapon.useApAttributes.length)
    
    netCost -= attributeTotal
    if (netCost < weapon.useApCostMin) {netCost = weapon.useApCostMin}
    if (netCost > weapon.useApCostMax) {netCost = weapon.useApCostMax}
    
    return netCost
  }

  getAttributeMod(creature, attributeStr) {
    const attribute = creature[attributeStr]
    return Math.floor((attribute - 10))
  }

  getDisplayedEntities() {
    return this.state.entities.filter(entity => {

    })
  }

  getNearbyEntitiesWithout(excludeId) {
    const player = this.getPlayer()
    return _.filter(this.state.entities, entity => entity.id !== excludeId && entity.x === player.x && entity.y === player.y)
  }

  getEntitiesAt(x, y) {
    return _.filter(this.state.entities, entity => entity.x === x && entity.y === y)
  }

  getTargetOf(targeterId) {
    const targeter = this.getEntity(targeterId)
    return this.getEntity(targeter.target)
  }

  getFirstValidTargetOf(targeterId) {
    return _.find(this.getNearbyEntitiesWithout(targeterId), entity => {
      return entity.hp > 0
    })
  }

  getFirstUsableItem(targeterId) {
    return _.find(this.getNearbyEntitiesWithout(targeterId), entity => {
      return typeof entity.onUse == 'function'
    })
  }

  getCurrentRoom() {
    const player = this.getPlayer()
    return this.getCell(player.x, player.y).room
  }

  // TODO these need to be done with actions. these functions should basically be action processors... right?

  creatureGrabItem(creatureId, itemId) {
    const creature = this.getEntity(creatureId)
    const item = this.getEntity(itemId)
    if (!creature.inventory.includes(item.id)) {
      creature.inventory.push(item.id)
      item.carried = true
      item.x = null
      item.y = null
    }
  }

  creatureDropItem(creatureId, itemId) {
    const creature = this.getEntity(creatureId)
    const item = this.getEntity(itemId)
    item.carried = false
    item.x = creature.x
    item.y = creature.y
    creature.inventory = _.without(creature.inventory, item.id)
  }

  creatureEquipItem(creatureId, itemId) {
    const creature = this.getEntity(creatureId)
    const newItem = this.getEntity(itemId)
    const slotName = newItem.equipableSlots[0]
    const oldItem = creature.equipped[slotName]
    if (creature.equipmentSlots.includes(slotName)) {
      if (oldItem) {
        this.creatureGrabItem(creatureId, itemId)
      }
      creature.equipped[slotName] = newItem.id
      creature.inventory = _.without(creature.inventory, newItem.id)
    }
  }

  creatureUnequipSlot(creatureId, slotName) {
    const creature = this.getEntity(creatureId)
    const itemId = creature.equipped[slotName]
    if (itemId) {
      creature.inventory.push(itemId)
      creature.equipped[slotName] = null
    }
  }

  creatureDie(creatureId) {
    const creature = this.getEntity(creatureId)
    const player = this.getPlayer()
    creature.hp = 0
    creature.dead = true

    if (creatureId !== player.id) {
      // DROP LOOT
      // TODO reimpliment creature dropping loot from inventory on death
      // creature.inventory.forEach((item, i) => {
      //   this.creatureDropItem(creature.id, 0)
      // })
      const drops = spawn.rollSpawns(creature)
      drops.forEach(dropName => {
        this.addEntity(dropName, creature.x, creature.y)
      })

      if (creatureId === player.target) {
        player.target = null
      }
      this.deleteEntity(creatureId)
    }
  }

  rollInitiative(creature) {
    return helpers.diceRoll(1, 20)
      + helpers.calculateAttributeMod(creature.dex)
      + helpers.calculateAttributeMod(creature.wis)
  }


  // CALCULATORS

  calculateHit(attacker) {
    const wieldingSlot = attacker.wieldableSlots[0]
    const weaponId = attacker.equipped[wieldingSlot]
    const weapon = this.getEntity(weaponId)
    
    const hitNatural = helpers.diceRoll(1, 20)
    const crit = hitNatural >= weapon.critRange
    
    const hitBonus = weapon.hitBonus + helpers.calculateAttributeMod(attacker[weapon.hitAttribute])
    const playerBonus = attacker.id === 'player' ? 2 : 0
    const hit = hitNatural + hitBonus + playerBonus
  
    return {roll: hit, crit: crit}
  }
  
  calculateDamage(attacker, didCrit) {
    const wieldingSlot = attacker.wieldableSlots[0]
    const weaponId = attacker.equipped[wieldingSlot]
    const weapon = this.getEntity(weaponId)
    const critMultiplier = didCrit ? weapon.critMult : 1
    const damageBonus = weapon.damBonus + helpers.calculateAttributeMod(attacker[weapon.damAttribute])
    const dice = helpers.diceRoll(weapon.useDiceCount, weapon.useDiceSize)
    let damage = 
      (dice + damageBonus) 
      * critMultiplier
    if (damage < 1) {damage = 1}
    return damage
  }


  // SETTERS

  setTargetOf(targeterId, targetId) {
    helpers.assert(typeof targeterId === 'string', `expected targeterId to be string, got ${targeterId}`)
    helpers.assert(typeof targetId === 'string' || targetId === null, `expected targetId to be string or null, got ${targetId}`)

    if (targetId === undefined) {
      this.getEntity(targeterId).target = null
    } else {
      this.getEntity(targeterId).target = targetId
    }
  }

  // HANDLERS

  autoSave() {
    storage.save(this, this.state.saveIndex)
  }

  goToNewMap() {
    this.state.map = new Map('map', this.state.depth)
    // this.getEntitiesWithout('player').forEach(entity => {
    //   this.deleteEntity(entity.id)
    // })
    this.spawnCreatures()
    this.spawnLoot()
    this.state.depth += 1
  }  

  processAttack(attackerId, defenderId) {
    helpers.assert(typeof attackerId === 'string', `expected attackerId to be string, got ${attackerId}`)
    helpers.assert(typeof defenderId === 'string', `expected defenderId to be object, got ${defenderId}`)

    const attacker = this.getEntity(attackerId)
    const defender = this.getEntity(defenderId)

    if (attacker && !attacker.dead) {
      helpers.assert(typeof attacker === 'object', `expected attacker to be string, got ${attacker}`)
      helpers.assert(typeof defender === 'object', `expected defender to be object, got ${defender}`)
  
      const wieldingSlot = attacker.wieldableSlots[0]
      const weaponId = attacker.equipped[wieldingSlot]
      const weapon = this.getEntity(weaponId)
      const hit = this.calculateHit(attacker, defender)
    
      const damage = defender.tags.includes('indestructible') ? 0 : this.calculateDamage(attacker, hit.crit)
    
      const killed = (damage >= defender.hp) && !defender.dead
      const enemyIsKilled = killed && attackerId == 'player' ? ', killing it' : ''
      const playerIsKilled = killed && attackerId != 'player' ? ', killing you' : ''
    
      const hitMsg = attackerId == 'player' 
        ? `You${hit.crit ? ' critically ' : ' '}${weapon.attackDesc} (${hit.roll}) the ${color.red(defender.name)} with your ${weapon.name}, dealing ${damage} damage${enemyIsKilled}.`
        : `The ${color.red(attacker.name)}${hit.crit ? ' critically ' : ' '}${weapon.attackDesc}s (${hit.roll}) you with its ${weapon.name}, dealing ${damage} damage${playerIsKilled}.`
    
      const missMsg = attackerId == 'player'
        ? `You miss (${hit.roll}) the ${color.red(defender.name)}.`
        : `The ${color.red(attacker.name)} misses (${hit.roll}) you.`
      
      if (hit.roll > this.getAc(defender)) {
        this.addMessage(hitMsg + ` ${this.getAttackApCost(attacker)} ap`)
        helpers.adjustHp(defender, -damage)
        if (defender.hp <= 0) {
          this.creatureDie(defenderId)
          if (attackerId == 'player') {
            attacker.nanites += Math.floor(2 * 1.618**defender.level-1)
          }
        }
      } else {
        this.addMessage(missMsg + ` ${this.getAttackApCost(attacker)} ap`)
      }
    }
  }

  // switchUiContext(context) {
  //   this.state.uiContext = context
  // }

  handleInput(input) {
    input = input.replace(' ', '')
    const player = this.getPlayer()
    const prefix = input[0]
    const suffix = input.slice(1)

    if (!input) {
      if (this.state.uiContext === 'map') {
        this.state.pass = true
      }
      return
    }

    if (input && this.getPlayer().hp > 0) {
      if (this.commands[this.state.uiContext][prefix] && suffix == '?') {
        const helpMsg = this.commands[this.state.uiContext][prefix].help
        this.addMessage(helpMsg)
      }
      else if (this.state.uiContext === 'map' && 'nsew'.includes(prefix)) {
        inputHandlers.handleMove(this, prefix)
      }
      else if (this.commands[this.state.uiContext][prefix]) {
        const handlerName = this.commands[this.state.uiContext][prefix].handler
        const handler = inputHandlers[handlerName]
        handler(this, suffix)
      }
      else {
        this.addMessage('Invalid command: ' + input)
      }
    }
    else if (this.state.uiContext === 'map') {
      this.state.pass = true
    }
  }


  // ACTIONS

  processAction(action) {
    const entity = this.getEntity(action.entityId)
    if (entity) {
      switch (action.type) {
        case 'move':
          this.processMoveCreature(action.entityId, action.dir)
          break;
        case 'attack':
          this.processAttack(action.entityId, action.defenderId)
          break;
      }
    }
  }

  processActions() {
    this.state.actions.forEach(action => {
      this.processAction(action)
    })
    this.state.actions = []
  }

  // ADDERS

  addAction(action) {
    this.state.actions.push(action)
  }

  addMessage(message) {
    this.state.messages.push(message)
    this.state.messageHistory.push(message)
    if (this.state.messageHistory.length > 25) {
      this.state.messageHistory.shift()
    }
  }

  // TODO change addEntity to new equipment slot system
  addEntity(templateName, x, y) {
    const entity = hydrateEntity(templateName, x, y)
    this.state.entities.push(entity)

    entity.hpMax = helpers.rollHealth(entity)
    entity.hp = entity.hpMax
    
    if (entity.tags.includes('creature')) {
      this.state.creatureCount += 1
    }

    entity.equipmentSlots.forEach(slotName => {
      const equipmentTemplateName = entity.startingEquipment[slotName]
      if (equipmentTemplateName) {
        const item = this.addEntity(equipmentTemplateName, x, y)
        entity.equipped[slotName] = item.id
        item.carried = true
      } else {
        entity.equipped[slotName] = null
      }
    })

    entity.inventory.forEach((inventoryTemplateName, i) => {
      const item = this.addEntity(inventoryTemplateName, x, y)
      entity.inventory[i] = item.id
      item.carried = true
    })

    return entity
  }

  deleteEntity (id) {
    const entity = this.getEntity(id)
    this.state.entities = _.without(this.state.entities, entity)
  }

}
