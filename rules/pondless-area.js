module.exports = {
  event: {
    type: 'withinPondlessArea',
    params: {
      description: 'Claimed area should be less than the area adjusted for area features',
      // eslint-disable-next-line no-template-curly-in-string
      hint: 'The claimed area of ${quantity} should be within the range adjusted for area features (${adjustedAreaBounds.lower} to ${adjustedAreaBounds.upper})',
      inputBounds: 'adjustedAreaBounds'
    }
  },
  conditions: {
    all: [
      {
        fact: 'quantity',
        operator: 'lessThanInclusive',
        value: {
          fact: 'adjustedAreaBounds',
          path: '$.upper'
        }
      },
      {
        fact: 'quantity',
        operator: 'greaterThanInclusive',
        value: {
          fact: 'adjustedAreaBounds',
          path: '$.lower'
        }
      }
    ]
  }
}
