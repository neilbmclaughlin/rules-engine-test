const facts = require('./facts')
const moment = require('moment')
const RuleEngine = require('json-rules-engine')
const rules = require('./rules')
const validateParcel = require('./parcel-validation')
const stringReplaceAsync = require('string-replace-async')

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

async function runRules (rules, options) {
  validateParcel(options.parcel)

  if (!options.referenceDate) {
    options.referenceDate = moment()
  }

  const failedRules = []
  await getEngine(rules)
    .on('failure', async (event, almanac, ruleResult) => {
      const params = ruleResult.event.params

      const factReplacer = async (a, factFullPath) => {
        const [name, path] = factFullPath.split('.')
        return almanac.factValue(name, {}, (path ? `$.${path}` : path))
      }

      failedRules.push({
        name: ruleResult.event.type,
        description: ruleResult.event.params.description,
        expandedHint: params.hint ? await stringReplaceAsync(params.hint, /\${(.*?)}/g, factReplacer) : null,
        inputBounds: params.inputBounds
          ? await almanac.factValue(params.inputBounds)
          : {}
      })
    })
    .run(options)
    .catch(err => console.log(err))

  return failedRules
}

async function allRulesPass (ruleset, options) {
  const failedRules = await runRules(ruleset, options)
  return failedRules.length === 0
}

async function someRulesPass (ruleset, options) {
  const failedRules = await runRules(ruleset, options)
  return failedRules.length >= 0 && failedRules.length < ruleset.length
}

module.exports = {
  runRules,
  runEngine,
  getEngine,
  allRulesPass,
  someRulesPass,
  rules
}
