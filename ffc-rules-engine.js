const facts = require('./facts')
const moment = require('moment')
const RuleEngine = require('json-rules-engine')
const rules = require('./rules')
const validateParcel = require('./parcel-validation')

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
