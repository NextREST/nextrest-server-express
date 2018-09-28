const casual = require('casual')

const handleRequest = require('./index.js')

function makeRequestMappingTest ({
  method,
  functionName,
  id,
  responseStatus = 200
}) {
  describe(method, () => {
    const requestHandler = jest.fn()
    const type = {
      id,
      type: {
        [functionName]: requestHandler
      },
      referrer: {
        id: casual.uuid,
        type: casual.word,
        referrer: null
      }
    }
    const context = {
      userId: casual.uuid
    }

    beforeEach(() => {
      requestHandler.mockReset()
      requestHandler.mockResolvedValue({
        name: casual.full_name
      })
    })

    it(`maps to type.${functionName}`, async () => {
      await handleRequest(method, type)

      expect(requestHandler).toHaveBeenCalledTimes(1)
    })

    if (id !== null) {
      it(`passes the entity id as the first parameter to type.${functionName}`, async () => {
        await handleRequest(method, type)

        expect(requestHandler.mock.calls[0][0]).toBe(id)
      })
    }

    it(`passes an object containing the referrer and the context as the ${id === null ? 'first' : 'second'} parameter to type.${functionName}`, async () => {
      const argIndex = id === null ? 0 : 1

      await handleRequest(method, type, context)

      expect(requestHandler.mock.calls[0][argIndex]).toEqual({
        referrer: type.referrer,
        context
      })
    })

    it(`returns an object containing the status ${responseStatus} and the value type.${functionName} resolves to as the body`, async () => {
      const result = await handleRequest(method, type)

      const returnValue = await requestHandler.mock.results[0].value
      expect(result).toEqual({
        status: responseStatus,
        body: returnValue
      })
    })
  })
}

describe('handleRequest()', () => {
  it('returns { status: 404 } if there\'s no function to handle the request', async () => {
    const result = await handleRequest('GET', {
      id: casual.uuid,
      type: {
        create: () => null
      }
    })

    expect(result).toEqual({
      status: 404
    })
  })

  it('returns { status: 405 } if there is a function for the current scope but it is not using the requested method', async () => {
    const result = await handleRequest('GET', {
      type: {
        delete: () => null
      }
    })

    expect(result).toEqual({
      status: 405
    })
  })

  describe('type', () => {
    makeRequestMappingTest({
      method: 'GET',
      functionName: 'list',
      id: null
    })

    makeRequestMappingTest({
      method: 'POST',
      functionName: 'create',
      id: null,
      responseStatus: 201
    })
  })

  describe('entity', () => {
    makeRequestMappingTest({
      method: 'GET',
      functionName: 'get',
      id: casual.uuid
    })

    makeRequestMappingTest({
      method: 'PATCH',
      functionName: 'edit',
      id: casual.uuid
    })

    makeRequestMappingTest({
      method: 'DELETE',
      functionName: 'delete',
      id: casual.uuid
    })
  })
})
