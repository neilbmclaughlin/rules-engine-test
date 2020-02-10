const {
  getParcelWithDefaults,
  expectRulesToPass,
  expectRulesToFail
} = require('../helper')
const { rules } = require('../../ffc-rules-engine')

describe('Rule: Claimed perimeter <= actual perimeter', () => {
  const parcel = getParcelWithDefaults({ totalPerimeter: 75 })
  test('Passes when claimed perimeter is less than actual perimeter', async () => {
    await expectRulesToPass(
      [rules.perimeter],
      { parcel, quantity: 50 }
    )
  })
  test('Passes when claimed perimeter equals actual perimeter', async () => {
    await expectRulesToPass(
      [rules.perimeter],
      { parcel, quantity: 75 }
    )
  })
  test('Fails when claimed perimeter is greater than actual perimeter', async () => {
    await expectRulesToFail(
      [rules.perimeter],
      { parcel, quantity: 150 },
      {
        name: 'withinPerimeter',
        description: 'Claimed perimeter should be less than the total perimeter',
        expandedHint: 'The claimed perimeter of 150 should be within the range (0 to 75)',
        inputBounds: { lower: 0, upper: 75 }
      }
    )
  })
})
