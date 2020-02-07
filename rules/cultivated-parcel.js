module.exports = {
  event: {
    type: 'cultivated',
    params: {
      description: 'Parcel should be a cultivated parcel'
    }
  },
  conditions: {
    all: [
      {
        fact: 'parcel',
        path: '$.landCoverClass',
        operator: 'in',
        value: [
          110,
          670
        ]
      }
    ]
  }
}
