const {
  getParcelWithDefaults,
  expectRulesToPass,
  expectRulesToFail
} = require('../helper')
const { rules } = require('../../ffc-rules-engine')

describe('Rule: Claimed area <= actual area', () => {
  const parcel = getParcelWithDefaults({ totalArea: 75 })
  test('Passes when claimed area is less than actual area', async () => {
    await expectRulesToPass(
      [rules.area],
      { parcel, quantity: 50 }
    )
  })
  test('Passes when claimed area equals actual area', async () => {
    await expectRulesToPass(
      [rules.area],
      { parcel, quantity: 75 }
    )
  })
  test('Fails when claimed area is greater than actual area', async () => {
    await expectRulesToFail(
      [rules.area],
      { parcel, quantity: 150 },
      {
        name: 'withinArea',
        description: 'Claimed area should be less than the total area',
        expandedHint: 'The claimed area of 150 should be within the range (0 to 75)',
        inputBounds: { lower: 0, upper: 75 }
      }
    )
  })
})
