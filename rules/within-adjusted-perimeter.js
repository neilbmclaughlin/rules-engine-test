module.exports = {
  event: {
    type: 'withinAdjustedPerimeter',
    params: {
      description: 'Claimed perimeter should be less than the perimeter adjusted for perimeter features',
      // eslint-disable-next-line no-template-curly-in-string
      hint: 'The claimed perimeter of ${quantity} should be less than the perimeter adjusted for perimeter features of ${adjustedPerimeter}',
      inputBounds: {
        upper: 'adjustedPerimeter'
      }
    }
  },
  conditions: {
    all: [
      {
        fact: 'quantity',
        operator: 'lessThanInclusive',
        value: {
          fact: 'adjustedPerimeter'
        }
      }
    ]
  },
  onFailure: (event, almanac) => { almanac.addRuntimeFact('bounds', { upper: 100, lower: 1 }) }
}
