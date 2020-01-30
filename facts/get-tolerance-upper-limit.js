module.exports = async function getToleranceUpperLimit (params, almanac) {
  const parcel = await almanac.factValue('parcel')
  const tolerance = await almanac.factValue('tolerance')
  return parcel.totalPerimeter + tolerance
}
