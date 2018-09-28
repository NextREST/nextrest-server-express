const casual = require('casual')
const findType = require('./index.js')

describe('findType()', () => {
  it('can find root types', () => {
    const resourceName = casual.word
    const types = {
      [resourceName]: {
        get: () => null
      }
    }

    const { type, id, referrer } = findType(types, `/${resourceName}`)

    expect(type).toBe(types[resourceName])
    expect(id).toEqual(null)
    expect(referrer).toEqual(null)
  })

  it('returns type: false if it found no matching type', () => {
    const { type, id, referrer } = findType({}, `/${casual.word}/${casual.uuid}`)

    expect(type).toBe(false)
    expect(id).toEqual(null)
    expect(referrer).toEqual(null)
  })

  it('returns the id if a specific entity was requested', () => {
    const resourceName = casual.word
    const types = {
      [resourceName]: {
        get: () => null
      }
    }

    const entityId = casual.uuid
    const { type, id, referrer } = findType(types, `/${resourceName}/${entityId}`)

    expect(type).toBe(types[resourceName])
    expect(id).toBe(entityId)
    expect(referrer).toEqual(null)
  })

  it('properly handles nested routes', () => {
    const resourceNames = [
      casual.word,
      casual.word,
      casual.word
    ]

    const types = {
      [resourceNames[0]]: {
        outboundFields: {
          [resourceNames[1]]: {
            outboundFields: {
              [resourceNames[2]]: {
                get: () => null
              }
            }
          }
        }
      }
    }

    const ids = [
      casual.uuid,
      casual.uuid,
      casual.uuid
    ]
    const { type, id, referrer } = findType(
      types,
      `/${resourceNames[0]}/${ids[0]}/${resourceNames[1]}/${ids[1]}/${resourceNames[2]}/${ids[2]}`
    )

    expect(type).toBe(
      types[resourceNames[0]]
        .outboundFields[resourceNames[1]]
        .outboundFields[resourceNames[2]]
    )

    expect(id).toBe(ids[2])

    expect(referrer).toEqual({
      id: ids[1],
      type: resourceNames[1],
      referrer: {
        id: ids[0],
        type: resourceNames[0],
        referrer: null
      }
    })
  })
})
