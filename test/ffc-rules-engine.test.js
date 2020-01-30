const moment = require('moment')
const { allRulesPass, runEngine, getEngine, rules } = require('../ffc-rules-engine')

function getParcelWithDefaults (options) {
  return {
    ref: 'PR123',
    totalPerimeter: 75,
    totalArea: 75,
    perimeterFeatures: [],
    areaFeatures: [],
    previousActions: [],
    sssi: false,
    ...options
  }
}

describe('Rule: No previous actions within time period', () => {
  test('Passes when there are no previous actions', async () => {
    const parcel = getParcelWithDefaults({ previousActions: [] })
    const result = await runEngine(
      [rules.noActionsInTimePeriod],
      { parcel, actionId: 'FG1', actionYearsThreshold: 2 },
      moment('2020-01-25')
    )

    expect(result.events.length).toBe(1)
    expect(result.events[0].type).toBe('noActionsInTimePeriod')
  })
  test('Passes when matching last action is over 2 years ago and threshold check is 2 years', async () => {
    const parcel = getParcelWithDefaults({
      previousActions: [
        { date: '2017-04-28', identifier: 'FG1' }
      ]
    })
    const result = await runEngine(
      [rules.noActionsInTimePeriod],
      { parcel, actionId: 'FG1', actionYearsThreshold: 2, referenceDate: moment('2020-01-25') }
    )

    expect(result.events.length).toBe(1)
    expect(result.events[0].type).toBe('noActionsInTimePeriod')
  })
  test('Fails when matching last action is 2 years ago and threshold check is 5 years', async () => {
    const parcel = getParcelWithDefaults({
      previousActions: [
        { date: '2018-01-25', identifier: 'FG1' }
      ]
    })
    const result = await runEngine(
      [rules.noActionsInTimePeriod],
      { parcel, actionId: 'FG1', actionYearsThreshold: 5, referenceDate: moment('2021-01-25') }
    )

    expect(result.events.length).toBe(0)
  })
  test('Passes when matching last action is over 2 years ago and threshold check is 5 years', async () => {
    const parcel = getParcelWithDefaults({
      previousActions: [
        { date: '2017-04-28', identifier: 'XYZ' }
      ]
    })
    const result = await runEngine(
      [rules.noActionsInTimePeriod],
      { parcel, actionId: 'FG1', actionYearsThreshold: 5, referenceDate: moment('2020-01-25') }
    )

    expect(result.events.length).toBe(1)
    expect(result.events[0].type).toBe('noActionsInTimePeriod')
  })
  test('If no date passed to runEngine then date defaults to now', async () => {
    const twoYearsAndADayFromNow = moment().subtract(2, 'years').add(1, 'day').format('YYYY-MM-DD')
    const parcel = getParcelWithDefaults({
      previousActions: [
        { date: twoYearsAndADayFromNow, identifier: 'FG1' }
      ]
    })
    const result = await runEngine(
      [rules.noActionsInTimePeriod],
      { parcel, actionId: 'FG1', actionYearsThreshold: 2 }
    )

    expect(result.events.length).toBe(0)
  })
})

describe('Rule: Not SSSI', () => {
  test('Fails when parcel is SSSI', async () => {
    const parcel = getParcelWithDefaults({ sssi: true })
    const result = await runEngine([rules.notSSSI], { parcel })

    expect(result.events.length).toBe(0)
  })
  test('Passes when parcel is not SSSI', async () => {
    const parcel = getParcelWithDefaults({ sssi: false })
    const result = await runEngine([rules.notSSSI], { parcel })

    expect(result.events.length).toBe(1)
    expect(result.events[0].type).toBe('notSSSI')
  })
})

describe('Rule: Claimed perimeter <= actual perimeter', () => {
  const parcel = getParcelWithDefaults({ totalPerimeter: 75 })
  test('Passes when claimed perimeter is less than actual perimeter', async () => {
    const result = await runEngine(
      [rules.perimeter],
      { parcel, quantity: 50 }
    )

    expect(result.events.length).toBe(1)
    expect(result.events[0].type).toBe('withinPerimeter')
  })
  test('Passes when claimed perimeter equals actual perimeter', async () => {
    const result = await runEngine(
      [rules.perimeter],
      { parcel, quantity: 75 }
    )

    expect(result.events.length).toBe(1)
    expect(result.events[0].type).toBe('withinPerimeter')
  })
  test('Fails when claimed perimeter is greater than actual perimeter', async () => {
    const result = await runEngine(
      [rules.perimeter],
      { parcel, quantity: 150 }
    )

    expect(result.events.length).toBe(0)
  })
  test('Returns the claimed perimeter as result', async () => {
    // Note: this test is demonstrating how to return a calculated maximum value for a perimeter
    // It is not testing any of our code
    expect.assertions(2)
    await getEngine([rules.perimeter])
      .on('success', (event, almanac, ruleResult) => {
        const returnedFactsResults = ruleResult.conditions.all.map((c) => c.factResult)
        expect(returnedFactsResults.length).toBe(1)
        expect(returnedFactsResults[0]).toBe(75)
      })
      .run({ parcel, quantity: 0 })
  })
})

describe('Rule: Claimed perimeter <= perimeter adjusted to take into account perimeter features', () => {
  test('Passes when there are no perimeter features and claimed perimeter less than perimeter', async () => {
    const parcel = getParcelWithDefaults({ totalPerimeter: 75 })
    const result = await runEngine(
      [rules.adjustedPerimeter],
      { parcel, quantity: 40 }
    )

    expect(result.events.length).toBe(1)
    expect(result.events[0].type).toBe('withinAdjustedPerimeter')
  })
  test('Passes when claimed perimeter is less than adjusted perimeter', async () => {
    const parcel = getParcelWithDefaults({
      totalPerimeter: 75,
      perimeterFeatures: [{ type: 'lake', length: 15 }]
    })
    const result = await runEngine(
      [rules.adjustedPerimeter],
      { parcel, quantity: 40 }
    )

    expect(result.events.length).toBe(1)
    expect(result.events[0].type).toBe('withinAdjustedPerimeter')
  })
  test('Passes when claimed perimeter is equal to adjusted perimeter', async () => {
    const parcel = getParcelWithDefaults({
      totalPerimeter: 75,
      perimeterFeatures: [{ type: 'lake', length: 15 }]
    })
    const result = await runEngine(
      [rules.adjustedPerimeter],
      { parcel, quantity: 60 }
    )

    expect(result.events.length).toBe(1)
    expect(result.events[0].type).toBe('withinAdjustedPerimeter')
  })
  test('Fails when claimed perimeter is greater than adjusted perimeter', async () => {
    const parcel = getParcelWithDefaults({
      totalPerimeter: 75,
      perimeterFeatures: [{ type: 'lake', length: 15 }]
    })
    const result = await runEngine(
      [rules.adjustedPerimeter],
      { parcel, quantity: 61 }
    )

    expect(result.events.length).toBe(0)
  })
  test('Returns adjusted perimeter in result', async () => {
    // Note: this test is demonstrating how to return a calculated maximum value for a perimeter
    // It is not testing any of our code
    const parcel = getParcelWithDefaults({
      totalPerimeter: 75,
      perimeterFeatures: [{ type: 'lake', length: 15 }]
    })
    expect.assertions(2)
    await getEngine([rules.adjustedPerimeter])
      .on('success', (event, almanac, ruleResult) => {
        const returnedFactsResults = ruleResult.conditions.all.map((c) => c.factResult)
        expect(returnedFactsResults.length).toBe(1)
        expect(returnedFactsResults[0]).toBe(60)
      })
      .run({ parcel, quantity: 0 })
  })
})

describe('Rule: Claimed perimeter <= perimeter (within accepted tolerance)', () => {
  const parcel = getParcelWithDefaults({})
  test('Passes when claimed perimeter is less than actual perimeter (allowing for tolerance)', async () => {
    const result = await runEngine(
      [rules.tolerancePerimeter],
      { parcel, quantity: 76, tolerance: 2 }
    )

    expect(result.events.length).toBe(1)
    expect(result.events[0].type).toBe('withinTolerancePerimeter')
  })
  test('Passes when claimed perimeter is less than actual perimeter (despite tolerance)', async () => {
    const result = await runEngine(
      [rules.tolerancePerimeter],
      { parcel, quantity: 50, tolerance: 2 }
    )

    expect(result.events.length).toBe(1)
    expect(result.events[0].type).toBe('withinTolerancePerimeter')
  })
  test('Passes when claimed perimeter is equal to actual perimeter (allowing for tolerance)', async () => {
    const result = await runEngine(
      [rules.tolerancePerimeter],
      { parcel, quantity: 77, tolerance: 2 }
    )

    expect(result.events.length).toBe(1)
    expect(result.events[0].type).toBe('withinTolerancePerimeter')
  })
  test('Fails when claimed perimeter is greater than actual perimeter (allowing for tolerance)', async () => {
    const result = await runEngine(
      [rules.tolerancePerimeter],
      { parcel, quantity: 78, tolerance: 2 }
    )

    expect(result.events.length).toBe(0)
  })
})

describe('Rule: Cultivated land', () => {
  test('cultivatedParcel passes when parcel is arable land', async () => {
    const arableLandCode = 110
    const parcel = getParcelWithDefaults({ landCoverClass: arableLandCode })
    const result = await runEngine(
      [rules.cultivatedParcel],
      { parcel }
    )

    expect(result.events.length).toBe(1)
    expect(result.events[0].type).toBe('cultivated')
  })
  test('cultivatedParcel passes when parcel is cultivated & managed', async () => {
    const cultivatedAndManagedCode = 670
    const parcel = getParcelWithDefaults({ landCoverClass: cultivatedAndManagedCode })
    const result = await runEngine(
      [rules.cultivatedParcel],
      { parcel }
    )

    expect(result.events.length).toBe(1)
    expect(result.events[0].type).toBe('cultivated')
  })
  test('cultivatedParcel fails when parcel is not cultivated', async () => {
    const randomNonCulivatedClass = 100
    const parcel = getParcelWithDefaults({ landCoverClass: randomNonCulivatedClass })
    const result = await runEngine(
      [rules.cultivatedParcel],
      { parcel }
    )

    expect(result.events.length).toBe(0)
  })
})

describe('Rule: Claimed area <= actual area', () => {
  const parcel = getParcelWithDefaults({})
  test('Passes when claimed area is less than actual area', async () => {
    const result = await runEngine(
      [rules.area],
      { parcel, quantity: 50 }
    )

    expect(result.events.length).toBe(1)
    expect(result.events[0].type).toBe('withinArea')
  })
  test('Passes when claimed area equals actual area', async () => {
    const result = await runEngine(
      [rules.area],
      { parcel, quantity: 75 }
    )

    expect(result.events.length).toBe(1)
    expect(result.events[0].type).toBe('withinArea')
  })
  test('Fails when claimed area is greater than actual area', async () => {
    const result = await runEngine(
      [rules.area],
      { parcel, quantity: 150 }
    )

    expect(result.events.length).toBe(0)
  })
  test('Returns the claimed area as result', async () => {
    // Note: this test is demonstrating how to return a calculated maximum value for a area
    // It is not testing any of our code
    expect.assertions(2)
    await getEngine([rules.area])
      .on('success', (event, almanac, ruleResult) => {
        const returnedFactsResults = ruleResult.conditions.all.map((c) => c.factResult)
        expect(returnedFactsResults.length).toBe(1)
        expect(returnedFactsResults[0]).toBe(75)
      })
      .run({ parcel, quantity: 0 })
  })
})

describe('Rule: Claimed area <= area adjusted to take into account area features', () => {
  test('Passes when there are no area features and claimed area less than area', async () => {
    const parcel = getParcelWithDefaults({})
    const result = await runEngine(
      [rules.pondlessArea],
      { parcel, quantity: 40 }
    )

    expect(result.events.length).toBe(1)
    expect(result.events[0].type).toBe('withinPondlessArea')
  })
  test('Passes when claimed area is less than adjusted area', async () => {
    const parcel = getParcelWithDefaults({
      areaFeatures: [
        {
          type: 'pond',
          areaCovered: 3
        }
      ]
    })
    const result = await runEngine(
      [rules.pondlessArea],
      { parcel, quantity: 40 }
    )

    expect(result.events.length).toBe(1)
    expect(result.events[0].type).toBe('withinPondlessArea')
  })
  test('Passes when claimed area is equal to adjusted area', async () => {
    const parcel = getParcelWithDefaults({
      areaFeatures: [
        {
          type: 'pond',
          areaCovered: 3
        }
      ]
    })
    const result = await runEngine(
      [rules.pondlessArea],
      { parcel, quantity: 72 }
    )

    expect(result.events.length).toBe(1)
    expect(result.events[0].type).toBe('withinPondlessArea')
  })
  test('Fails when claimed area is greater than adjusted area', async () => {
    const parcel = getParcelWithDefaults({
      areaFeatures: [
        {
          type: 'pond',
          areaCovered: 3
        }
      ]
    })
    const result = await runEngine(
      [rules.pondlessArea],
      { parcel, quantity: 74 }
    )

    expect(result.events.length).toBe(0)
  })
  test('Returns adjusted area in result', async () => {
    // Note: this test is demonstrating how to return a calculated maximum value for a area
    // It is not testing any of our code
    const parcel = getParcelWithDefaults({
      areaFeatures: [
        {
          type: 'pond',
          areaCovered: 3
        }
      ]
    })
    expect.assertions(2)
    await getEngine([rules.pondlessArea])
      .on('success', (event, almanac, ruleResult) => {
        const returnedFactsResults = ruleResult.conditions.all.map((c) => c.factResult)
        expect(returnedFactsResults.length).toBe(1)
        expect(returnedFactsResults[0]).toBe(72)
      })
      .run({ parcel, quantity: 0 })
  })
})

describe('Combination rules', () => {
  test('Passes when both time period and perimeter rules pass', async () => {
    const parcel = getParcelWithDefaults({
      totalPerimeter: 75,
      previousActions: [
        {
          date: '2017-04-28',
          identifier: 'FG1'
        }
      ]
    })
    const result = await runEngine(
      [rules.perimeter, rules.noActionsInTimePeriod],
      {
        parcel,
        actionId: 'FG1',
        quantity: 50,
        actionYearsThreshold: 2
      }
    )

    expect(result.events.length).toBe(2)
    const eventNameList = result.events.map((e) => e.type)
    expect(eventNameList).toContain('noActionsInTimePeriod')
    expect(eventNameList).toContain('withinPerimeter')
  })
  test('Fails when only time period passes', async () => {
    const parcel = getParcelWithDefaults({
      totalPerimeter: 75,
      previousActions: [
        {
          date: '2017-04-28',
          identifier: 'FG1'
        }
      ]
    })
    const result = await runEngine(
      [rules.perimeter, rules.noActionsInTimePeriod],
      {
        parcel,
        actionId: 'FG1',
        quantity: 500,
        actionYearsThreshold: 2
      }
    )

    expect(result.events.length).toBe(1)
    expect(result.events[0].type).toBe('noActionsInTimePeriod')
  })
  test('Fails when only perimeter rule passes', async () => {
    const parcel = getParcelWithDefaults({
      totalPerimeter: 75,
      previousActions: [
        {
          date: '2017-04-28',
          identifier: 'FG1'
        }
      ]
    })
    const result = await runEngine(
      [rules.perimeter, rules.noActionsInTimePeriod],
      {
        parcel,
        actionId: 'FG1',
        quantity: 50,
        actionYearsThreshold: 5
      }
    )

    expect(result.events.length).toBe(1)
    expect(result.events[0].type).toBe('withinPerimeter')
  })
})

describe('allRulesPass', () => {
  test('Returns true when both time period and perimeter rules pass', async () => {
    const parcel = getParcelWithDefaults({
      totalPerimeter: 75,
      previousActions: [
        {
          date: '2017-04-28',
          identifier: 'FG1'
        }
      ]
    })
    const result = await allRulesPass(
      [rules.perimeter, rules.noActionsInTimePeriod],
      {
        parcel,
        actionId: 'FG1',
        quantity: 50,
        actionYearsThreshold: 2
      }
    )

    expect(result).toBe(true)
  })
  test('Return false when only time period passes', async () => {
    const parcel = getParcelWithDefaults({
      totalPerimeter: 75,
      previousActions: [
        {
          date: '2017-04-28',
          identifier: 'FG1'
        }
      ]
    })
    const result = await allRulesPass(
      [rules.perimeter, rules.noActionsInTimePeriod],
      {
        parcel,
        actionId: 'FG1',
        quantity: 500,
        actionYearsThreshold: 2
      }
    )

    expect(result).toBe(false)
  })
  test('Return false when only perimeter rule passes', async () => {
    const parcel = getParcelWithDefaults({
      totalPerimeter: 75,
      previousActions: [
        {
          date: '2017-04-28',
          identifier: 'FG1'
        }
      ]
    })
    const result = await allRulesPass(
      [rules.perimeter, rules.noActionsInTimePeriod],
      {
        parcel,
        actionId: 'FG1',
        quantity: 50,
        actionYearsThreshold: 5
      }
    )

    expect(result).toBe(false)
  })
})
