module.exports = {
  event: {
    type: 'withinPerimeter'
  },
  conditions: {
    all: [
      {
        fact: 'parcel',
        path: '$.totalPerimeter',
        operator: 'greaterThanInclusive',
        value: {
          fact: 'quantity'
        }
      }
    ]
  }
}
