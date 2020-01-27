module.exports = () => {
  return async function getToleranceUpperLimit (params, almanac) {
    const parcel = await almanac.factValue('parcel')
    const tolerance = await almanac.factValue('tolerance')
    return parcel.perimeter + tolerance
  }
}
