const facts = require('./facts')
const moment = require('moment')
const RuleEngine = require('json-rules-engine')
const rules = require('./rules')
const validateParcel = require('./parcel-validation')

function getEngine (rules) {
  const engine = new RuleEngine.Engine()

  for (const rule of rules) {
    engine.addRule(rule)
  }

  for (const key in facts) {
    engine.addFact(key, facts[key])
  }

  return engine
}

async function getFactsFromAlmanac (factNames, almanac) {
  // [ fact1, ... ] => [ {fact1: value1}, ... ]
  const facts = await Promise.all(factNames.map(
    async factName => ({ [factName]: await almanac.factValue(factName) })
  ))

  // [ {fact1: value1}, ... ] => { fact1: value1, ... }
  return Object.assign({}, ...facts)
}

async function runEngine (rules, options, referenceDate = moment(), outputFacts = []) {
  validateParcel(options.parcel)

  return getEngine(rules)
    .run({ ...options, referenceDate })
    .then(async ({ events, almanac }) => ({
      events,
      facts: await getFactsFromAlmanac(outputFacts, almanac)
    }))
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
