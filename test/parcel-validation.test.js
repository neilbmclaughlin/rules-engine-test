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
        'areaFeatures',
        'hasReintroducedGrazing',
        'inWaterPollutionZone',
        'landCoverClass',
        'perimeterFeatures',
        'previousActions',
        'ref',
        'sssi',
        'totalArea',
        'totalPerimeter'
      ]
      const missingProperties = VError.info(err).errors.map((e) => e.argument)
      expect(missingProperties.sort()).toEqual(exepectedMissingProperties.sort())
    }
  })
  test('Should not throw for valid parcel', async () => {
    const parcel = {
      areaFeatures: [
        {
          type: 'pond',
          areaCovered: 0.3
        }
      ],
      hasReintroducedGrazing: false,
      inWaterPollutionZone: false,
      landCoverClass: 0,
      perimeterFeatures: [
        {
          type: 'barn',
          length: 23.3
        },
        {
          type: 'hedgerow',
          length: 162.6
        }
      ],
      previousActions: [],
      ref: 'SD74445738',
      sssi: false,
      totalArea: 0.656,
      totalPerimeter: 325.2
    }
    expect(() => parcelValidation(parcel)).not.toThrow()
  })
})
