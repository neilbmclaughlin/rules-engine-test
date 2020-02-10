var { validate } = require('jsonschema')
const parcelSchema = require('./schemas/parcel.json')
const VError = require('verror')

function validateParcel (parcel) {
  const validationResult = validate(parcel, parcelSchema)

  if (!validationResult.valid) {
    const options = {
      name: 'ParcelSchemaValidationError',
      info: {
        errors: validationResult.errors
      }
    }
    throw new VError(options, 'Parcel schema validation error')
  }
}

module.exports = validateParcel
