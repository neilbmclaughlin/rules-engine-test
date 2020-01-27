module.exports = (parcel) => {
  return async function getToleranceUpperLimit (params, almanac) {
    const tolerance = await almanac.factValue('tolerance')
    return parcel.perimeter + tolerance
  }
}
