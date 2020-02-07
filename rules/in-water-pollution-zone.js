module.exports = {
  event: {
    type: 'inWaterPollutionZone'
  },
  conditions: {
    all: [
      {
        fact: 'parcel',
        path: '$.inWaterPollutionZone',
        operator: 'equal',
        value: true
      }
    ]
  }
}
