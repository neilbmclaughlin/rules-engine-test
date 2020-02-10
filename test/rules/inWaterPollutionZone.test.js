const {
  getParcelWithDefaults,
  expectRulesToPass,
  expectRulesToFail
} = require('../helper')
const { rules } = require('../../ffc-rules-engine')

describe('Rule: Water pollution reduction zone', () => {
  test('Passes when parcel is in a water pollution reduction zone', async () => {
    const parcel = getParcelWithDefaults({ inWaterPollutionZone: true })
    await expectRulesToPass([rules.inWaterPollutionZone], { parcel })
  })

  test('Fails when parcel is not in a water pollution reduction zone', async () => {
    const parcel = getParcelWithDefaults({ inWaterPollutionZone: false })
    await expectRulesToFail(
      [rules.inWaterPollutionZone],
      { parcel },
      {
        name: 'inWaterPollutionZone',
        description: 'Parcel should be in a water pollution zone',
        expandedHint: null,
        inputBounds: {}
      }
    )
  })
})
