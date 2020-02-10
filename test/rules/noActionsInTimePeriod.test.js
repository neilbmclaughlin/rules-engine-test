const moment = require('moment')
const {
  getParcelWithDefaults,
  expectRulesToPass,
  expectRulesToFail
} = require('../helper')
const { rules } = require('../../ffc-rules-engine')

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
