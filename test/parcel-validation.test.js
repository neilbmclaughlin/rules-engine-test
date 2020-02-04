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
        'ref',
        'totalPerimeter',
        'perimeterFeatures',
        'totalArea',
        'areaFeatures',
        'previousActions',
        'sssi',
        'landCoverClass',
        'inWaterPollutionZone'
      ]
      const missingProperties = VError.info(err).errors.map((e) => e.argument)
      expect(missingProperties.sort()).toEqual(exepectedMissingProperties.sort())
    }
  })
  test('Should not throw for valid parcel', async () => {
    const parcel = {
      ref: 'SD74445738',
      totalPerimeter: 325.2,
      totalArea: 0.656,
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
      areaFeatures: [
        {
          type: 'pond',
          areaCovered: 0.3
        }
      ],
      previousActions: [],
      sssi: false,
      landCoverClass: 0,
      inWaterPollutionZone: false
    }
    expect(() => parcelValidation(parcel)).not.toThrow()
  })
})
