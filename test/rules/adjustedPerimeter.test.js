const {
  getParcelWithDefaults,
  expectRulesToPass,
  expectRulesToFail
} = require('../helper')
const { rules } = require('../../ffc-rules-engine')

describe('Rule: Claimed perimeter <= perimeter adjusted to take into account perimeter features', () => {
  test('Passes when there are no perimeter features and claimed perimeter less than perimeter', async () => {
    const parcel = getParcelWithDefaults({ totalPerimeter: 75 })
    await expectRulesToPass(
      [rules.adjustedPerimeter],
      { parcel, quantity: 40 }
    )
  })
  test('Passes when claimed perimeter is less than adjusted perimeter', async () => {
    const parcel = getParcelWithDefaults({
      totalPerimeter: 75,
      perimeterFeatures: [{ type: 'lake', length: 15 }]
    })
    await expectRulesToPass(
      [rules.adjustedPerimeter],
      { parcel, quantity: 40 }
    )
  })
  test('Passes when claimed perimeter is equal to adjusted perimeter', async () => {
    const parcel = getParcelWithDefaults({
      totalPerimeter: 75,
      perimeterFeatures: [{ type: 'lake', length: 15 }]
    })
    await expectRulesToPass(
      [rules.adjustedPerimeter],
      { parcel, quantity: 60 }
    )
  })
  test('Fails when claimed perimeter is greater than adjusted perimeter', async () => {
    const parcel = getParcelWithDefaults({
      totalPerimeter: 75,
      perimeterFeatures: [{ type: 'lake', length: 15 }]
    })
    await expectRulesToFail(
      [rules.adjustedPerimeter],
      { parcel, quantity: 61 },
      {
        name: 'withinAdjustedPerimeter',
        description: 'Claimed perimeter should be less than the perimeter adjusted for perimeter features',
        expandedHint: 'The claimed perimeter of 61 should be within the range adjusted for perimeter features (0 to 60)',
        inputBounds: { lower: 0, upper: 60 }
      }
    )
  })
})
