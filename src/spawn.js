const _ = require('lodash')

module.exports = {
  spawnRoll(table) {
    const valueMap = _.reduce(table.entries, (memo, entry) => {
      memo.currentTotal += entry[0]
      memo.mapped.push([
        memo.currentTotal,
        entry[1]
      ])
      return memo
    }, {mapped: [], currentTotal: 0})
    
    const total = _.reduce(table.entries, (sum, entry) => {
      return sum += entry[0]
    }, 0)
  
    const itemRoll = _.random(1, total)
  
    const result = _.find(valueMap.mapped, entry => {
      return itemRoll <= entry[0]
    })
  
    return result
  },
  
  rollSpawns(entity) {
    const results = []
    entity.spawn.forEach(entry => {
      const minTries = entry[0]
      const maxTries = entry[1]
      const tableName = entry[2]
      const table = LOADER.loadTemplate(tableName)
      const dropChance = entry[3] || table.chance
      const tries = _.random(minTries, maxTries)
      for (var i=0; i<tries; i++) {
        const dropRoll = Math.random()
        if (dropRoll <= dropChance) {
          const result = this.spawnRoll(table)
          results.push(result[1])
        }
      }
    })
    return results
  }
}