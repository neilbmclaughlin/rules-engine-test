module.exports = async function getAdjustedArea (params, almanac) {
  const parcel = await almanac.factValue('parcel')

  const featureArea = parcel.areaFeatures
    .map(feature => feature.areaCovered)
    .reduce((total, p) => total + p, 0)

  return parcel.totalArea - featureArea
}
