const getAdjustedPerimeterBoundFact = require('../../facts/get-adjusted-perimeter-bounds')

describe('get-adjusted-perimeter fact', () => {
  test('should return total perimeter if there are no perimeter features', async () => {
    const fakeAlamanc = {
      factValue: () => { return { totalPerimeter: 50, perimeterFeatures: [] } }
    }
    const result = await getAdjustedPerimeterBoundFact({}, fakeAlamanc)
    expect(result).toEqual({ lower: 0, upper: 50 })
  })
  test('should return adjusted perimeter when there are perimeter features', async () => {
    const fakeAlamanc = {
      factValue: () => {
        return { totalPerimeter: 150, perimeterFeatures: [{ length: 20 }, { length: 40 }] }
      }
    }
    const result = await getAdjustedPerimeterBoundFact({}, fakeAlamanc)
    expect(result).toEqual({ lower: 0, upper: 90 })
  })
})
