const moment = require('moment')
const RuleEngine = require('json-rules-engine')

const getPerimeterFeaturesSum = (perimeterFeatures) => {
  return perimeterFeatures.length > 0
    ? (perimeterFeatures.map((f) => f.perimeter).reduce((total, p) => total + p))
    : 0
}

const getYearsSinceLastAction = (actionId, previousActions) => {
  if (previousActions.filter((pa) => pa.identifier === actionId).length > 0) {
    const dateOfLastAction = moment.max(previousActions.map((pa) => moment(pa.date, 'YYYY-MM-DD')))
    return moment().diff(dateOfLastAction, 'years', true)
  }
  return null
}

const getEngine = (originalParcel, rules) => {
  const getParcel = async (params, almanac) => {
    // quick clone for immutability, parcels are JSON so this is OK
    const parcel = JSON.parse(JSON.stringify(originalParcel))
    const actionId = await almanac.factValue('actionId')
    parcel.yearsSinceLastAction = getYearsSinceLastAction(actionId, parcel.previousActions)
    parcel.adjustedPerimeter = parcel.perimeter - getPerimeterFeaturesSum(parcel.perimeterFeatures)
    return parcel
  }

  const getToleranceUpperLimit = async (params, almanac) => {
    const tolerance = await almanac.factValue('tolerance')
    const parcel = await almanac.factValue('parcel')
    return parcel.perimeter + tolerance
  }
  const engine = new RuleEngine.Engine()
  for (const rule of rules) {
    engine.addRule(rule)
  }
  engine.addFact('parcel', getParcel, { priority: 1 })
  engine.addFact('toleranceUpperLimit', getToleranceUpperLimit, { priority: 2 })
  return engine
}

module.exports = getEngine
