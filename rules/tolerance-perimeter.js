module.exports = {
  event: {
    type: 'withinTolerancePerimeter',
    params: {
      description: 'Perimeter should be within tolerance'
    }
  },
  conditions: {
    all: [
      {
        fact: 'toleranceUpperLimit',
        operator: 'greaterThanInclusive',
        value: {
          fact: 'quantity'
        }
      }
    ]
  }
}
