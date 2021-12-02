const _ = require('lodash')

const helpers = require('../helpers')
const hydrateEntity = require('../hydrateEntity')

module.exports = class Map {
  constructor(templateName, depth = 1) {
    const template = LOADER.loadTemplate(templateName)

    this.sizeX = template.sizeX + Math.floor(depth/2) || 0
    this.sizeY = template.sizeY + Math.floor(depth/4) || 0
    this.minRooms = template.minRooms + depth * 2 || 10
    this.maxRooms = template.maxRooms + depth * 4 || 20
    this.straightness = template.straightness || 0
    this.weights = template.weights || {
      "creatureCount":[],
      "creatureType": {},
      "roomType": {}
    }
    
    this.cells = {}

    this.startX = 0
    this.startY = 0
    this.startRoom = null

    // METRICS
    this.branchSteps = 0
    this.maxBranchSteps = 1000
    this.attempts = 0

    this.generateCells()
  }

  getDirs(diagonal = false) {
    return diagonal
    ? [[0,1],[1,0],[-1,0],[0,-1],[-1,-1],[1,-1],[1,1],[-1,1]]
    : [[0,1],[1,0],[-1,0],[0,-1]]
  }

  getCell(x, y) {
    return this.cells[`${x},${y}`]
  }

  addCell(cell) {
    this.cells[`${cell.x},${cell.y}`] = cell
  }

  getExits(cell) {
    const exits = []
    cell.connections.forEach(connection => {
      const dx = connection[0] - cell.x
      const dy = connection[1] - cell.y
      if (dx < 0) {
        exits.push('w')
      } else if (dx > 0) {
        exits.push('e')
      } else if (dy < 0) {
        exits.push('n')
      } else if (dy > 0) {
        exits.push('s')
      }
    })
    return exits
  }

  generateRooms() {
    _.forOwn(this.cells, cell => {
      if (cell.type) {
        const room = hydrateEntity(cell.type)
        const exits = this.getExits(cell)
        room.exits = exits
        cell.room = room
      }
    })
  }

  generateCell(type, x, y) {
    helpers.assert((typeof type === 'string')|| type === null, 'typeof type must be string or null')
    helpers.assert(typeof x === 'number', 'typeof x must be number')
    helpers.assert(typeof y === 'number', 'typeof y must be number')
    return {type: type, x: x, y: y, connections: [], structures:[], room: null}
  }

  getNeighbors(x, y) {
    helpers.assert(typeof x === 'number', 'typeof x must be number')
    helpers.assert(typeof y === 'number', 'typeof y must be number')
    const neighbors = []

    const dirs = this.getDirs()

    dirs.forEach(dir => {
      const newX = x + dir[0]
      const newY = y + dir[1]
      const neighbor = this.getCell(newX, newY)
      if (neighbor && neighbor.type) {
        neighbors.push(neighbor)
      }
    })

    return neighbors
  }

  makeBranches(pointerX, pointerY, type = 'room-chamber', lastDir = [0,0], branchWeight) {
    helpers.assert(typeof pointerX === 'number', 'typeof pointerX must be number')
    helpers.assert(typeof pointerY === 'number', 'typeof pointerY must be number')
    helpers.assert(typeof type === 'string', 'typeof type must be string')
    helpers.assert(Array.isArray(lastDir), 'lastDir must be an array')
    helpers.assert(Array.isArray(branchWeight), 'branchWeight must be an array')

    const template = LOADER.loadTemplate(type)
    
    this.branchSteps++
    const defaultBranchWeight = [0,1,1,1,2,2,3]
    var branches = _.sample(branchWeight)
    for (var i=0; i<branches; i++) {
      var availableDirs = this.getDirs()

      for (var ii=0; ii<this.straightness; ii++) {
        availableDirs.push(lastDir)
      }
      availableDirs = _.filter(availableDirs, dir => {
        const newX = pointerX + dir[0]
        const newY = pointerY + dir[1]
        const inBoundsX = newX >= 0 && newX < this.sizeX
        const inBoundsY = newY >= 0 && newY < this.sizeY
        const cell = this.getCell(newX, newY)
        const cellExists = cell !== undefined
        const cellEmpty = cellExists ? cell.type == null : false
        const correctNeighbors = this.getNeighbors(newX,newY).length < 2 // TODO pull this out into map template
        const validCell = cellEmpty && inBoundsX && inBoundsY && correctNeighbors
        return validCell
      })


      if (availableDirs.length && this.getRoomCount() < this.maxRooms) {
        const dir = _.sample(availableDirs)
        const x = pointerX + dir[0]
        const y = pointerY + dir[1]

        const nextType = helpers.weightedRoll(template.weights.neighborType, this.weights.neighborType)
  
        this.addCell(this.generateCell(nextType, x, y))
        if (this.branchSteps < this.maxBranchSteps) {
          this.makeBranches(x, y, nextType, dir, defaultBranchWeight)
        }
      }
    }
  }

  processCells(steps=1) {
    for (var step=0; step<steps; step++) {
      for (var y=0; y<this.sizeY; y++) {
        for (var x=0; x<this.sizeX; x++) {
          var cell = this.getCell(x, y)
          const neighbors = this.getNeighbors(x, y)
          const neighborTypes = _.countBy(neighbors, n => n.type)
  
          if (cell.type) {
            if (cell.type == 'room-chamber' && neighborTypes['room-chamber'] > 1) {
              cell.type = 'room-corridor'
            }
            
            if (cell.type == 'room-corridor' && neighborTypes['room-corridor'] == 1 && neighborTypes['room-chamber'] == undefined) {
              cell.type = 'room-chamber'
            }
            if (cell.type == 'room-corridor' && neighborTypes['room-corridor'] == undefined && neighborTypes['room-chamber'] == 1) {
              // cell = null
              cell = this.generateCell(null, x, y)
            }
  
          }
          
          if (!cell.type && neighborTypes['room-chamber'] > 1 && neighborTypes['room-corridor'] == 1) {
            cell = this.generateCell('room-corridor', x, y)
          }
  
          if (cell.x == this.startX && cell.y == this.startY) {
            cell.type = 'room-chamber'
          }
          this.addCell(cell)
        }
      }
    }
  }

  connectCells() {
    for (var y=0; y<this.sizeY; y++) {
      for (var x=0; x<this.sizeX; x++) {
        const cell = this.getCell(x, y)
        const neighbors = this.getNeighbors(x, y)

        neighbors.forEach(neighbor => {
          var shouldConnect = false
          
          // TODO make algorithm more comprehensive
          if (cell.type === 'room-corridor' && neighbor.type === 'room-corridor') {
            shouldConnect = true
          }

          shouldConnect = true

          if (shouldConnect) {
            cell.connections.push([neighbor.x, neighbor.y])
          }
        })
      }
    }
  }

  getRoomCount() {
    const occupiedCells = _.filter(this.cells, cell => {
      return cell.type != null
    })
    const count = _.size(occupiedCells)
    return count
  }

  generateCells() {
    this.cells = {}
    this.attempts++
    for (var y=0; y<this.sizeY; y++) {
      for (var x=0; x<this.sizeX; x++) {
        this.addCell(this.generateCell(null, x, y))
      }
    }
    
    const minX = Math.floor(this.sizeX*0.25)
    const maxX = Math.floor(this.sizeX*0.75)-1
    const minY = Math.floor(this.sizeY*0.25)
    const maxY = Math.floor(this.sizeY*0.75)-1
    this.startX = _.random(minX, maxX)
    this.startY = _.random(minY, maxY)
    // this.startX = _.random(0, this.sizeX-1)
    // this.startY = _.random(0, this.sizeY-1)
    const startCell = this.generateCell('room-chamber', this.startX, this.startY)
    this.addCell(startCell)
    this.startRoom = startCell.room
    this.makeBranches(startCell.x, startCell.y, 'room-chamber', [0,0], [1,2,2,2,3,3,3,4,4,4])

    

    if (this.getRoomCount() < this.minRooms) {
      this.generateCells()
    } 
    else {
      this.processCells()
      this.processCells()
      this.connectCells()
      this.generateRooms()
      this.startRoom = this.getCell(this.startX, this.startY)
    }
  }
}