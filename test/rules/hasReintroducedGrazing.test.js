const {
  getParcelWithDefaults,
  expectRulesToPass,
  expectRulesToFail
} = require('../helper')
const { rules } = require('../../ffc-rules-engine')

describe('Rule: Has reintroduced grazing', () => {
  test('Passes when parcel has reintroduced grazing', async () => {
    const parcel = getParcelWithDefaults({ hasReintroducedGrazing: true })
    await expectRulesToPass([rules.hasReintroducedGrazing], { parcel })
  })
  test('Fails when parcel has not reintroduced grazing', async () => {
    const parcel = getParcelWithDefaults({ hasReintroducedGrazing: false })
    await expectRulesToFail(
      [rules.hasReintroducedGrazing],
      { parcel },
      {
        name: 'hasReintroducedGrazing',
        description: 'Grazing has been reintroduced for the parcel',
        expandedHint: null,
        inputBounds: {}
      }
    )
  })
})
