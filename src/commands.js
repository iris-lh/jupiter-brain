module.exports = function commands(game) {
  const contextMap = {
    longForm: '(m)ap',
    help: 'Show the map.',
    handler: 'handleContextMap'
  }
  const contextInventory = {
    longForm: '(i)nventory',
    help: "Show the player's inventory.",
    handler: 'handleContextInventory'
  }
  const contextCharacterSheet = {
    longForm: '(c)haracter sheet',
    help: "Show ther player's status.",
    handler: 'handleContextCharacterSheet'
  }
  const contextMessageHistory = {
    longForm: '(M)essage history',
    help: 'Show an extended history of game messages.',
    handler: 'handleContextMessageHistory'
  }
  const contextDebug = {
    longForm: '(D)ebug',
    help: 'Show an extended history of game messages.',
    handler: 'handleContextDebug'
  }
  const contextSystem = {
    longForm: '(S)ystem',
    help: '',
    handler: 'handleContextSystem'
  }

  const commandLook = {
    longForm: '(l)ook',
    help: '',
    handler: 'handleLook'
  }

  const commandUse = {
    longForm: '(u)se',
    help: '',
    handler: 'handleUse'
  }

  const commands = {
    system: {
      m: contextMap,
      c: contextCharacterSheet,
      i: contextInventory,
      M: contextMessageHistory,
      D: contextDebug,

      s: {
        longForm: '(s)ave game',
        help: '',
        handler: 'handleSave'
      },
      // l: {
      //   longForm: '(l)oad game',
      //   help: '',
      //   handler: 'handleLoad'
      // },
      N: {
        longForm: '(N)ew game',
        help: '',
        handler: 'handleNewGame'
      }
    },
    debug: {
      m: contextMap,
      c: contextCharacterSheet,
      i: contextInventory,
      M: contextMessageHistory,

      N: {
        longForm: '(N)ew map',
        help: '',
        handler: 'handleNewMap'
      },
      s: {
        longForm: '(s)pawn entity',
        help: '',
        handler: 'handleDebugSpawnEntity'
      },
      n: {
        longForm: '(n)dd nanites',
        help: '',
        handler: 'handleDebugAddNanites'
      }
    },
    map: {
      // context switchers
      c: contextCharacterSheet,
      i: contextInventory,
      M: contextMessageHistory,
      D: contextDebug,
      S: contextSystem,

      // other commands
      t: {
        longForm: '(t)arget',
        help: '',
        handler: 'handleTarget'
      },
      a: {
        longForm: '(a)ttack',
        help: '',
        handler: 'handleAttack'
      },
      l: commandLook,
      g: {
        longForm: '(g)rab item',
        help: '',
        handler: 'handleGrabItem'
      },
      u: commandUse
    },
    inventory: {
      // context switchers
      m: contextMap,
      c: contextCharacterSheet,
      M: contextMessageHistory,
      D: contextDebug,

      // other commands
      d: {
        longForm: '(d)rop',
        help: '',
        handler: 'handleDropItem'
      },
      q: {
        longForm: 'e(q)uip',
        help: '',
        handler: 'handleEquipItem'
      },
      u: commandUse,
      U: {
        longForm: '(U)nequip',
        help: '',
        handler: 'handleUnequipSlot'
      },
      l: commandLook,
    },
    characterSheet: {
      // context switchers
      m: contextMap,
      i: contextInventory,
      M: contextMessageHistory,
      D: contextDebug,
    },
    enhancementStation: {
      // context switchers
      m: contextMap,
      // i: contextInventory,
      // M: contextMessageHistory,
      // D: contextDebug,

      // other commands
      i: {
        longForm: '(i)ncrease attribute',
        help: '',
        handler: 'handleIncreaseAttribute'
      }
    },
    recycler: {
      // context switchers
      m: contextMap,
      // i: contextInventory,
      // M: contextMessageHistory,
      // D: contextDebug,

      // other commands
      r: {
        longForm: '(r)ecycle item',
        help: '',
        handler: 'handleRecycleItem'
      }
    },
    messageHistory: {
      // context switchers
      m: contextMap,
      c: contextCharacterSheet,
      i: contextInventory,
      D: contextDebug,
    },
  }

  return commands
}
