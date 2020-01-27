const moment = require('moment')

module.exports = async function getYearsSinceLastAction (params, almanac) {
  const referenceDate = await almanac.factValue('referenceDate')
  const parcel = await almanac.factValue('parcel')
  const actionId = await almanac.factValue('actionId')
  if (parcel.previousActions.filter((pa) => pa.identifier === actionId).length > 0) {
    const dateOfLastAction = moment.max(parcel.previousActions.map((pa) => moment(pa.date, 'YYYY-MM-DD')))
    return referenceDate.diff(dateOfLastAction, 'years', true)
  }
  return null
}
