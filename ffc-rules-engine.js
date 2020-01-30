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
  // [ fact, ... ] => [ {fact: value}, ... ]
  const facts = await Promise.all(factNames.map(
    async factName => ({ [factName]: await almanac.factValue(factName) })
  ))

  // [ {fact: value}, ... ] => { fact: value, ... }
  return Object.assign({}, ...facts)
}

async function runEngine (rules, options, outputFacts = []) {
  validateParcel(options.parcel)

  if (!options.referenceDate) {
    options.referenceDate = moment()
  }

  return getEngine(rules).run(options).then(
    async ({ events, almanac }) => {
      const facts = await getFactsFromAlmanac(outputFacts, almanac)
      return { events, facts }
    })
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
