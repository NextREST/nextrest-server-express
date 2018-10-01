const casual = require('casual')

jest.mock('./handleQueryRequest')

const handleRequest = require('./index.js')
const handleQueryRequest = require('./handleQueryRequest')

function makeRequestMappingTest ({
  functionName,
  id,
  method,
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

    const data = {
      [casual.word]: casual.word
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
      await handleRequest(method, null, type)

      expect(requestHandler).toHaveBeenCalledTimes(1)
    })

    if (id !== null) {
      it(`passes the entity id as the first parameter to type.${functionName}`, async () => {
        await handleRequest(method, data, type)

        expect(requestHandler.mock.calls[0][0]).toBe(id)
      })
    }

    it(`passes the request data as the ${id === null ? 'first' : 'second'} parameter to type.${functionName}`, async () => {
      const argIndex = id === null ? 0 : 1

      await handleRequest(method, data, type, context)

      expect(requestHandler.mock.calls[0][argIndex]).toEqual(data)
    })

    it(`passes an object containing the referrer and the context as the ${id === null ? 'second' : 'third'} parameter to type.${functionName}`, async () => {
      const argIndex = id === null ? 1 : 2

      await handleRequest(method, data, type, context)

      expect(requestHandler.mock.calls[0][argIndex]).toEqual({
        referrer: type.referrer,
        context
      })
    })

    it(`returns an object containing the status ${responseStatus} and the value type.${functionName} resolves to as the body`, async () => {
      const result = await handleRequest(method, data, type)

      const returnValue = await requestHandler.mock.results[0].value
      expect(result).toEqual({
        status: responseStatus,
        body: returnValue
      })
    })
  })
}

describe('handleRequest()', () => {
  beforeEach(() => {
    handleQueryRequest.mockReset()
  })

  it('returns the status 404 if there\'s no function to handle the request', async () => {
    const result = await handleRequest('GET', null, {
      id: casual.uuid,
      type: {
        create: () => null
      }
    })

    expect(result).toEqual({
      status: 404
    })
  })

  it('returns the status 405 and an adequate Allow header if there is a function for the current scope but it is not using the requested method', async () => {
    const result = await handleRequest('GET', null, {
      type: {
        delete: () => null
      }
    })

    expect(result).toEqual({
      status: 405,
      headers: {
        Allow: 'DELETE'
      }
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

  it('calls handleQueryRequest() with the given endpoint and returns its result if a query is given', async () => {
    const method = casual.http_method
    const endpoint = {
      query: casual.word
    }
    const context = {
      userId: casual.uuid
    }
    const data = {
      [casual.word]: casual.word
    }

    handleQueryRequest.mockResolvedValue({
      name: casual.username
    })
    const res = await handleRequest(
      method,
      data,
      endpoint,
      context
    )

    expect(handleQueryRequest).toHaveBeenCalledTimes(1)

    const args = handleQueryRequest.mock.calls[0]
    expect(args).toHaveProperty('length', 4)
    expect(args[0]).toBe(method)
    expect(args[1]).toBe(data)
    expect(args[2]).toBe(endpoint)
    expect(args[3]).toBe(context)

    expect(res).toBe(
      await handleQueryRequest.mock.results[0].value
    )
  })
})
