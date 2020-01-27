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

const facts = {
  getToleranceUpperLimit: require('./facts/get-tolerance-upper-limit'),
  getYearsSinceLastAction: require('./facts/get-years-since-last-action'),
  getAdjustedPerimeter: require('./facts/get-adjusted-perimeter'),
  getParcel: require('./facts/get-parcel')
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

  const engine = new RuleEngine.Engine()

  for (const rule of rules) {
    engine.addRule(rule)
  }

  engine.addFact('parcel', facts.getParcel(parcel))
  engine.addFact('toleranceUpperLimit', facts.getToleranceUpperLimit(parcel))
  engine.addFact('yearsSinceLastAction', facts.getYearsSinceLastAction(parcel, referenceDate))
  engine.addFact('adjustedPerimeter', facts.getAdjustedPerimeter(parcel))

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
