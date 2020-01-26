const moment = require('moment')
var { validate } = require('jsonschema')
const RuleEngine = require('json-rules-engine')
const parcelSchema = require('./parcel-schema.json')
const VError = require('verror')

const rules = {
  noActionsInTimePeriod: require('./rules/no-actions-in-time-period.json'),
  perimeter: require('./rules/perimeter.json'),
  tolerancePerimeter: require('./rules/tolerance-perimeter.json'),
  adjustedPerimeter: require('./rules/within-adjusted-perimeter.json'),
  notSSSI: require('./rules/not-sssi.json')
}

const getEngine = (parcel, rules, referenceDate) => {
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
      return referenceDate.diff(dateOfLastAction, 'years', true)
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

const validateParcel = function (parcel) {
  const validationResult = validate(parcel, parcelSchema)

  if (!validationResult.valid) {
    const options = {
      name: 'ParcelSchemaValidationError',
      info: {
        errors: validationResult.errors
      }
    }
    throw new VError(options, 'Parcel schema validation error')
  }
}

const runEngine = async (parcel, rules, options, referenceDate = moment()) => {
  validateParcel(parcel)
  const engine = getEngine(parcel, rules, referenceDate)
  return engine.run(options)
}

module.exports = {
  runEngine,
  rules
}
