module.exports = {
  event: {
    type: 'inWaterPollutionZone',
    params: {
      description: 'Parcel should be in a water pollution zone'
    }
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
