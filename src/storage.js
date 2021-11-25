module.exports = {
  save: function(game, index) {
    
    // UPDATE SAVELIST
    const saveList = JSON.parse(localStorage.getItem('saveList')) || [null,null,null,null,null,null,null,null,null,null]
    saveList[index] = {name: `player ${index}`}
    localStorage.setItem('saveList', JSON.stringify(saveList))
    
    const file = JSON.stringify(game.state)
    localStorage.setItem(index, file)
  },

  load: function(index) {
    return JSON.parse(localStorage.getItem(index))
  },

  erase: function() {
    localStorage.
    localStorage.removeItem('saveState')
  }
}