const { allRulesPass, runEngine, getEngine, rules } = require('../ffc-rules-engine')

const parcel = {
  areaFeatures: [],
  inWaterPollutionZone: false,
  landCoverClass: 0,
  perimeterFeatures: [],
  previousActions: [],
  ref: 'PR123',
  sssi: true,
  totalArea: 7500,
  totalPerimeter: 75
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
