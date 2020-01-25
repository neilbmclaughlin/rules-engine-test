const moment = require('moment')
const { runEngine, rules } = require('../ffc-rules-engine')

describe('RuleEngine handles bad parcel schemas', () => {
  test('Throws and exception for bad schema', async () => {
    const parcel = {
      parcelRef: 'PR123'
    }
    return expect(runEngine(parcel, [rules.notSSSI])).rejects.toThrow('Missing perimeter property')
  })
})
describe('No actions in time period rule', () => {
  test('Passes when there are no previous actions', async () => {
    const parcel = {
      parcelRef: 'PR123',
      perimeter: 75,
      perimeterFeatures: [],
      previousActions: []
    }
    const result = await runEngine(
      parcel,
      [rules.noActionsInTimePeriod],
      { actionId: 'FG1', actionYearsThreshold: 2 }
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
      ]
    }
    const result = await runEngine(
      parcel,
      [rules.noActionsInTimePeriod],
      { actionId: 'FG1', actionYearsThreshold: 2 },
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
      ]
    }
    const result = await runEngine(
      parcel,
      [rules.noActionsInTimePeriod],
      { actionId: 'FG1', actionYearsThreshold: 5 },
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
      ]
    }
    const result = await runEngine(
      parcel,
      [rules.noActionsInTimePeriod],
      { actionId: 'FG1', actionYearsThreshold: 5 },
      moment('2020-01-25')
    )

    expect(result.events.length).toBe(1)
    expect(result.events[0].type).toBe('noActionsInTimePeriod')
  })
  test('if no date passed to runEngine then date defaults to now', async () => {
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
      ]
    }
    const result = await runEngine(
      parcel,
      [rules.noActionsInTimePeriod],
      { actionId: 'FG1', actionYearsThreshold: 2 }
    )

    expect(result.events.length).toBe(0)
  })
})

describe('Is not SSI Rule', () => {
  test('Fails when parcel is SSSI', async () => {
    const parcel = {
      parcelRef: 'PR123',
      perimeter: 75,
      perimeterFeatures: [],
      previousActions: [],
      sssi: true
    }
    const result = await runEngine(parcel, [rules.notSSSI])

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
    const result = await runEngine(parcel, [rules.notSSSI])

    expect(result.events.length).toBe(1)
    expect(result.events[0].type).toBe('notSSSI')
  })
})

describe('Perimeter rule', () => {
  const parcel = {
    parcelRef: 'PR123',
    perimeter: 75,
    perimeterFeatures: [],
    previousActions: []
  }
  test('Passes when claimed perimeter is less than actual perimeter', async () => {
    const result = await runEngine(
      parcel,
      [rules.perimeter],
      { claimedPerimeter: 50 }
    )

    expect(result.events.length).toBe(1)
    expect(result.events[0].type).toBe('withinPerimeter')
  })
  test('Passes when claimed perimeter equals actual perimeter', async () => {
    const result = await runEngine(
      parcel,
      [rules.perimeter],
      { claimedPerimeter: 75 }
    )

    expect(result.events.length).toBe(1)
    expect(result.events[0].type).toBe('withinPerimeter')
  })
  test('Fails when claimed perimeter is greater than actual perimeter', async () => {
    const result = await runEngine(
      parcel,
      [rules.perimeter],
      { claimedPerimeter: 150 }
    )

    expect(result.events.length).toBe(0)
  })
})

describe('AdjustedPerimeter rule', () => {
  test('Passes when there are no perimeter features and claimed perimeter less than perimeter', async () => {
    const parcel = {
      parcelRef: 'PR123',
      perimeter: 75,
      perimeterFeatures: [],
      previousActions: []
    }
    const result = await runEngine(
      parcel,
      [rules.adjustedPerimeter],
      { claimedPerimeter: 40 }
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
      previousActions: []
    }
    const result = await runEngine(
      parcel,
      [rules.adjustedPerimeter],
      { claimedPerimeter: 40 }
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
      previousActions: []
    }
    const result = await runEngine(
      parcel,
      [rules.adjustedPerimeter],
      { claimedPerimeter: 60 }
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
      previousActions: []
    }
    const result = await runEngine(
      parcel,
      [rules.adjustedPerimeter],
      { claimedPerimeter: 61 }
    )

    expect(result.events.length).toBe(0)
  })
})

describe('Perimeter tolerance rule', () => {
  const parcel = {
    parcelRef: 'PR123',
    perimeter: 75,
    perimeterFeatures: [],
    previousActions: []
  }
  test('Passes when claimed perimeter is less than actual perimeter (allowing for tolerance)', async () => {
    const result = await runEngine(
      parcel,
      [rules.tolerancePerimeter],
      { claimedPerimeter: 76, tolerance: 2 }
    )

    expect(result.events.length).toBe(1)
    expect(result.events[0].type).toBe('withinTolerancePerimeter')
  })
  test('Fails when claimed perimeter is greater than actual perimeter (allowing for tolerance)', async () => {
    const result = await runEngine(
      parcel,
      [rules.tolerancePerimeter],
      { claimedPerimeter: 78, tolerance: 2 }
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
      ]
    }
    const result = await runEngine(
      parcel,
      [rules.perimeter, rules.noActionsInTimePeriod],
      {
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
      ]
    }
    const result = await runEngine(
      parcel,
      [rules.perimeter, rules.noActionsInTimePeriod],
      {
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
      ]
    }
    const result = await runEngine(
      parcel,
      [rules.perimeter, rules.noActionsInTimePeriod],
      {
        actionId: 'FG1',
        claimedPerimeter: 50,
        actionYearsThreshold: 5
      }
    )

    expect(result.events.length).toBe(1)
    expect(result.events[0].type).toBe('withinPerimeter')
  })
})
