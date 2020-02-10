const {
  getParcelWithDefaults,
  expectRulesToPass,
  expectRulesToFail
} = require('../helper')
const { rules } = require('../../ffc-rules-engine')

describe('Rule: Not SSSI', () => {
  test('Fails when parcel is SSSI', async () => {
    const parcel = getParcelWithDefaults({ sssi: true })
    await expectRulesToFail(
      [rules.notSSSI],
      { parcel },
      {
        name: 'notSSSI',
        description: 'Parcel should not be in an SSSI',
        expandedHint: null,
        inputBounds: {}
      }
    )
  })
  test('Passes when parcel is not SSSI', async () => {
    const parcel = getParcelWithDefaults({ sssi: false })
    await expectRulesToPass([rules.notSSSI], { parcel })
  })
})
