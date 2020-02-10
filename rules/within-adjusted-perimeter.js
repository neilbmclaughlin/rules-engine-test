module.exports = {
  event: {
    type: 'withinAdjustedPerimeter',
    params: {
      description: 'Claimed perimeter should be less than the perimeter adjusted for perimeter features',
      // eslint-disable-next-line no-template-curly-in-string
      hint: 'The claimed perimeter of ${quantity} should be within the range adjusted for perimeter features (${adjustedPerimeterBounds.lower} to ${adjustedPerimeterBounds.upper})',
      inputBounds: 'adjustedPerimeterBounds'
    }
  },
  conditions: {
    all: [
      {
        fact: 'quantity',
        operator: 'lessThanInclusive',
        value: {
          fact: 'adjustedPerimeterBounds',
          path: '$.upper'
        }
      },
      {
        fact: 'quantity',
        operator: 'greaterThan',
        value: {
          fact: 'adjustedPerimeterBounds',
          path: '$.lower'
        }
      }
    ]
  }
}
