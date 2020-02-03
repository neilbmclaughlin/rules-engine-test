const getToleranceUpperLimitFact = require('../../facts/get-tolerance-upper-limit')

describe('get-tolerance-upper-limit fact', () => {
  test('should return tolerance upper limit', async () => {
    const fakeAlamanc = {
      factValue: (factName) => {
        const returnValues = {
          parcel: { totalPerimeter: 50 },
          tolerance: 5
        }
        return returnValues[factName]
      }
    }
    const result = await getToleranceUpperLimitFact({}, fakeAlamanc)
    expect(result).toBe(55)
  })
})
