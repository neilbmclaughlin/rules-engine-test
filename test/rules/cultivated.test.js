const {
  getParcelWithDefaults,
  expectRulesToPass,
  expectRulesToFail
} = require('../helper')
const { rules } = require('../../ffc-rules-engine')

describe('Rule: Cultivated land', () => {
  test('cultivatedParcel passes when parcel is arable land', async () => {
    const arableLandCode = 110
    const parcel = getParcelWithDefaults({ landCoverClass: arableLandCode })
    await expectRulesToPass(
      [rules.cultivatedParcel],
      { parcel }
    )
  })
  test('cultivatedParcel passes when parcel is cultivated & managed', async () => {
    const cultivatedAndManagedCode = 670
    const parcel = getParcelWithDefaults({ landCoverClass: cultivatedAndManagedCode })
    await expectRulesToPass(
      [rules.cultivatedParcel],
      { parcel }
    )
  })
  test('cultivatedParcel fails when parcel is not cultivated', async () => {
    const randomNonCultivatedClass = 0
    const parcel = getParcelWithDefaults({ landCoverClass: randomNonCultivatedClass })
    await expectRulesToFail(
      [rules.cultivatedParcel],
      { parcel },
      {
        name: 'cultivated',
        description: 'Parcel should be a cultivated parcel',
        expandedHint: null,
        inputBounds: {}
      }
    )
  })
})
