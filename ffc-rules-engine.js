const moment = require('moment')
const RuleEngine = require('json-rules-engine')
const validateParcel = require('./parcel-validation')

const rules = {
  noActionsInTimePeriod: require('./rules/no-actions-in-time-period.json'),
  perimeter: require('./rules/perimeter.json'),
  tolerancePerimeter: require('./rules/tolerance-perimeter.json'),
  adjustedPerimeter: require('./rules/within-adjusted-perimeter.json'),
  notSSSI: require('./rules/not-sssi.json')
}

const facts = {
  toleranceUpperLimit: require('./facts/get-tolerance-upper-limit'),
  yearsSinceLastAction: require('./facts/get-years-since-last-action'),
  adjustedPerimeter: require('./facts/get-adjusted-perimeter')
}

function getEngine (rules, referenceDate) {
  const engine = new RuleEngine.Engine()

  for (const rule of rules) {
    engine.addRule(rule)
  }

  for (const key in facts) {
    engine.addFact(key, facts[key])
  }

  return engine
}

async function runEngine (rules, options, referenceDate = moment()) {
  validateParcel(options.parcel)

  return getEngine(rules).run({ ...options, referenceDate })
}

async function allRulesPass (ruleset, options) {
  const result = await runEngine(ruleset, options)
  return result.events.length === ruleset.length
}

module.exports = {
  runEngine,
  getEngine,
  allRulesPass,
  rules
}
