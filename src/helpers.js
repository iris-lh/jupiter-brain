const _ = require('lodash')

const helpers = {
  assert: function(assertion, message) {
    if (!assertion) {
      throw message
    }
  },

  expandWeightTable(table) {
    const expanded = []
    var runningTotal = -1
    _.forOwn(table, (v, k) => {
      const entry = {name: k, min: runningTotal + 1}
      runningTotal = runningTotal + v
      entry.max = runningTotal
      expanded.push(entry)
    })
    return expanded
  },

  weightedRoll() {
    const merged = this.mergeWeights(arguments)
    
    var total = 0
    _.forOwn(merged, v => {
      total += parseInt(v)
    })

    expanded = this.expandWeightTable(merged)
    const roll = _.random(0, total-1)
    const result = _.find(expanded, table => {
      return this.isInRange(roll, table.min, table.max)
    })
    return result.name
  },

  isInRange(n, min, max) {
    const result = n >= min && n <= max
    return result
  },

  clamp(n, min, max) {
    if (n < min) {n = min}
    if (n > max) {n = max}
    return n
  },

  mergeWeights(tables) {
    const merged = {}
    for (var i=0; i < tables.length; i++) {
      const table = tables[i]

      _.mergeWith(merged, table, (objectValue = 0, sourceValue) => {
        if (parseInt(objectValue >= 0)) {
          objectValue = parseInt(objectValue)
        }
        if (parseInt(sourceValue) >= 0) {
          sourceValue = parseInt(sourceValue)
        }
        return objectValue + sourceValue
      })
    }
    return merged
  },

  diceRoll: function(count, size) {
    let sum = 0
    for (var i=0; i<count; i++) {
      sum += _.random(1, size)
    }
    return sum
  },

  rollHealth(creature) {
    var hp = 0
    if (creature.id == 'player') {
      hp = creature.hitDie + this.calculateAttributeMod(creature.con) * creature.level
    } else {
      var roll = this.diceRoll(creature.level, creature.hitDie)
      if (roll < creature.level * creature.hitDie / 2) {
        roll = creature.level * creature.hitDie / 2
      }
      hp += roll
      hp +=  creature.level * this.calculateAttributeMod(creature.con)
    }
    return Math.floor(hp)
  },

  calculateAttributeMod: function(n) {
    return Math.floor((n - 10))
  },

  // HP

  adjustHp(creature, amount) {
    creature.hp = this.clamp(creature.hp + amount, 0, creature.hpMax)
  },

  regenHp: function(creature) {
    const amount = (Math.floor(creature.hitDie / 2 ) + this.calculateAttributeMod(creature.con)) * creature.level
    this.adjustFp(creature, amount)
  },

  // FP

  adjustFp(creature, amount) {
    creature.fp = this.clamp(creature.fp + amount, 0, creature.fpMax)
  },

  regenFp: function(creature) {
    this.adjustFp(creature, creature.fpRegen)
  },

  // AP

  adjustAp(creature, amount) {
    creature.ap += amount
  },

  regenAp: function(creature) {
    if (creature.ap < creature.apMax) {
      this.adjustAp(creature, creature.apRegen)
      if (creature.ap > creature.apMax) {
        creature.ap = creature.apMax
      }
    }
  },
}

module.exports = helpers