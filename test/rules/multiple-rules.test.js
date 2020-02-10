const moment = require('moment')
const {
  getParcelWithDefaults,
  expectRulesToPass,
  expectCombinationRulesToFail
} = require('../helper')
const {
  allRulesPass,
  someRulesPass,
  rules
} = require('../../ffc-rules-engine')

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
