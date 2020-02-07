module.exports = {
  event: {
    type: 'noActionsInTimePeriod',
    params: {
      description: 'Parcel should not have had any recent previous actions of this type',
      // eslint-disable-next-line no-template-curly-in-string
      hint: 'Parcel rejected because there was an action of type ${actionId} in the last ${actionYearsThreshold} years'
    }
  },
  conditions: {
    any: [
      {
        fact: 'yearsSinceLastAction',
        operator: 'greaterThan',
        value: {
          fact: 'actionYearsThreshold'
        }
      },
      {
        fact: 'yearsSinceLastAction',
        operator: 'equal',
        value: null
      }
    ]
  }
}
