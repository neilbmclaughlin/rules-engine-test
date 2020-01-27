const { allRulesPass, runEngine, getEngine, rules } = require('../ffc-rules-engine')

const parcel = {
  parcelRef: 'PR123',
  perimeter: 75,
  perimeterFeatures: [],
  previousActions: [],
  sssi: true
}

allRulesPass([rules.perimeter, rules.notSSSI], { parcel, claimedPerimeter: 50 })
  .then((result) => console.log({ result }))

runEngine([rules.perimeter, rules.notSSSI], { parcel, claimedPerimeter: 50 })
  .then((results) => {
    console.log({ events: results.events })
  })

getEngine([rules.perimeter, rules.notSSSI])
  .on('success', (event, almanac, ruleResult) => {
    console.log({ status: 'success', event, ruleResult })
  })
  .on('failure', (event, almanac, ruleResult) => {
    console.log({ status: 'failed', event, ruleResult })
  })
  .run({ parcel, claimedPerimeter: 50 })
