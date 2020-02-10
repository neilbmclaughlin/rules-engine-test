module.exports = {
  event: {
    type: 'withinPondlessArea',
    params: {
      description: 'Claimed area should be less than the area adjusted for ponds',
      // eslint-disable-next-line no-template-curly-in-string
      hint: 'The claimed area of ${quantity} should be within the range adjusted for ponds (${pondlessAreaBounds.lower} to ${pondlessAreaBounds.upper})',
      inputBounds: 'pondlessAreaBounds'
    }
  },
  conditions: {
    all: [
      {
        fact: 'quantity',
        operator: 'lessThanInclusive',
        value: {
          fact: 'pondlessAreaBounds',
          path: '$.upper'
        }
      },
      {
        fact: 'quantity',
        operator: 'greaterThanInclusive',
        value: {
          fact: 'pondlessAreaBounds',
          path: '$.lower'
        }
      }
    ]
  }
}
