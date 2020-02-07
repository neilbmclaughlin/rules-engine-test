module.exports = {
  event: {
    type: 'withinArea',
    params: {
      description: 'Claimed area should be less than the total area',
      // eslint-disable-next-line no-template-curly-in-string
      hint: 'The claimed area of ${quantity} should be within the range (${areaBounds.lower} to ${areaBounds.upper})',
      inputBounds: 'areaBounds'
    }
  },
  conditions: {
    all: [
      {
        fact: 'quantity',
        operator: 'lessThanInclusive',
        value: {
          fact: 'areaBounds',
          path: '$.upper'
        }
      },
      {
        fact: 'quantity',
        operator: 'greaterThanInclusive',
        value: {
          fact: 'areaBounds',
          path: '$.lower'
        }
      }
    ]
  }
}
