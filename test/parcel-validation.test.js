const VError = require('verror')
const parcelValidation = require('../parcel-validation')

describe('RuleEngine handles bad parcel schemas', () => {
  test('Throws an exception for missing properties', async () => {
    const parcel = {}
    expect.assertions(2)
    try {
      parcelValidation(parcel)
    } catch (err) {
      expect(err.name).toBe('ParcelSchemaValidationError')
      const exepectedMissingProperties = [
        'parcelRef',
        'perimeter',
        'perimeterFeatures',
        'previousActions',
        'sssi'
      ]
      const missingProperties = VError.info(err).errors.map((e) => e.argument)
      expect(missingProperties.sort()).toEqual(exepectedMissingProperties)
    }
  })
})
