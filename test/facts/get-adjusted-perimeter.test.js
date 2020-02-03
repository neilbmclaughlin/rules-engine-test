const getAdjustedPerimeterFact = require('../../facts/get-adjusted-perimeter')

describe('get-adjusted-perimeter fact', () => {
  test('should return total perimeter if there are no perimeter features', async () => {
    const fakeAlamanc = {
      factValue: () => { return { totalPerimeter: 50, perimeterFeatures: [] } }
    }
    const result = await getAdjustedPerimeterFact({}, fakeAlamanc)
    expect(result).toBe(50)
  })
  test('should return adjusted perimeter when there are perimeter features', async () => {
    const fakeAlamanc = {
      factValue: () => {
        return { totalPerimeter: 150, perimeterFeatures: [{ length: 20 }, { length: 40 }] }
      }
    }
    const result = await getAdjustedPerimeterFact({}, fakeAlamanc)
    expect(result).toBe(90)
  })
})
