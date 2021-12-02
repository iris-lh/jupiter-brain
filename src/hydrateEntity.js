const _ = require('lodash')
const uuid = require('uuid')

function inherit(templateName, hierarchy = []) {
  const template = LOADER.loadTemplate(templateName)
  
  hierarchy.push(template)
  if (template.inherits) {
    return inherit(template.inherits, hierarchy)
  } else {
    return hierarchy.reverse()
  }
}

module.exports = function hydrateEntity(templateName, x, y) {
  const hierarchy = inherit(templateName)
  const entity = _.mergeWith({}, ...hierarchy, (objValue, srcValue)=>{
    if (_.isArray(objValue)) {
      return objValue.concat(srcValue);
    }
    else {
      return srcValue
    }
  })
  
  // TODO use actual uuids to keep it random between sessions
  entity.id = entity.id || uuid.v4()
  entity.x = x
  entity.y = y

  entity.removeTags.forEach(tagToRemove => {
    _.pull(entity.tags, tagToRemove)
  });

  return entity
}

