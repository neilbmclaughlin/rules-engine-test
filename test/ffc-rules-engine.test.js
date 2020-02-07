const moment = require('moment')

const { runRules, allRulesPass, someRulesPass, runEngine, rules } = require('../ffc-rules-engine')

function getParcelWithDefaults (options) {
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

describe('Rule: No previous actions within time period', () => {
  test('Passes when there are no previous actions', async () => {
    const parcel = getParcelWithDefaults({ previousActions: [] })
    const failedRules = await runRules(
      [rules.noActionsInTimePeriod],
      { parcel, actionId: 'FG1', actionYearsThreshold: 2, referenceDate: moment('2020-01-25') }
    )

    expect(failedRules.length).toBe(0)
  })
  test('Passes when matching last action is over 2 years ago and threshold check is 2 years', async () => {
    const parcel = getParcelWithDefaults({
      previousActions: [
        { date: '2017-04-28', identifier: 'FG1' }
      ]
    })
    const failedRules = await runRules(
      [rules.noActionsInTimePeriod],
      { parcel, actionId: 'FG1', actionYearsThreshold: 2, referenceDate: moment('2020-01-25') }
    )

    expect(failedRules.length).toBe(0)
  })
  test('Fails when matching last action is 2 years ago and threshold check is 5 years', async () => {
    const parcel = getParcelWithDefaults({
      previousActions: [
        { date: '2018-01-25', identifier: 'FG1' }
      ]
    })
    const failedRules = await runRules(
      [rules.noActionsInTimePeriod],
      { parcel, actionId: 'FG1', actionYearsThreshold: 5, referenceDate: moment('2021-01-25') }
    )

    expect(failedRules.length).toBe(1)
    expect(failedRules[0].name).toBe('noActionsInTimePeriod')
  })
  test('Passes when matching last action is over 2 years ago and threshold check is 5 years', async () => {
    const parcel = getParcelWithDefaults({
      previousActions: [
        { date: '2017-04-28', identifier: 'XYZ' }
      ]
    })
    const failedRules = await runRules(
      [rules.noActionsInTimePeriod],
      { parcel, actionId: 'FG1', actionYearsThreshold: 5, referenceDate: moment('2020-01-25') }
    )

    expect(failedRules.length).toBe(0)
  })
  test('If no date passed to runEngine then date defaults to now and rule fails', async () => {
    const twoYearsLessADayFromNow = moment().subtract(2, 'years').add(1, 'day').format('YYYY-MM-DD')
    const parcel = getParcelWithDefaults({
      previousActions: [
        { date: twoYearsLessADayFromNow, identifier: 'FG1' }
      ]
    })
    const failedRules = await runRules(
      [rules.noActionsInTimePeriod],
      { parcel, actionId: 'FG1', actionYearsThreshold: 2 }
    )

    expect(failedRules.length).toBe(1)
  })
})

describe('Rule: Not SSSI', () => {
  test('Fails when parcel is SSSI', async () => {
    const parcel = getParcelWithDefaults({ sssi: true })
    const failedRules = await runRules([rules.notSSSI], { parcel })

    expect(failedRules.length).toBe(1)
  })
  test('Passes when parcel is not SSSI', async () => {
    const parcel = getParcelWithDefaults({ sssi: false })
    const failedRules = await runRules([rules.notSSSI], { parcel })

    expect(failedRules.length).toBe(0)
  })
})

describe('Rule: Claimed perimeter <= actual perimeter', () => {
  const parcel = getParcelWithDefaults({ totalPerimeter: 75 })
  test('Passes when claimed perimeter is less than actual perimeter', async () => {
    const failedRules = await runRules(
      [rules.perimeter],
      { parcel, quantity: 50 }
    )

    expect(failedRules.length).toBe(0)
  })
  test('Passes when claimed perimeter equals actual perimeter', async () => {
    const failedRules = await runRules(
      [rules.perimeter],
      { parcel, quantity: 75 }
    )

    expect(failedRules.length).toBe(0)
  })
  test('Fails when claimed perimeter is greater than actual perimeter', async () => {
    const failedRules = await runRules(
      [rules.perimeter],
      { parcel, quantity: 150 }
    )

    expect(failedRules.length).toBe(1)
    expect(failedRules[0].name).toBe('withinPerimeter')
  })
})

describe('Rule: Claimed perimeter <= perimeter adjusted to take into account perimeter features', () => {
  test('Passes when there are no perimeter features and claimed perimeter less than perimeter', async () => {
    const parcel = getParcelWithDefaults({ totalPerimeter: 75 })
    const failedRules = await runRules(
      [rules.adjustedPerimeter],
      { parcel, quantity: 40 }
    )

    expect(failedRules.length).toBe(0)
  })
  test('Passes when claimed perimeter is less than adjusted perimeter', async () => {
    const parcel = getParcelWithDefaults({
      totalPerimeter: 75,
      perimeterFeatures: [{ type: 'lake', length: 15 }]
    })
    const failedRules = await runRules(
      [rules.adjustedPerimeter],
      { parcel, quantity: 40 }
    )

    expect(failedRules.length).toBe(0)
  })
  test('Passes when claimed perimeter is equal to adjusted perimeter', async () => {
    const parcel = getParcelWithDefaults({
      totalPerimeter: 75,
      perimeterFeatures: [{ type: 'lake', length: 15 }]
    })
    const failedRules = await runRules(
      [rules.adjustedPerimeter],
      { parcel, quantity: 60 }
    )

    expect(failedRules.length).toBe(0)
  })
  test('Fails when claimed perimeter is greater than adjusted perimeter', async () => {
    const parcel = getParcelWithDefaults({
      totalPerimeter: 75,
      perimeterFeatures: [{ type: 'lake', length: 15 }]
    })
    const failedRules = await runRules(
      [rules.adjustedPerimeter],
      { parcel, quantity: 61 }
    )

    expect(failedRules.length).toBe(1)
    expect(failedRules[0].name).toBe('withinAdjustedPerimeter')
  })
})

describe('Rule: Claimed perimeter <= perimeter (within accepted tolerance)', () => {
  const parcel = getParcelWithDefaults({ totalPerimeter: 75 })
  test('Passes when claimed perimeter is less than actual perimeter (allowing for tolerance)', async () => {
    const failedRules = await runRules(
      [rules.tolerancePerimeter],
      { parcel, quantity: 76, tolerance: 2 }
    )

    expect(failedRules.length).toBe(0)
  })
  test('Passes when claimed perimeter is less than actual perimeter (despite tolerance)', async () => {
    const failedRules = await runRules(
      [rules.tolerancePerimeter],
      { parcel, quantity: 50, tolerance: 2 }
    )

    expect(failedRules.length).toBe(0)
  })
  test('Passes when claimed perimeter is equal to actual perimeter (allowing for tolerance)', async () => {
    const failedRules = await runRules(
      [rules.tolerancePerimeter],
      { parcel, quantity: 77, tolerance: 2 }
    )

    expect(failedRules.length).toBe(0)
  })
  test('Fails when claimed perimeter is greater than actual perimeter (allowing for tolerance)', async () => {
    const failedRules = await runRules(
      [rules.tolerancePerimeter],
      { parcel, quantity: 78, tolerance: 2 }
    )

    expect(failedRules.length).toBe(1)
    expect(failedRules[0].name).toBe('withinTolerancePerimeter')
  })
})

describe('Rule: Cultivated land', () => {
  test('cultivatedParcel passes when parcel is arable land', async () => {
    const arableLandCode = 110
    const parcel = getParcelWithDefaults({ landCoverClass: arableLandCode })
    const failedRules = await runRules(
      [rules.cultivatedParcel],
      { parcel }
    )

    expect(failedRules.length).toBe(0)
  })
  test('cultivatedParcel passes when parcel is cultivated & managed', async () => {
    const cultivatedAndManagedCode = 670
    const parcel = getParcelWithDefaults({ landCoverClass: cultivatedAndManagedCode })
    const failedRules = await runRules(
      [rules.cultivatedParcel],
      { parcel }
    )

    expect(failedRules.length).toBe(0)
  })
  test('cultivatedParcel fails when parcel is not cultivated', async () => {
    const randomNonCultivatedClass = 0
    const parcel = getParcelWithDefaults({ landCoverClass: randomNonCultivatedClass })
    const failedRules = await runRules(
      [rules.cultivatedParcel],
      { parcel }
    )

    expect(failedRules.length).toBe(1)
    expect(failedRules[0].name).toBe('cultivated')
  })
})

describe('Rule: Claimed area <= actual area', () => {
  const parcel = getParcelWithDefaults({ totalArea: 75 })
  test('Passes when claimed area is less than actual area', async () => {
    const failedRules = await runRules(
      [rules.area],
      { parcel, quantity: 50 }
    )

    expect(failedRules.length).toBe(0)
  })
  test('Passes when claimed area equals actual area', async () => {
    const failedRules = await runRules(
      [rules.area],
      { parcel, quantity: 75 }
    )

    expect(failedRules.length).toBe(0)
  })
  test('Fails when claimed area is greater than actual area', async () => {
    const failedRules = await runRules(
      [rules.area],
      { parcel, quantity: 150 }
    )

    expect(failedRules.length).toBe(1)
    expect(failedRules[0].name).toBe('withinArea')
  })
})

describe('Rule: Claimed area <= area adjusted to take into account area features', () => {
  test('Passes when there are no area features and claimed area less than area', async () => {
    const parcel = getParcelWithDefaults({ totalArea: 75 })
    const failedRules = await runRules(
      [rules.pondlessArea],
      { parcel, quantity: 40 }
    )

    expect(failedRules.length).toBe(0)
  })
  test('Passes when claimed area is less than adjusted area', async () => {
    const parcel = getParcelWithDefaults({
      totalArea: 75,
      areaFeatures: [
        {
          type: 'pond',
          areaCovered: 3
        }
      ]
    })
    const failedRules = await runRules(
      [rules.pondlessArea],
      { parcel, quantity: 40 }
    )

    expect(failedRules.length).toBe(0)
  })
  test('Passes when claimed area is equal to adjusted area', async () => {
    const parcel = getParcelWithDefaults({
      totalArea: 75,
      areaFeatures: [
        {
          type: 'pond',
          areaCovered: 3
        }
      ]
    })
    const failedRules = await runRules(
      [rules.pondlessArea],
      { parcel, quantity: 72 }
    )

    expect(failedRules.length).toBe(0)
  })
  test('Fails when claimed area is greater than adjusted area', async () => {
    const parcel = getParcelWithDefaults({
      totalArea: 75,
      areaFeatures: [
        {
          type: 'pond',
          areaCovered: 3
        }
      ]
    })
    const failedRules = await runRules(
      [rules.pondlessArea],
      { parcel, quantity: 74 }
    )

    expect(failedRules.length).toBe(1)
    expect(failedRules[0].name).toBe('withinPondlessArea')
  })
})

describe('Rule: Has reintroduced grazing', () => {
  test('Passes when parcel has reintroduced grazing', async () => {
    const parcel = getParcelWithDefaults({ hasReintroducedGrazing: true })
    const failedRules = await runRules([rules.hasReintroducedGrazing], { parcel })

    expect(failedRules.length).toBe(0)
  })
  test('Fails when parcel has not reintroduced grazing', async () => {
    const parcel = getParcelWithDefaults({ hasReintroducedGrazing: false })
    const failedRules = await runRules([rules.hasReintroducedGrazing], { parcel })

    expect(failedRules.length).toBe(1)
    expect(failedRules[0].name).toBe('hasReintroducedGrazing')
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
    const failedRules = await runRules(
      [rules.perimeter, rules.noActionsInTimePeriod],
      {
        parcel,
        actionId: 'FG1',
        quantity: 50,
        actionYearsThreshold: 2
      }
    )

    expect(failedRules.length).toBe(0)
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
    const failedRules = await runRules(
      [rules.perimeter, rules.noActionsInTimePeriod],
      {
        parcel,
        actionId: 'FG1',
        quantity: 500,
        actionYearsThreshold: 2,
        referenceDate: moment('2020-01-25')
      }
    )

    expect(failedRules.length).toBe(1)
    expect(failedRules[0].name).toBe('withinPerimeter')
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
    const failedRules = await runRules(
      [rules.perimeter, rules.noActionsInTimePeriod],
      {
        parcel,
        actionId: 'FG1',
        quantity: 50,
        actionYearsThreshold: 5,
        referenceDate: moment('2020-01-25')
      }
    )

    expect(failedRules.length).toBe(1)
    expect(failedRules[0].name).toBe('noActionsInTimePeriod')
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

describe('someRulesPass', () => {
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
    const result = await someRulesPass(
      [rules.perimeter, rules.noActionsInTimePeriod],
      {
        parcel,
        actionId: 'FG1',
        quantity: 50,
        actionYearsThreshold: 1,
        referenceDate: moment('2020-01-25')
      }
    )

    expect(result).toBe(true)
  })
  test('Returns false when both time period and perimeter rules fail', async () => {
    const parcel = getParcelWithDefaults({
      totalPerimeter: 75,
      previousActions: [
        {
          date: '2017-04-28',
          identifier: 'FG1'
        }
      ]
    })
    const result = await someRulesPass(
      [rules.perimeter, rules.noActionsInTimePeriod],
      {
        parcel,
        actionId: 'FG1',
        quantity: 150,
        actionYearsThreshold: 5,
        referenceDate: moment('2020-01-25')
      }
    )

    expect(result).toBe(false)
  })
  test('Return true when only time period passes', async () => {
    const parcel = getParcelWithDefaults({
      totalPerimeter: 75,
      previousActions: [
        {
          date: '2017-04-28',
          identifier: 'FG1'
        }
      ]
    })
    const result = await someRulesPass(
      [rules.perimeter, rules.noActionsInTimePeriod],
      {
        parcel,
        actionId: 'FG1',
        quantity: 500,
        actionYearsThreshold: 1,
        referenceDate: moment('2020-01-25')
      }
    )

    expect(result).toBe(true)
  })
  test('Return true when only perimeter rule passes', async () => {
    const parcel = getParcelWithDefaults({
      totalPerimeter: 75,
      previousActions: [
        {
          date: '2017-04-28',
          identifier: 'FG1'
        }
      ]
    })
    const result = await someRulesPass(
      [rules.perimeter, rules.noActionsInTimePeriod],
      {
        parcel,
        actionId: 'FG1',
        quantity: 50,
        actionYearsThreshold: 5
      }
    )

    expect(result).toBe(true)
  })
})

describe('Requested facts are appended to the response object', () => {
  test('Adjusted perimeter bounds', async () => {
    const parcel = getParcelWithDefaults({
      totalPerimeter: 75,
      perimeterFeatures: [
        {
          type: 'lake',
          length: 15
        }
      ]
    })

    const result = await runEngine(
      [rules.adjustedPerimeter],
      { parcel, actionId: 'FG1', actionYearsThreshold: 2, quantity: 50, referenceDate: moment('2020-01-25') },
      ['adjustedPerimeterBounds']
    )

    expect(result.facts).toEqual({
      adjustedPerimeterBounds: {
        lower: 0,
        upper: parcel.totalPerimeter - parcel.perimeterFeatures[0].length
      }
    })
  })

  test('Pondless area', async () => {
    const parcel = getParcelWithDefaults({
      totalArea: 7.4,
      areaFeatures: [
        {
          type: 'pond',
          areaCovered: 3
        }
      ]
    })

    const result = await runEngine(
      [rules.pondlessArea],
      { parcel, actionId: 'SW6', actionYearsThreshold: 2, quantity: 2, referenceDate: moment('2020-01-25') },
      ['pondlessAreaBounds']
    )

    expect(result.facts).toEqual({
      pondlessAreaBounds: {
        lower: 0,
        upper: parcel.totalArea - parcel.areaFeatures[0].areaCovered
      }
    })
  })

  test('Tolerance upper limit', async () => {
    const parcel = getParcelWithDefaults({
      totalPerimeter: 75
    })
    const tolerance = 2

    const result = await runEngine(
      [rules.tolerancePerimeter],
      { actionId: 'FG1', parcel, tolerance, quantity: 50, referenceDate: moment('2020-01-25') },
      ['toleranceUpperLimit']
    )

    expect(result.facts).toEqual({
      toleranceUpperLimit: parcel.totalPerimeter + tolerance
    })
  })

  test('Years since last action', async () => {
    const parcel = getParcelWithDefaults({
      totalPerimeter: 75,
      previousActions: [
        {
          date: '2011-04-28',
          identifier: 'FG1'
        }
      ]
    })
    const referenceDate = moment('2020-01-25')

    const result = await runEngine(
      [rules.noActionsInTimePeriod],
      { parcel, actionId: 'FG1', actionYearsThreshold: 5, referenceDate },
      ['yearsSinceLastAction']
    )

    expect(result.facts).toEqual({
      yearsSinceLastAction: referenceDate.diff(moment(parcel.previousActions[0].date), 'years', true)
    })
  })

  test('Requested facts are returned even if no rules pass', async () => {
    const parcel = getParcelWithDefaults({
      totalPerimeter: 75,
      perimeterFeatures: [
        {
          type: 'lake',
          length: 15
        }
      ],
      previousActions: [
        {
          date: '2020-01-24',
          identifier: 'FG1'
        }
      ]
    })
    const referenceDate = moment('2020-01-25')

    const result = await runEngine(
      [rules.adjustedPerimeter],
      { parcel, actionId: 'FG1', quantity: 150, referenceDate },
      ['adjustedPerimeterBounds', 'yearsSinceLastAction']
    )

    expect(result.events.length).toBe(0)

    expect(result.facts).toEqual({
      adjustedPerimeterBounds: { lower: 0, upper: parcel.totalPerimeter - parcel.perimeterFeatures[0].length },
      yearsSinceLastAction: referenceDate.diff(moment(parcel.previousActions[0].date), 'years', true)
    })
  })
})

describe('Rule: Water pollution reduction zone', () => {
  test('Passes when parcel is in a water pollution reduction zone', async () => {
    const parcel = getParcelWithDefaults({ inWaterPollutionZone: true })
    const failedRules = await runRules([rules.inWaterPollutionZone], { parcel })

    expect(failedRules.length).toBe(0)
  })

  test('Fails when parcel is not in a water pollution reduction zone', async () => {
    const parcel = getParcelWithDefaults({ inWaterPollutionZone: false })
    const failedRules = await runRules([rules.inWaterPollutionZone], { parcel })

    expect(failedRules.length).toBe(1)
    expect(failedRules[0].name).toBe('inWaterPollutionZone')
  })
})

describe('Get failed rules with reasons', () => {
  test('Perimeter', async () => {
    const parcel = getParcelWithDefaults({
      totalPerimeter: 75
    })

    const failedRules = await runRules(
      [rules.perimeter],
      { parcel, quantity: -1 }
    )

    expect(failedRules.length).toBe(1)
    expect(failedRules).toContainEqual({
      name: 'withinPerimeter',
      description: 'Claimed perimeter should be less than the total perimeter',
      expandedHint: 'The claimed perimeter of -1 should be within the range (0 to 75)',
      inputBounds: { lower: 0, upper: 75 }
    })
  })
  test('Adjusted perimeter', async () => {
    const parcel = getParcelWithDefaults({
      totalPerimeter: 75,
      perimeterFeatures: [
        {
          type: 'lake',
          length: 15
        }
      ]
    })

    const failedRules = await runRules(
      [rules.adjustedPerimeter],
      { parcel, quantity: -1 }
    )

    expect(failedRules.length).toBe(1)
    expect(failedRules).toContainEqual({
      name: 'withinAdjustedPerimeter',
      description: 'Claimed perimeter should be less than the perimeter adjusted for perimeter features',
      expandedHint: 'The claimed perimeter of -1 should be within the range adjusted for perimeter features (0 to 60)',
      inputBounds: { lower: 0, upper: 60 }
    })
  })
  test('Area', async () => {
    const parcel = getParcelWithDefaults({
      totalArea: 75
    })

    const failedRules = await runRules(
      [rules.area],
      { parcel, quantity: -1 }
    )

    expect(failedRules.length).toBe(1)
    expect(failedRules).toContainEqual({
      name: 'withinArea',
      description: 'Claimed area should be less than the total area',
      expandedHint: 'The claimed area of -1 should be within the range (0 to 75)',
      inputBounds: { lower: 0, upper: 75 }
    })
  })
  test('Adjusted Area', async () => {
    const parcel = getParcelWithDefaults({
      totalArea: 75,
      areaFeatures: [
        {
          type: 'pond',
          areaCovered: 3
        }
      ]
    })

    const failedRules = await runRules(
      [rules.pondlessArea],
      { parcel, quantity: -1 }
    )

    expect(failedRules.length).toBe(1)
    expect(failedRules).toContainEqual({
      name: 'withinPondlessArea',
      description: 'Claimed area should be less than the area adjusted for ponds',
      expandedHint: 'The claimed area of -1 should be within the range adjusted for ponds (0 to 72)',
      inputBounds: { lower: 0, upper: 72 }
    })
  })
  test('Not in SSSI', async () => {
    const parcel = getParcelWithDefaults({
      sssi: true
    })

    const failedRules = await runRules(
      [rules.notSSSI],
      { parcel }
    )

    expect(failedRules.length).toBe(1)
    expect(failedRules).toContainEqual({
      name: 'notSSSI',
      description: 'Parcel should not be in an SSSI',
      expandedHint: null,
      inputBounds: {}
    })
  })
  test('No actions in time period', async () => {
    const parcel = getParcelWithDefaults({
      previousActions: [
        { date: '2018-01-25', identifier: 'FG1' }
      ]
    })

    const failedRules = await runRules(
      [rules.noActionsInTimePeriod],
      { parcel, actionId: 'FG1', actionYearsThreshold: 5, referenceDate: moment('2021-01-25') }
    )

    expect(failedRules.length).toBe(1)
    expect(failedRules).toContainEqual({
      name: 'noActionsInTimePeriod',
      description: 'Parcel should not have had any recent previous actions of this type',
      expandedHint: 'Parcel rejected because there was an action of type FG1 in the last 5 years',
      inputBounds: {}
    })
  })
  test('Not in water pollution zone', async () => {
    const parcel = getParcelWithDefaults({
      inWaterPollutionZone: false
    })

    const failedRules = await runRules(
      [rules.inWaterPollutionZone],
      { parcel }
    )

    expect(failedRules.length).toBe(1)
    expect(failedRules).toContainEqual({
      name: 'inWaterPollutionZone',
      description: 'Parcel should be in a water pollution zone',
      expandedHint: null,
      inputBounds: {}
    })
  })
  test('Not in cultivated land cover class', async () => {
    const parcel = getParcelWithDefaults({
      landCoverClass: 999
    })

    const failedRules = await runRules(
      [rules.cultivatedParcel],
      { parcel }
    )

    expect(failedRules.length).toBe(1)
    expect(failedRules).toContainEqual({
      name: 'cultivated',
      description: 'Parcel should be a cultivated parcel',
      expandedHint: null,
      inputBounds: {}
    })
  })
})
