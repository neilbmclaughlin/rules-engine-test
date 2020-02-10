const moment = require('moment')
const {
  getParcelWithDefaults
} = require('../helper')
const {
  runEngine,
  rules
} = require('../../ffc-rules-engine')

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
