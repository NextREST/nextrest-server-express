const casual = require('casual')
const sinon = require('sinon')

const { handleRequest } = require('./index.js')

function makeRequestMappingTest ({
  method,
  functionName,
  id,
  responseStatus = 200
}) {
  describe(method, () => {
    const stub = sinon.stub()
    const type = {
      id,
      type: {
        [functionName]: stub
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
      stub.reset()
      stub.resolves({
        name: casual.full_name
      })
    })

    it(`maps to type.${functionName}`, async () => {
      await handleRequest(method, type)

      expect(stub).toHaveProperty('calledOnce', true)
    })

    if (id !== null) {
      it(`passes the entity id as the first parameter to type.${functionName}`, async () => {
        await handleRequest(method, type)

        expect(stub.getCall(0).args[0]).toBe(id)
      })
    }

    it(`passes an object containing the referrer and the context as the ${id === null ? 'first' : 'second'} parameter to type.${functionName}`, async () => {
      const argIndex = id === null ? 0 : 1

      await handleRequest(method, type, context)

      expect(stub.getCall(0).args[argIndex]).toEqual({
        referrer: type.referrer,
        context
      })
    })

    it(`returns an object containing the status ${responseStatus} and the value type.${functionName} resolves to as the body`, async () => {
      const result = await handleRequest(method, type)

      const returnValue = await stub.getCall(0).returnValue
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
