module.exports = {
  event: {
    type: 'withinPerimeter',
    params: {
      description: 'Claimed perimeter should be less than the total perimeter',
      // eslint-disable-next-line no-template-curly-in-string
      hint: 'The claimed perimeter of ${quantity} should be within the range (${perimeterBounds.lower} to ${perimeterBounds.upper})',
      inputBounds: 'perimeterBounds'
    }
  },
  conditions: {
    all: [
      {
        fact: 'quantity',
        operator: 'lessThanInclusive',
        value: {
          fact: 'perimeterBounds',
          path: '$.upper'
        }
      }
    ]
  }
}
