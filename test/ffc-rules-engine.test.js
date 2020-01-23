const moment = require('moment')
const RuleEngine = require('json-rules-engine')

const getParcels = () => {
  return [
    {
      parcelRef: 'PR123',
      perimeter: 75,
      perimeterFeatures: [
        {
          type: 'lake',
          perimeter: 15
        }
      ],
      previousActions: [
        {
          date: '2013-07-03',
          identifier: 'XYZ action'
        },
        {
          date: '2017-04-28',
          identifier: 'XYZ action'
        }
      ]
    }
  ]
}

const getEngine = (parcels, rules) => {
  const getParcelFact = async (params, almanac) => {
    const parcelRef = await almanac.factValue('parcelRef')
    const parcel = parcels.filter((p) => p.parcelRef === parcelRef)[0]
    const perimeterFeatureTotal = parcel.perimeterFeatures
      .map((f) => f.perimeter)
      .reduce((total, p) => total + p)
    const dateOfLastAction = moment.max(parcel.previousActions.map((pa) => moment(pa.date, 'YYYY-MM-DD')))
    const yearsSinceLastAction = moment().diff(dateOfLastAction, 'years', true)
    parcel.yearsSinceLastAction = yearsSinceLastAction
    parcel.adjustedPerimeter = parcel.perimeter - perimeterFeatureTotal
    return parcel
  }
  const engine = new RuleEngine.Engine()
  for (const rule of rules) {
    engine.addRule(rule)
  }
  engine.addFact('parcel', getParcelFact)
  return engine
}

describe('No actions in last 5 years rule', () => {
  const rule = {
    event: {
      type: 'noActionsInLastFiveYears'
    },
    conditions: {
      all: [
        {
          fact: 'parcel',
          path: '$.yearsSinceLastAction',
          operator: 'greaterThan',
          value: {
            fact: 'actionYearsThreshold'
          }
        }
      ]
    }
  }
  test('Passes when last action was more than 2 years ago', async () => {
    const engine = getEngine(getParcels(), [rule])
    const result = await engine.run({
      parcelRef: 'PR123',
      claimedPerimeter: 50,
      actionYearsThreshold: 2
    })

    expect(result.events.length).toBe(1)
    expect(result.events[0].type).toBe('noActionsInLastFiveYears')
  })
  test('Fails when last action was more than 5 years ago', async () => {
    const engine = getEngine(getParcels(), [rule])
    const result = await engine.run({ parcelRef: 'PR123', claimedPerimeter: 50, actionYearsThreshold: 5 })

    expect(result.events.length).toBe(0)
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
  test('Claimed perimeter less than actual perimeter should return withinPerimeter event', async () => {
    const engine = getEngine(getParcels(), [rule])
    const result = await engine.run({ parcelRef: 'PR123', claimedPerimeter: 50 })

    expect(result.events.length).toBe(1)
    expect(result.events[0].type).toBe('withinPerimeter')
  })
  test('Claimed perimeter equal to actual perimeter should return withinPerimeter event', async () => {
    const engine = getEngine(getParcels(), [rule])
    const result = await engine.run({ parcelRef: 'PR123', claimedPerimeter: 75 })

    expect(result.events.length).toBe(1)
    expect(result.events[0].type).toBe('withinPerimeter')
  })
  test('Claimed perimeter greater than actual perimeter should return no events', async () => {
    const engine = getEngine(getParcels(), [rule])
    const result = await engine.run({ parcelRef: 'PR123', claimedPerimeter: 150 })

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

  test('Claimed perimeter less than adjusted perimeter should return withinAdjustedPerimeter event', async () => {
    const engine = getEngine(getParcels(), [rule])
    const result = await engine.run({ parcelRef: 'PR123', claimedPerimeter: 40 })

    expect(result.events.length).toBe(1)
    expect(result.events[0].type).toBe('withinAdjustedPerimeter')
  })

  test('Claimed perimeter equal to adjusted perimeter should return withinAdjustedPerimeter event', async () => {
    const engine = getEngine(getParcels(), [rule])
    const result = await engine.run({ parcelRef: 'PR123', claimedPerimeter: 60 })

    expect(result.events.length).toBe(1)
    expect(result.events[0].type).toBe('withinAdjustedPerimeter')
  })

  test('Claimed perimeter greater than adjusted perimeter should return no events', async () => {
    const engine = getEngine(getParcels(), [rule])
    const result = await engine.run({ parcelRef: 'PR123', claimedPerimeter: 61 })

    expect(result.events.length).toBe(0)
  })
})
