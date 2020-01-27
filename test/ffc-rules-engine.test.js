const moment = require('moment')
const VError = require('verror')
const { allRulesPass, runEngine, rules } = require('../ffc-rules-engine')

describe('RuleEngine handles bad parcel schemas', () => {
  test('Throws an exception for missing properties', async () => {
    const parcel = {}
    expect.assertions(2)
    try {
      await runEngine([rules.notSSSI], { parcel })
    } catch (err) {
      expect(err.name).toBe('ParcelSchemaValidationError')
      const exepectedMissingProperties = [
        'parcelRef',
        'perimeter',
        'perimeterFeatures',
        'previousActions',
        'sssi'
      ]
      const missingProperties = VError.info(err).errors.map((e) => e.argument)
      expect(missingProperties.sort()).toEqual(exepectedMissingProperties)
    }
  })
})
describe('Rule: No previous actions within time period', () => {
  test('Passes when there are no previous actions', async () => {
    const parcel = {
      parcelRef: 'PR123',
      perimeter: 75,
      perimeterFeatures: [],
      previousActions: [],
      sssi: false
    }
    const result = await runEngine(
      [rules.noActionsInTimePeriod],
      { parcel, actionId: 'FG1', actionYearsThreshold: 2 },
      moment('2020-01-25')
    )

    expect(result.events.length).toBe(1)
    expect(result.events[0].type).toBe('noActionsInTimePeriod')
  })
  test('Passes when matching last action is over 2 years ago and threshold check is 2 years', async () => {
    const parcel = {
      parcelRef: 'PR123',
      perimeter: 75,
      perimeterFeatures: [],
      previousActions: [
        {
          date: '2017-04-28',
          identifier: 'FG1'
        }
      ],
      sssi: false
    }
    const result = await runEngine(
      [rules.noActionsInTimePeriod],
      { parcel, actionId: 'FG1', actionYearsThreshold: 2 },
      moment('2020-01-25')
    )

    expect(result.events.length).toBe(1)
    expect(result.events[0].type).toBe('noActionsInTimePeriod')
  })
  test('Fails when matching last action is 2 years ago and threshold check is 5 years', async () => {
    const parcel = {
      parcelRef: 'PR123',
      perimeter: 75,
      perimeterFeatures: [],
      previousActions: [
        {
          date: '2018-01-25',
          identifier: 'FG1'
        }
      ],
      sssi: false
    }
    const result = await runEngine(
      [rules.noActionsInTimePeriod],
      { parcel, actionId: 'FG1', actionYearsThreshold: 5 },
      moment('2020-01-25')
    )

    expect(result.events.length).toBe(0)
  })
  test('Passes when matching last action is over 2 years ago and threshold check is 5 years', async () => {
    const parcel = {
      parcelRef: 'PR123',
      perimeter: 75,
      perimeterFeatures: [],
      previousActions: [
        {
          date: '2017-04-28',
          identifier: 'XYZ'
        }
      ],
      sssi: false
    }
    const result = await runEngine(
      [rules.noActionsInTimePeriod],
      { parcel, actionId: 'FG1', actionYearsThreshold: 5 },
      moment('2020-01-25')
    )

    expect(result.events.length).toBe(1)
    expect(result.events[0].type).toBe('noActionsInTimePeriod')
  })
  test('If no date passed to runEngine then date defaults to now', async () => {
    const twoYearsAndADayFromNow = moment().subtract(2, 'years').add(1, 'day').format('YYYY-MM-DD')
    const parcel = {
      parcelRef: 'PR123',
      perimeter: 75,
      perimeterFeatures: [],
      previousActions: [
        {
          date: twoYearsAndADayFromNow,
          identifier: 'FG1'
        }
      ],
      sssi: false
    }
    const result = await runEngine(
      [rules.noActionsInTimePeriod],
      { parcel, actionId: 'FG1', actionYearsThreshold: 2 }
    )

    expect(result.events.length).toBe(0)
  })
})

describe('Rule: Not SSSI', () => {
  test('Fails when parcel is SSSI', async () => {
    const parcel = {
      parcelRef: 'PR123',
      perimeter: 75,
      perimeterFeatures: [],
      previousActions: [],
      sssi: true
    }
    const result = await runEngine([rules.notSSSI], { parcel })

    expect(result.events.length).toBe(0)
  })
  test('Passes when parcel is not SSSI', async () => {
    const parcel = {
      parcelRef: 'PR123',
      perimeter: 75,
      perimeterFeatures: [],
      previousActions: [],
      sssi: false
    }
    const result = await runEngine([rules.notSSSI], { parcel })

    expect(result.events.length).toBe(1)
    expect(result.events[0].type).toBe('notSSSI')
  })
})

describe('Rule: Claimed perimeter <= actual perimeter', () => {
  const parcel = {
    parcelRef: 'PR123',
    perimeter: 75,
    perimeterFeatures: [],
    previousActions: [],
    sssi: false
  }
  test('Passes when claimed perimeter is less than actual perimeter', async () => {
    const result = await runEngine(
      [rules.perimeter],
      { parcel, claimedPerimeter: 50 }
    )

    expect(result.events.length).toBe(1)
    expect(result.events[0].type).toBe('withinPerimeter')
  })
  test('Passes when claimed perimeter equals actual perimeter', async () => {
    const result = await runEngine(
      [rules.perimeter],
      { parcel, claimedPerimeter: 75 }
    )

    expect(result.events.length).toBe(1)
    expect(result.events[0].type).toBe('withinPerimeter')
  })
  test('Fails when claimed perimeter is greater than actual perimeter', async () => {
    const result = await runEngine(
      [rules.perimeter],
      { parcel, claimedPerimeter: 150 }
    )

    expect(result.events.length).toBe(0)
  })
})

describe('Rule: Claimed perimeter <= perimeter adjusted to take into account perimeter features', () => {
  test('Passes when there are no perimeter features and claimed perimeter less than perimeter', async () => {
    const parcel = {
      parcelRef: 'PR123',
      perimeter: 75,
      perimeterFeatures: [],
      previousActions: [],
      sssi: false
    }
    const result = await runEngine(
      [rules.adjustedPerimeter],
      { parcel, claimedPerimeter: 40 }
    )

    expect(result.events.length).toBe(1)
    expect(result.events[0].type).toBe('withinAdjustedPerimeter')
  })
  test('Passes when claimed perimeter is less than adjusted perimeter', async () => {
    const parcel = {
      parcelRef: 'PR123',
      perimeter: 75,
      perimeterFeatures: [
        {
          type: 'lake',
          perimeter: 15
        }
      ],
      previousActions: [],
      sssi: false
    }
    const result = await runEngine(
      [rules.adjustedPerimeter],
      { parcel, claimedPerimeter: 40 }
    )

    expect(result.events.length).toBe(1)
    expect(result.events[0].type).toBe('withinAdjustedPerimeter')
  })
  test('Passes when claimed perimeter is equal to adjusted perimeter', async () => {
    const parcel = {
      parcelRef: 'PR123',
      perimeter: 75,
      perimeterFeatures: [
        {
          type: 'lake',
          perimeter: 15
        }
      ],
      previousActions: [],
      sssi: false
    }
    const result = await runEngine(
      [rules.adjustedPerimeter],
      { parcel, claimedPerimeter: 60 }
    )

    expect(result.events.length).toBe(1)
    expect(result.events[0].type).toBe('withinAdjustedPerimeter')
  })
  test('Fails when claimed perimeter is greater than adjusted perimeter', async () => {
    const parcel = {
      parcelRef: 'PR123',
      perimeter: 75,
      perimeterFeatures: [
        {
          type: 'lake',
          perimeter: 15
        }
      ],
      previousActions: [],
      sssi: false
    }
    const result = await runEngine(
      [rules.adjustedPerimeter],
      { parcel, claimedPerimeter: 61 }
    )

    expect(result.events.length).toBe(0)
  })
})

describe('Rule: Claimed perimeter <= perimeter (within accepted tolerance)', () => {
  const parcel = {
    parcelRef: 'PR123',
    perimeter: 75,
    perimeterFeatures: [],
    previousActions: [],
    sssi: false
  }
  test('Passes when claimed perimeter is less than actual perimeter (allowing for tolerance)', async () => {
    const result = await runEngine(
      [rules.tolerancePerimeter],
      { parcel, claimedPerimeter: 76, tolerance: 2 }
    )

    expect(result.events.length).toBe(1)
    expect(result.events[0].type).toBe('withinTolerancePerimeter')
  })
  test('Passes when claimed perimeter is less than actual perimeter (despite tolerance)', async () => {
    const result = await runEngine(
      [rules.tolerancePerimeter],
      { parcel, claimedPerimeter: 50, tolerance: 2 }
    )

    expect(result.events.length).toBe(1)
    expect(result.events[0].type).toBe('withinTolerancePerimeter')
  })
  test('Passes when claimed perimeter is equal to actual perimeter (allowing for tolerance)', async () => {
    const result = await runEngine(
      [rules.tolerancePerimeter],
      { parcel, claimedPerimeter: 77, tolerance: 2 }
    )

    expect(result.events.length).toBe(1)
    expect(result.events[0].type).toBe('withinTolerancePerimeter')
  })
  test('Fails when claimed perimeter is greater than actual perimeter (allowing for tolerance)', async () => {
    const result = await runEngine(
      [rules.tolerancePerimeter],
      { parcel, claimedPerimeter: 78, tolerance: 2 }
    )

    expect(result.events.length).toBe(0)
  })
})

describe('Combination rules', () => {
  test('Passes when both time period and perimeter rules pass', async () => {
    const parcel = {
      parcelRef: 'PR123',
      perimeter: 75,
      perimeterFeatures: [],
      previousActions: [
        {
          date: '2017-04-28',
          identifier: 'FG1'
        }
      ],
      sssi: false
    }
    const result = await runEngine(
      [rules.perimeter, rules.noActionsInTimePeriod],
      {
        parcel,
        actionId: 'FG1',
        claimedPerimeter: 50,
        actionYearsThreshold: 2
      }
    )

    expect(result.events.length).toBe(2)
    const eventNameList = result.events.map((e) => e.type)
    expect(eventNameList).toContain('noActionsInTimePeriod')
    expect(eventNameList).toContain('withinPerimeter')
  })
  test('Fails when only time period passes', async () => {
    const parcel = {
      parcelRef: 'PR123',
      perimeter: 75,
      perimeterFeatures: [],
      previousActions: [
        {
          date: '2017-04-28',
          identifier: 'FG1'
        }
      ],
      sssi: false
    }
    const result = await runEngine(
      [rules.perimeter, rules.noActionsInTimePeriod],
      {
        parcel,
        actionId: 'FG1',
        claimedPerimeter: 500,
        actionYearsThreshold: 2
      }
    )

    expect(result.events.length).toBe(1)
    expect(result.events[0].type).toBe('noActionsInTimePeriod')
  })
  test('Fails when only perimeter rule passes', async () => {
    const parcel = {
      parcelRef: 'PR123',
      perimeter: 75,
      perimeterFeatures: [],
      previousActions: [
        {
          date: '2017-04-28',
          identifier: 'FG1'
        }
      ],
      sssi: false
    }
    const result = await runEngine(
      [rules.perimeter, rules.noActionsInTimePeriod],
      {
        parcel,
        actionId: 'FG1',
        claimedPerimeter: 50,
        actionYearsThreshold: 5
      }
    )

    expect(result.events.length).toBe(1)
    expect(result.events[0].type).toBe('withinPerimeter')
  })
})

describe('allRulesPass', () => {
  test('Returns true when both time period and perimeter rules pass', async () => {
    const parcel = {
      parcelRef: 'PR123',
      perimeter: 75,
      perimeterFeatures: [],
      previousActions: [
        {
          date: '2017-04-28',
          identifier: 'FG1'
        }
      ],
      sssi: false
    }
    const result = await allRulesPass(
      [rules.perimeter, rules.noActionsInTimePeriod],
      {
        parcel,
        actionId: 'FG1',
        claimedPerimeter: 50,
        actionYearsThreshold: 2
      }
    )

    expect(result).toBe(true)
  })
  test('Return false when only time period passes', async () => {
    const parcel = {
      parcelRef: 'PR123',
      perimeter: 75,
      perimeterFeatures: [],
      previousActions: [
        {
          date: '2017-04-28',
          identifier: 'FG1'
        }
      ],
      sssi: false
    }
    const result = await allRulesPass(
      [rules.perimeter, rules.noActionsInTimePeriod],
      {
        parcel,
        actionId: 'FG1',
        claimedPerimeter: 500,
        actionYearsThreshold: 2
      }
    )

    expect(result).toBe(false)
  })
  test('Return false when only perimeter rule passes', async () => {
    const parcel = {
      parcelRef: 'PR123',
      perimeter: 75,
      perimeterFeatures: [],
      previousActions: [
        {
          date: '2017-04-28',
          identifier: 'FG1'
        }
      ],
      sssi: false
    }
    const result = await allRulesPass(
      [rules.perimeter, rules.noActionsInTimePeriod],
      {
        parcel,
        actionId: 'FG1',
        claimedPerimeter: 50,
        actionYearsThreshold: 5
      }
    )

    expect(result).toBe(false)
  })
})
