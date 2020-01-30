const getPondlessAreaFact = require('../../facts/get-pondless-area')

describe('get-pondless-area fact', () => {
  test('should return total area if there are no pond features', async () => {
    const fakeAlamanc = {
      factValue: () => {
        return { totalArea: 50, areaFeatures: [] }
      }
    }
    const result = await getPondlessAreaFact({}, fakeAlamanc)
    expect(result).toBe(50)
  })

  test('should return total area if there are features which are not ponds', async () => {
    const fakeAlamanc = {
      factValue: () => {
        return { totalArea: 50, areaFeatures: [{ type: 'not a pond', areaCovered: 20 }] }
      }
    }
    const result = await getPondlessAreaFact({}, fakeAlamanc)
    expect(result).toBe(50)
  })

  test('should return adjusted area if there are features which are ponds', async () => {
    const fakeAlamanc = {
      factValue: () => {
        return { totalArea: 50, areaFeatures: [{ type: 'pond', areaCovered: 20 }] }
      }
    }
    const result = await getPondlessAreaFact({}, fakeAlamanc)
    expect(result).toBe(30)
  })
})
