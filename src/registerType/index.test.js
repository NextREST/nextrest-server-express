const casual = require('casual')

const { registerType } = require('./index.js')

describe('registerType()', () => {
  let type
  let types

  beforeEach(() => {
    type = {
      resourceName: casual.word,
      get: () => null
    }
    types = {}
  })

  it('does not mutate the types object', () => {
    const newTypes = registerType(types, type)

    expect(newTypes).not.toBe(types)
  })

  it('adds a key named after the types resourceName to the given object', () => {
    const newTypes = registerType(types, type)

    const { resourceName, ...addedType } = type
    expect(newTypes).toEqual({
      ...types,
      [type.resourceName]: addedType
    })
  })
})
