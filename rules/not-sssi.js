module.exports = {
  event: {
    type: 'notSSSI',
    params: {
      description: 'Parcel should not be in an SSSI'
    }
  },
  conditions: {
    all: [
      {
        fact: 'parcel',
        path: '$.sssi',
        operator: 'equal',
        value: false
      }
    ]
  }
}
