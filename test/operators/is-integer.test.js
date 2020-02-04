const isInteger = require('../../operators/is-integer')

describe('Operator: isInteger', () => {
  test('returns true if value is an integer', () => {
    const testCases = [-95, -1, 0, 1, 384]

    for (const testCase of testCases) {
      const result = isInteger(testCase)
      expect(result).toBe(true)
    }
  })

  test('returns false if value is a floating point number', () => {
    const testCases = [-95.9, -1.1, 0.111, 384.87]

    for (const testCase of testCases) {
      const result = isInteger(testCase)
      expect(result).toBe(false)
    }
  })

  test('returns false if value is a string', () => {
    const testCases = [
      'a string value with spaces',
      'another-string'
    ]

    for (const testCase of testCases) {
      const result = isInteger(testCase)
      expect(result).toBe(false)
    }
  })
})
