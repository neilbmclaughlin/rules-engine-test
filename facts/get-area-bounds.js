module.exports = async (params, almanac) => {
  const parcel = await almanac.factValue('parcel')

  return {
    lower: 0,
    upper: parcel.totalArea
  }
}
