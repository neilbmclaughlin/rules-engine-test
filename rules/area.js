module.exports = {
  event: {
    type: 'withinArea'
  },
  conditions: {
    all: [
      {
        fact: 'parcel',
        path: '$.totalArea',
        operator: 'greaterThanInclusive',
        value: {
          fact: 'quantity'
        }
      }
    ]
  }
}
