module.exports = async (params, almanac) => {
  const parcel = await almanac.factValue('parcel')
  return {
    lower: 0, // this would probably be populated from a calculation or fact
    upper: parcel.totalPerimeter
  }
}
