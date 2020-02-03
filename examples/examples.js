const { allRulesPass, runEngine, getEngine, rules } = require('../ffc-rules-engine')

const parcel = {
  ref: 'PR123',
  totalPerimeter: 75,
  totalArea: 7500,
  perimeterFeatures: [],
  areaFeatures: [],
  previousActions: [],
  sssi: true,
  landCoverClass: 100
}

allRulesPass([rules.perimeter, rules.notSSSI], { parcel, quantity: 50 })
  .then((result) => console.log({ result }))

runEngine([rules.perimeter, rules.notSSSI], { parcel, quantity: 50 })
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
  .run({ parcel, quantity: 50 })
