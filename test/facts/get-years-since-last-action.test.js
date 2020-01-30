const moment = require('moment')
const getYearsSinceLastActionFact = require('../../facts/get-years-since-last-action')

describe('years since last action fact', () => {
  test('should return years when there is a matching previous actions for FG1', async () => {
    const fakeAlamanc = {
      factValue: (factName) => {
        const returnValues = {
          parcel: {
            previousActions: [
              { date: '2017-04-28', identifier: 'FG1' },
              { date: '2017-04-28', identifier: 'ABC' }
            ]
          },
          referenceDate: moment('2019-01-25', 'YYYY-MM-DD'),
          actionId: 'FG1'
        }
        return returnValues[factName]
      }
    }
    const result = await getYearsSinceLastActionFact({}, fakeAlamanc)
    expect(result).toBeCloseTo(1.74)
  })
  test('should return years for most recent previous action for FG1', async () => {
    const fakeAlamanc = {
      factValue: (factName) => {
        const returnValues = {
          parcel: {
            previousActions: [
              { date: '2011-04-28', identifier: 'FG1' },
              { date: '2017-04-28', identifier: 'FG1' }
            ]
          },
          referenceDate: moment('2019-01-25', 'YYYY-MM-DD'),
          actionId: 'FG1'
        }
        return returnValues[factName]
      }
    }
    const result = await getYearsSinceLastActionFact({}, fakeAlamanc)
    expect(result).toBeCloseTo(1.74)
  })
  test('should return null when there are no previous actions', async () => {
    const fakeAlamanc = {
      factValue: (factName) => {
        const returnValues = {
          parcel: {
            previousActions: []
          },
          referenceDate: moment('2019-01-25', 'YYYY-MM-DD'),
          actionId: 'FG1'
        }
        return returnValues[factName]
      }
    }
    const result = await getYearsSinceLastActionFact({}, fakeAlamanc)
    expect(result).toBe(null)
  })
  test('should return null when there are no previous actions for FG1', async () => {
    const fakeAlamanc = {
      factValue: (factName) => {
        const returnValues = {
          parcel: {
            previousActions: [
              { date: '2017-04-28', identifier: 'ABC' }
            ]
          },
          referenceDate: moment('2019-01-25', 'YYYY-MM-DD'),
          actionId: 'FG1'
        }
        return returnValues[factName]
      }
    }
    const result = await getYearsSinceLastActionFact({}, fakeAlamanc)
    expect(result).toBe(null)
  })
})
