module.exports = (parcel) => {
  return async function getAdjustedPerimeter (params, almanac) {
    const featurePerimeterLength = parcel.perimeterFeatures.length > 0
      ? (parcel.perimeterFeatures.map((f) => f.perimeter).reduce((total, p) => total + p))
      : 0
    return parcel.perimeter - featurePerimeterLength
  }
}
