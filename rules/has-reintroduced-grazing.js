module.exports = {
  event: {
    type: 'hasReintroducedGrazing'
  },
  conditions: {
    all: [
      {
        fact: 'parcel',
        path: '$.hasReintroducedGrazing',
        operator: 'equal',
        value: true
      }
    ]
  }
}
