const { allRulesPass, runEngine, getEngine, rules } = require('../ffc-rules-engine')

const parcel = {
  parcelRef: 'PR123',
  perimeter: 75,
  perimeterFeatures: [],
  previousActions: [],
  sssi: true
}

allRulesPass(parcel, [rules.perimeter, rules.notSSSI], { claimedPerimeter: 50 })
  .then((result) => console.log({ result }))

runEngine(parcel, [rules.perimeter, rules.notSSSI], { claimedPerimeter: 50 })
  .then((results) => {
    console.log({ events: results.events })
  })

getEngine(parcel, [rules.perimeter, rules.notSSSI])
  .on('success', (event, almanac, ruleResult) => {
    console.log({ status: 'success', event, ruleResult })
  })
  .on('failure', (event, almanac, ruleResult) => {
    console.log({ status: 'failed', event, ruleResult })
  })
  .run({ claimedPerimeter: 50 })
