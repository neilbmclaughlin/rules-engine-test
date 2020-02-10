const {
  getParcelWithDefaults,
  expectRulesToPass,
  expectRulesToFail
} = require('../helper')
const { rules } = require('../../ffc-rules-engine')

describe('Rule: Claimed area <= area adjusted to take into account area features', () => {
  test('Passes when there are no area features and claimed area less than area', async () => {
    const parcel = getParcelWithDefaults({ totalArea: 75 })
    await expectRulesToPass(
      [rules.pondlessArea],
      { parcel, quantity: 40 }
    )
  })
  test('Passes when claimed area is less than adjusted area', async () => {
    const parcel = getParcelWithDefaults({
      totalArea: 75,
      areaFeatures: [
        {
          type: 'pond',
          areaCovered: 3
        }
      ]
    })
    await expectRulesToPass(
      [rules.pondlessArea],
      { parcel, quantity: 40 }
    )
  })
  test('Passes when claimed area is equal to adjusted area', async () => {
    const parcel = getParcelWithDefaults({
      totalArea: 75,
      areaFeatures: [
        {
          type: 'pond',
          areaCovered: 3
        }
      ]
    })
    await expectRulesToPass(
      [rules.pondlessArea],
      { parcel, quantity: 72 }
    )
  })
  test('Fails when claimed area is greater than adjusted area', async () => {
    const parcel = getParcelWithDefaults({
      totalArea: 75,
      areaFeatures: [
        {
          type: 'pond',
          areaCovered: 3
        }
      ]
    })
    await expectRulesToFail(
      [rules.pondlessArea],
      { parcel, quantity: 74 },
      {
        name: 'withinPondlessArea',
        description: 'Claimed area should be less than the area adjusted for ponds',
        expandedHint: 'The claimed area of 74 should be within the range adjusted for ponds (0 to 72)',
        inputBounds: { lower: 0, upper: 72 }
      }
    )
  })
})
