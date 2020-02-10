module.exports = async function getAdjustedPerimeter (params, almanac) {
  const parcel = await almanac.factValue('parcel')
  const featurePerimeterLength = parcel.perimeterFeatures.length > 0
    ? (parcel.perimeterFeatures.map((f) => f.length).reduce((total, p) => total + p))
    : 0
  return {
    lower: 0, // this would probably be populated from a calculation or fact
    upper: parcel.totalPerimeter - featurePerimeterLength
  }
}
