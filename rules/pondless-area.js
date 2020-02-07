module.exports = {
  event: {
    type: 'withinPondlessArea'
  },
  conditions: {
    all: [
      {
        fact: 'pondlessArea',
        operator: 'greaterThanInclusive',
        value: {
          fact: 'quantity'
        }
      }
    ]
  }
}
