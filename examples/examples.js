const util = require('util')

const { allRulesPass, runEngine, runRules, getEngine, rules } = require('../ffc-rules-engine')

const parcel = {
  areaFeatures: [],
  hasReintroducedGrazing: false,
  inWaterPollutionZone: false,
  landCoverClass: 0,
  perimeterFeatures: [],
  previousActions: [],
  ref: 'PR123',
  sssi: true,
  totalArea: 7500,
  totalPerimeter: 75
}

function consoleLog (obj) {
  console.log(util.inspect(obj, { depth: 8 }))
}

allRulesPass([rules.perimeter, rules.notSSSI], { parcel, quantity: 50 })
  .then((result) => consoleLog({ result }))

runEngine([rules.perimeter, rules.notSSSI], { parcel, quantity: 50 })
  .then((results) => {
    consoleLog({ events: results.events })
  })

getEngine([rules.perimeter, rules.notSSSI])
  .on('success', (event, almanac, ruleResult) => {
    consoleLog({ status: 'success', event, ruleResult })
  })
  .on('failure', (event, almanac, ruleResult) => {
    consoleLog({ status: 'failed', event, ruleResult })
  })
  .run({ parcel, quantity: 50 })

runRules([rules.perimeter, rules.notSSSI], { parcel, quantity: 150 })
  .then((results) => { consoleLog(results) })
