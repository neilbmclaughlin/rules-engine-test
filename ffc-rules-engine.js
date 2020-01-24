const moment = require('moment')
const RuleEngine = require('json-rules-engine')

const cloneJsonObject = function (object) {
  // quick clone for immutability, parcels are JSON so this is OK
  return JSON.parse(JSON.stringify(object))
}

const getEngine = (originalParcel, rules) => {
  const parcel = cloneJsonObject(originalParcel)
  const getParcel = async (params, almanac) => {
    return parcel
  }

  const getToleranceUpperLimit = async (params, almanac) => {
    const tolerance = await almanac.factValue('tolerance')
    return parcel.perimeter + tolerance
  }

  const getYearsSinceLastAction = async (params, almanac) => {
    const actionId = await almanac.factValue('actionId')
    if (parcel.previousActions.filter((pa) => pa.identifier === actionId).length > 0) {
      const dateOfLastAction = moment.max(parcel.previousActions.map((pa) => moment(pa.date, 'YYYY-MM-DD')))
      return moment().diff(dateOfLastAction, 'years', true)
    }
    return null
  }

  const getAdjustedPerimeter = async (params, almanac) => {
    const featurePerimeterLength = parcel.perimeterFeatures.length > 0
      ? (parcel.perimeterFeatures.map((f) => f.perimeter).reduce((total, p) => total + p))
      : 0
    return parcel.perimeter - featurePerimeterLength
  }

  const engine = new RuleEngine.Engine()
  for (const rule of rules) {
    engine.addRule(rule)
  }
  engine.addFact('parcel', getParcel, { priority: 1 })
  engine.addFact('toleranceUpperLimit', getToleranceUpperLimit, { priority: 2 })
  engine.addFact('yearsSinceLastAction', getYearsSinceLastAction, { priority: 2 })
  engine.addFact('adjustedPerimeter', getAdjustedPerimeter, { priority: 2 })
  return engine
}

module.exports = getEngine
