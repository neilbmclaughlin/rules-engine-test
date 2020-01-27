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

function validateParcel (parcel) {
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

function getEngine (parcel, rules, referenceDate) {
  validateParcel(parcel)
  async function getParcel (params, almanac) {
    return parcel
  }

  async function getToleranceUpperLimit (params, almanac) {
    const tolerance = await almanac.factValue('tolerance')
    return parcel.perimeter + tolerance
  }

  async function getYearsSinceLastAction (params, almanac) {
    const actionId = await almanac.factValue('actionId')
    if (parcel.previousActions.filter((pa) => pa.identifier === actionId).length > 0) {
      const dateOfLastAction = moment.max(parcel.previousActions.map((pa) => moment(pa.date, 'YYYY-MM-DD')))
      return referenceDate.diff(dateOfLastAction, 'years', true)
    }
    return null
  }

  async function getAdjustedPerimeter (params, almanac) {
    const featurePerimeterLength = parcel.perimeterFeatures.length > 0
      ? (parcel.perimeterFeatures.map((f) => f.perimeter).reduce((total, p) => total + p))
      : 0
    return parcel.perimeter - featurePerimeterLength
  }

  const engine = new RuleEngine.Engine()
  for (const rule of rules) {
    engine.addRule(rule)
  }
  engine.addFact('parcel', getParcel)
  engine.addFact('toleranceUpperLimit', getToleranceUpperLimit)
  engine.addFact('yearsSinceLastAction', getYearsSinceLastAction)
  engine.addFact('adjustedPerimeter', getAdjustedPerimeter)
  return engine
}

async function runEngine (parcel, rules, options, referenceDate = moment()) {
  return getEngine(parcel, rules, referenceDate).run(options)
}

async function allRulesPass (parcel, ruleset, options) {
  const result = await runEngine(parcel, ruleset, options)
  return result.events.length === ruleset.length
}

module.exports = {
  runEngine,
  getEngine,
  allRulesPass,
  rules
}
