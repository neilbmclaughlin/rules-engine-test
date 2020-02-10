const { runRules } = require('../ffc-rules-engine')

const getParcelWithDefaults = (options) => {
  return {
    areaFeatures: [],
    hasReintroducedGrazing: false,
    inWaterPollutionZone: false,
    landCoverClass: 0,
    perimeterFeatures: [],
    previousActions: [],
    ref: 'PR123',
    sssi: false,
    totalArea: 0,
    totalPerimeter: 0,
    ...options
  }
}

const expectRulesToPass = async (rules, options) => {
  const failedRules = await runRules(rules, options)
  expect(failedRules.length).toBe(0)
}

const expectRulesToFail = async (rules, options, reasons) => {
  const failedRules = await runRules(rules, options)
  expect(failedRules.length).toBe(1)
  expect(failedRules).toContainEqual(reasons)
}

const expectCombinationRulesToFail = async (rules, options, failedRuleNames) => {
  const failedRules = await runRules(rules, options)
  expect(failedRules.map(r => r.name)).toEqual(failedRuleNames)
}

module.exports = {
  getParcelWithDefaults,
  expectRulesToPass,
  expectRulesToFail,
  expectCombinationRulesToFail
}
