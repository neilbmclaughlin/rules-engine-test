const {
  getParcelWithDefaults,
  expectRulesToPass,
  expectRulesToFail
} = require('../helper')
const { rules } = require('../../ffc-rules-engine')

describe('Rule: Claimed perimeter <= perimeter (within accepted tolerance)', () => {
  const parcel = getParcelWithDefaults({ totalPerimeter: 75 })
  test('Passes when claimed perimeter is less than actual perimeter (allowing for tolerance)', async () => {
    await expectRulesToPass(
      [rules.tolerancePerimeter],
      { parcel, quantity: 76, tolerance: 2 }
    )
  })
  test('Passes when claimed perimeter is less than actual perimeter (despite tolerance)', async () => {
    await expectRulesToPass(
      [rules.tolerancePerimeter],
      { parcel, quantity: 50, tolerance: 2 }
    )
  })
  test('Passes when claimed perimeter is equal to actual perimeter (allowing for tolerance)', async () => {
    await expectRulesToPass(
      [rules.tolerancePerimeter],
      { parcel, quantity: 77, tolerance: 2 }
    )
  })
  test('Fails when claimed perimeter is greater than actual perimeter (allowing for tolerance)', async () => {
    await expectRulesToFail(
      [rules.tolerancePerimeter],
      { parcel, quantity: 78, tolerance: 2 },
      {
        name: 'withinTolerancePerimeter',
        description: 'Perimeter should be within tolerance',
        expandedHint: null,
        inputBounds: {}
      }
    )
  })
})
