const RuleEngine = require('json-rules-engine')

describe('Perimeter rule', () => {
  const rule = {
    event: {
      type: 'withinPerimeter'
    },
    conditions: {
      all: [
        {
          fact: 'parcelPerimeter',
          operator: 'greaterThanInclusive',
          value: {
            fact: 'claimedPerimeter'
          }
        }
      ]
    }
  }
  const parcels = [
    {
      parcelRef: 'PR123',
      perimeter: 75
    }
  ]
  const getParcelPerimeterFact = async (params, almanac) => {
    const parcelRef = await almanac.factValue('parcelRef')
    const parcel = parcels.filter((p) => p.parcelRef === parcelRef)[0]
    return parcel.perimeter
  }

  const engine = new RuleEngine.Engine()
  engine.addRule(rule)
  engine.addFact('parcelPerimeter', getParcelPerimeterFact)

  test('Claimed perimeter less than actual perimeter should return withinPerimeter event', async () => {
    const result = await engine.run({ parcelRef: 'PR123', claimedPerimeter: 50 })

    expect(result.events.length).toBe(1)
    expect(result.events[0].type).toBe('withinPerimeter')
  })
  test('Claimed perimeter greater than actual perimeter should return no events', async () => {
    const result = await engine.run({ parcelRef: 'PR123', claimedPerimeter: 150 })

    expect(result.events.length).toBe(0)
  })
})
