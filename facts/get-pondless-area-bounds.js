module.exports = async function getAdjustedArea (params, almanac) {
  const parcel = await almanac.factValue('parcel')

  const featureArea = parcel.areaFeatures
    .filter(feature => feature.type === 'pond')
    .map(feature => feature.areaCovered)
    .reduce((total, p) => total + p, 0)

  return {
    lower: 0,
    upper: parcel.totalArea - featureArea
  }
}
