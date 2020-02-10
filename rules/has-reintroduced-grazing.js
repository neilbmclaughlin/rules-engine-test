module.exports = {
  event: {
    type: 'hasReintroducedGrazing',
    params: {
      description: 'Grazing has been reintroduced for the parcel'
    }
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
