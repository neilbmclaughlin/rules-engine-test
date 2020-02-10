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

const expectRulesToPass = async (rules, options) => {
  const failedRules = await runRules(rules, options)
  expect(failedRules.length).toBe(0)
}

const expectRulesToFail = async (rules, options, reasons) => {
  const failedRules = await runRules(rules, options)
  expect(failedRules.length).toBe(1)
  expect(failedRules).toContainEqual(reasons)
}

describe('Rule: No previous actions within time period', () => {
  test('Passes when there are no previous actions', async () => {
    const parcel = getParcelWithDefaults({ previousActions: [] })
    await expectRulesToPass(
      [rules.noActionsInTimePeriod],
      { parcel, actionId: 'FG1', actionYearsThreshold: 2, referenceDate: moment('2020-01-25') }
    )
  })
  test('Passes when matching last action is over 2 years ago and threshold check is 2 years', async () => {
    const parcel = getParcelWithDefaults({
      previousActions: [
        { date: '2017-04-28', identifier: 'FG1' }
      ]
    })
    await expectRulesToPass(
      [rules.noActionsInTimePeriod],
      { parcel, actionId: 'FG1', actionYearsThreshold: 2, referenceDate: moment('2020-01-25') }
    )
  })
  test('Fails when matching last action is 2 years ago and threshold check is 5 years', async () => {
    const parcel = getParcelWithDefaults({
      previousActions: [
        { date: '2018-01-25', identifier: 'FG1' }
      ]
    })
    await expectRulesToFail(
      [rules.noActionsInTimePeriod],
      { parcel, actionId: 'FG1', actionYearsThreshold: 5, referenceDate: moment('2021-01-25') },
      {
        name: 'noActionsInTimePeriod',
        description: 'Parcel should not have had any recent previous actions of this type',
        expandedHint: 'Parcel rejected because there was an action of type FG1 in the last 5 years',
        inputBounds: {}
      }
    )
  })
  test('Passes when matching last action is over 2 years ago and threshold check is 5 years', async () => {
    const parcel = getParcelWithDefaults({
      previousActions: [
        { date: '2017-04-28', identifier: 'XYZ' }
      ]
    })
    await expectRulesToPass(
      [rules.noActionsInTimePeriod],
      { parcel, actionId: 'FG1', actionYearsThreshold: 5, referenceDate: moment('2020-01-25') }
    )
  })
  test('If no date passed to runEngine then date defaults to now and rule fails', async () => {
    const twoYearsLessADayFromNow = moment().subtract(2, 'years').add(1, 'day').format('YYYY-MM-DD')
    const parcel = getParcelWithDefaults({
      previousActions: [
        { date: twoYearsLessADayFromNow, identifier: 'FG1' }
      ]
    })
    await expectRulesToFail(
      [rules.noActionsInTimePeriod],
      { parcel, actionId: 'FG1', actionYearsThreshold: 2 },
      {
        name: 'noActionsInTimePeriod',
        description: 'Parcel should not have had any recent previous actions of this type',
        expandedHint: 'Parcel rejected because there was an action of type FG1 in the last 2 years',
        inputBounds: {}
      }
    )
  })
})

describe('Rule: Not SSSI', () => {
  test('Fails when parcel is SSSI', async () => {
    const parcel = getParcelWithDefaults({ sssi: true })
    await expectRulesToFail(
      [rules.notSSSI],
      { parcel },
      {
        name: 'notSSSI',
        description: 'Parcel should not be in an SSSI',
        expandedHint: null,
        inputBounds: {}
      }
    )
  })
  test('Passes when parcel is not SSSI', async () => {
    const parcel = getParcelWithDefaults({ sssi: false })
    await expectRulesToPass([rules.notSSSI], { parcel })
  })
})

describe('Rule: Claimed perimeter <= actual perimeter', () => {
  const parcel = getParcelWithDefaults({ totalPerimeter: 75 })
  test('Passes when claimed perimeter is less than actual perimeter', async () => {
    await expectRulesToPass(
      [rules.perimeter],
      { parcel, quantity: 50 }
    )
  })
  test('Passes when claimed perimeter equals actual perimeter', async () => {
    await expectRulesToPass(
      [rules.perimeter],
      { parcel, quantity: 75 }
    )
  })
  test('Fails when claimed perimeter is greater than actual perimeter', async () => {
    await expectRulesToFail(
      [rules.perimeter],
      { parcel, quantity: 150 },
      {
        name: 'withinPerimeter',
        description: 'Claimed perimeter should be less than the total perimeter',
        expandedHint: 'The claimed perimeter of 150 should be within the range (0 to 75)',
        inputBounds: { lower: 0, upper: 75 }
      }
    )
  })
})

describe('Rule: Claimed perimeter <= perimeter adjusted to take into account perimeter features', () => {
  test('Passes when there are no perimeter features and claimed perimeter less than perimeter', async () => {
    const parcel = getParcelWithDefaults({ totalPerimeter: 75 })
    await expectRulesToPass(
      [rules.adjustedPerimeter],
      { parcel, quantity: 40 }
    )
  })
  test('Passes when claimed perimeter is less than adjusted perimeter', async () => {
    const parcel = getParcelWithDefaults({
      totalPerimeter: 75,
      perimeterFeatures: [{ type: 'lake', length: 15 }]
    })
    await expectRulesToPass(
      [rules.adjustedPerimeter],
      { parcel, quantity: 40 }
    )
  })
  test('Passes when claimed perimeter is equal to adjusted perimeter', async () => {
    const parcel = getParcelWithDefaults({
      totalPerimeter: 75,
      perimeterFeatures: [{ type: 'lake', length: 15 }]
    })
    await expectRulesToPass(
      [rules.adjustedPerimeter],
      { parcel, quantity: 60 }
    )
  })
  test('Fails when claimed perimeter is greater than adjusted perimeter', async () => {
    const parcel = getParcelWithDefaults({
      totalPerimeter: 75,
      perimeterFeatures: [{ type: 'lake', length: 15 }]
    })
    await expectRulesToFail(
      [rules.adjustedPerimeter],
      { parcel, quantity: 61 },
      {
        name: 'withinAdjustedPerimeter',
        description: 'Claimed perimeter should be less than the perimeter adjusted for perimeter features',
        expandedHint: 'The claimed perimeter of 61 should be within the range adjusted for perimeter features (0 to 60)',
        inputBounds: { lower: 0, upper: 60 }
      }
    )
  })
})

describe('Rule: Claimed perimeter <= perimeter (within accepted tolerance)', () => {
  const parcel = getParcelWithDefaults({ totalPerimeter: 75 })
  test('Passes when claimed perimeter is less than actual perimeter (allowing for tolerance)', async () => {
    await expectRulesToPass(
      [rules.tolerancePerimeter],
      { parcel, quantity: 76, tolerance: 2 }
    )
  })
  test('Passes when claimed perimeter is less than actual perimeter (despite tolerance)', async () => {
    await expectRulesToPass(
      [rules.tolerancePerimeter],
      { parcel, quantity: 50, tolerance: 2 }
    )
  })
  test('Passes when claimed perimeter is equal to actual perimeter (allowing for tolerance)', async () => {
    await expectRulesToPass(
      [rules.tolerancePerimeter],
      { parcel, quantity: 77, tolerance: 2 }
    )
  })
  test('Fails when claimed perimeter is greater than actual perimeter (allowing for tolerance)', async () => {
    await expectRulesToFail(
      [rules.tolerancePerimeter],
      { parcel, quantity: 78, tolerance: 2 },
      {
        name: 'withinTolerancePerimeter',
        description: 'Perimeter should be within tolerance',
        expandedHint: null,
        inputBounds: {}
      }
    )
  })
})

describe('Rule: Cultivated land', () => {
  test('cultivatedParcel passes when parcel is arable land', async () => {
    const arableLandCode = 110
    const parcel = getParcelWithDefaults({ landCoverClass: arableLandCode })
    await expectRulesToPass(
      [rules.cultivatedParcel],
      { parcel }
    )
  })
  test('cultivatedParcel passes when parcel is cultivated & managed', async () => {
    const cultivatedAndManagedCode = 670
    const parcel = getParcelWithDefaults({ landCoverClass: cultivatedAndManagedCode })
    await expectRulesToPass(
      [rules.cultivatedParcel],
      { parcel }
    )
  })
  test('cultivatedParcel fails when parcel is not cultivated', async () => {
    const randomNonCultivatedClass = 0
    const parcel = getParcelWithDefaults({ landCoverClass: randomNonCultivatedClass })
    await expectRulesToFail(
      [rules.cultivatedParcel],
      { parcel },
      {
        name: 'cultivated',
        description: 'Parcel should be a cultivated parcel',
        expandedHint: null,
        inputBounds: {}
      }
    )
  })
})

describe('Rule: Claimed area <= actual area', () => {
  const parcel = getParcelWithDefaults({ totalArea: 75 })
  test('Passes when claimed area is less than actual area', async () => {
    await expectRulesToPass(
      [rules.area],
      { parcel, quantity: 50 }
    )
  })
  test('Passes when claimed area equals actual area', async () => {
    await expectRulesToPass(
      [rules.area],
      { parcel, quantity: 75 }
    )
  })
  test('Fails when claimed area is greater than actual area', async () => {
    await expectRulesToFail(
      [rules.area],
      { parcel, quantity: 150 },
      {
        name: 'withinArea',
        description: 'Claimed area should be less than the total area',
        expandedHint: 'The claimed area of 150 should be within the range (0 to 75)',
        inputBounds: { lower: 0, upper: 75 }
      }
    )
  })
})

describe('Rule: Claimed area <= area adjusted to take into account area features', () => {
  test('Passes when there are no area features and claimed area less than area', async () => {
    const parcel = getParcelWithDefaults({ totalArea: 75 })
    await expectRulesToPass(
      [rules.pondlessArea],
      { parcel, quantity: 40 }
    )
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
    await expectRulesToPass(
      [rules.pondlessArea],
      { parcel, quantity: 40 }
    )
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
    await expectRulesToPass(
      [rules.pondlessArea],
      { parcel, quantity: 72 }
    )
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
    await expectRulesToFail(
      [rules.pondlessArea],
      { parcel, quantity: 74 },
      {
        name: 'withinPondlessArea',
        description: 'Claimed area should be less than the area adjusted for ponds',
        expandedHint: 'The claimed area of 74 should be within the range adjusted for ponds (0 to 72)',
        inputBounds: { lower: 0, upper: 72 }
      }
    )
  })
})

describe('Rule: Has reintroduced grazing', () => {
  test('Passes when parcel has reintroduced grazing', async () => {
    const parcel = getParcelWithDefaults({ hasReintroducedGrazing: true })
    await expectRulesToPass([rules.hasReintroducedGrazing], { parcel })
  })
  test('Fails when parcel has not reintroduced grazing', async () => {
    const parcel = getParcelWithDefaults({ hasReintroducedGrazing: false })
    await expectRulesToFail(
      [rules.hasReintroducedGrazing],
      { parcel },
      {
        name: 'hasReintroducedGrazing',
        description: 'Grazing has been reintroduced for the parcel',
        expandedHint: null,
        inputBounds: {}
      }
    )
  })
})

describe('Combination rules', () => {
  const expectCombinationRulesToFail = async (rules, options, failedRuleNames) => {
    const failedRules = await runRules(rules, options)
    expect(failedRules.map(r => r.name)).toEqual(failedRuleNames)
  }
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
    await expectRulesToPass(
      [rules.perimeter, rules.noActionsInTimePeriod],
      {
        parcel,
        actionId: 'FG1',
        quantity: 50,
        actionYearsThreshold: 2
      }
    )
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
    await expectCombinationRulesToFail(
      [rules.perimeter, rules.noActionsInTimePeriod],
      {
        parcel,
        actionId: 'FG1',
        quantity: 500,
        actionYearsThreshold: 2,
        referenceDate: moment('2020-01-25')
      },
      ['withinPerimeter']
    )
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
    await expectCombinationRulesToFail(
      [rules.perimeter, rules.noActionsInTimePeriod],
      {
        parcel,
        actionId: 'FG1',
        quantity: 50,
        actionYearsThreshold: 5,
        referenceDate: moment('2020-01-25')
      },
      ['noActionsInTimePeriod']
    )
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
    await expectRulesToPass([rules.inWaterPollutionZone], { parcel })
  })

  test('Fails when parcel is not in a water pollution reduction zone', async () => {
    const parcel = getParcelWithDefaults({ inWaterPollutionZone: false })
    await expectRulesToFail(
      [rules.inWaterPollutionZone],
      { parcel },
      {
        name: 'inWaterPollutionZone',
        description: 'Parcel should be in a water pollution zone',
        expandedHint: null,
        inputBounds: {}
      }
    )
  })
})
