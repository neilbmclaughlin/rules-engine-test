const moment = require('moment')
const RuleEngine = require('json-rules-engine')

const getPerimeterFeaturesSum = (perimeterFeatures) => {
  return perimeterFeatures.length > 0
    ? (perimeterFeatures.map((f) => f.perimeter).reduce((total, p) => total + p))
    : 0
}

const getYearsSinceLastAction = (actionId, previousActions) => {
  console.log({ actionId, previousActions })
  if (previousActions.filter((pa) => pa.identifier === actionId).length > 0) {
    const dateOfLastAction = moment.max(previousActions.map((pa) => moment(pa.date, 'YYYY-MM-DD')))
    return moment().diff(dateOfLastAction, 'years', true)
  }
  return undefined
}

const getEngine = (parcel, rules) => {
  const getParcelFact = async (params, almanac) => {
    const actionId = await almanac.factValue('actionId')
    const perimeterFeatureTotal = getPerimeterFeaturesSum(parcel.perimeterFeatures)
    parcel.adjustedPerimeter = parcel.perimeter - perimeterFeatureTotal
    parcel.yearsSinceLastAction = getYearsSinceLastAction(actionId, parcel.previousActions)
    return parcel
  }
  const engine = new RuleEngine.Engine()
  for (const rule of rules) {
    engine.addRule(rule)
  }
  engine.addFact('parcel', getParcelFact)
  return engine
}

describe('No actions in last x years rule', () => {
  const rule = {
    event: {
      type: 'noActionsInTimePeriod'
    },
    conditions: {
      any: [
        {
          fact: 'parcel',
          path: '$.yearsSinceLastAction',
          operator: 'greaterThan',
          value: {
            fact: 'actionYearsThreshold'
          }
        },
        {
          fact: 'parcel',
          path: '$.yearsSinceLastAction',
          operator: 'equal',
          value: undefined
        }
      ]
    }
  }
  test('Passes when there are no previous actions', async () => {
    const parcel = {
      parcelRef: 'PR123',
      perimeter: 75,
      perimeterFeatures: [],
      previousActions: []
    }
    const engine = getEngine(parcel, [rule])
    const result = await engine.run({
      actionId: 'FG1',
      claimedPerimeter: 50,
      actionYearsThreshold: 2
    })

    expect(result.events.length).toBe(1)
    expect(result.events[0].type).toBe('noActionsInTimePeriod')
  })
  test('Passes when matching last action was in Apr 2017 and threshold check is 2 years', async () => {
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
    const engine = getEngine(parcel, [rule])
    const result = await engine.run({
      actionId: 'FG1',
      claimedPerimeter: 50,
      actionYearsThreshold: 2
    })

    expect(result.events.length).toBe(1)
    expect(result.events[0].type).toBe('noActionsInTimePeriod')
  })
  test('Fails when matching last action was in Apr 2017 and threshold check is 5 years', async () => {
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
    const engine = getEngine(parcel, [rule])
    const result = await engine.run({
      actionId: 'FG1',
      claimedPerimeter: 50,
      actionYearsThreshold: 5
    })

    expect(result.events.length).toBe(0)
  })
  test('Passes when different last action was in Apr 2017 and threshold check is 5 years', async () => {
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
    const engine = getEngine(parcel, [rule])
    const result = await engine.run({
      actionId: 'FG1',
      claimedPerimeter: 50,
      actionYearsThreshold: 5
    })

    expect(result.events.length).toBe(1)
    expect(result.events[0].type).toBe('noActionsInTimePeriod')
  })
})

describe('Perimeter rule', () => {
  const rule = {
    event: {
      type: 'withinPerimeter'
    },
    conditions: {
      all: [
        {
          fact: 'parcel',
          path: '$.perimeter',
          operator: 'greaterThanInclusive',
          value: {
            fact: 'claimedPerimeter'
          }
        }
      ]
    }
  }
  const parcel = {
    parcelRef: 'PR123',
    perimeter: 75,
    perimeterFeatures: [],
    previousActions: []
  }
  test('Passes when claimed perimeter is less than actual perimeter', async () => {
    const engine = getEngine(parcel, [rule])
    const result = await engine.run({
      actionId: 'FG1',
      claimedPerimeter: 50
    })

    expect(result.events.length).toBe(1)
    expect(result.events[0].type).toBe('withinPerimeter')
  })
  test('Passes when claimed perimeter equals actual perimeter', async () => {
    const engine = getEngine(parcel, [rule])
    const result = await engine.run({
      actionId: 'FG1',
      claimedPerimeter: 75
    })

    expect(result.events.length).toBe(1)
    expect(result.events[0].type).toBe('withinPerimeter')
  })
  test('Fails when claimed perimeter is greater than actual perimeter', async () => {
    const engine = getEngine(parcel, [rule])
    const result = await engine.run({
      actionId: 'FG1',
      claimedPerimeter: 150
    })

    expect(result.events.length).toBe(0)
  })
})

describe('AdjustedPerimeter rule', () => {
  const rule = {
    event: {
      type: 'withinAdjustedPerimeter'
    },
    conditions: {
      all: [
        {
          fact: 'parcel',
          path: '$.adjustedPerimeter',
          operator: 'greaterThanInclusive',
          value: {
            fact: 'claimedPerimeter'
          }
        }
      ]
    }
  }
  test('Passes when there are no perimeter features and claimed perimeter less than perimeter', async () => {
    const parcel = {
      parcelRef: 'PR123',
      perimeter: 75,
      perimeterFeatures: [],
      previousActions: []
    }
    const engine = getEngine(parcel, [rule])
    const result = await engine.run({
      actionId: 'FG1',
      claimedPerimeter: 40
    })

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
    const engine = getEngine(parcel, [rule])
    const result = await engine.run({
      actionId: 'FG1',
      claimedPerimeter: 40
    })

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
    const engine = getEngine(parcel, [rule])
    const result = await engine.run({
      actionId: 'FG1',
      claimedPerimeter: 60
    })

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
    const engine = getEngine(parcel, [rule])
    const result = await engine.run({
      actionId: 'FG1',
      claimedPerimeter: 61
    })

    expect(result.events.length).toBe(0)
  })
})
