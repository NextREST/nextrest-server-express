module.exports = function registerType (types, type) {
  const { resourceName: name, ...typeWithoutName } = type

  return {
    ...types,
    [name]: typeWithoutName
  }
}
