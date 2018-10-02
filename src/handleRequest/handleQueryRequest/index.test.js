const casual = require('casual')

jest.mock('./handleOutboundField')
jest.mock('./handleAction')

const handleQueryRequest = require('./index.js')

const handleOutboundField = require('./handleOutboundField')
const handleAction = require('./handleAction')

describe('handleQueryRequest()', () => {
  it('returns status 404 if the query is invalid', async () => {
    const result = await handleQueryRequest(
      casual.http_method,
      null,
      {
        id: casual.uuid,
        type: {
          get: () => null
        },
        query: casual.word,
        referrer: null
      }
    )

    expect(result).toEqual({
      status: 404
    })
  })

  describe('actions', () => {
    beforeEach(() => {
      handleAction.mockReset()
      handleAction.mockResolvedValue({
        status: 200,
        body: {
          username: casual.username
        }
      })
    })

    it('calls handleAction() with the /actions part cut off the query, the query as an array and returns its result', async () => {
      const actionName = casual.word
      const method = casual.http_method
      const context = {
        userId: casual.uuid
      }
      const data = {
        phoneNumber: casual.phone
      }

      const actionHandler = jest.fn()
        .mockResolvedValue({
          name: casual.name
        })

      const endpoint = {
        id: casual.uuid,
        query: `actions/${actionName}/${casual.word}`,
        type: {
          actions: {
            [actionName]: {
              invoke: actionHandler,
              method,
              description: casual.text
            }
          }
        },
        referrer: {
          id: casual.uuid,
          type: casual.word,
          referrer: null
        }
      }

      const result = await handleQueryRequest(
        method,
        data,
        endpoint,
        context
      )

      expect(handleAction).toHaveBeenCalledTimes(1)
      const args = handleAction.mock.calls[0]
      expect(args).toHaveProperty('length', 4)
      expect(args[0]).toBe(method)
      expect(args[1]).toBe(data)
      expect(args[2]).toEqual({
        ...endpoint,
        query: endpoint.query.split('/').slice(1)
      })
      expect(args[3]).toBe(context)

      expect(result).toBe(
        await handleAction.mock.results[0].value
      )
    })
  })

  describe('outbound fields', () => {
    beforeEach(() => {
      handleOutboundField.mockReset()
      handleOutboundField.mockResolvedValue({
        status: 200,
        body: {
          username: casual.username
        }
      })
    })

    it('calls handleOutboundField() with the /fields part cut off the query, the query as an array and returns its result', async () => {
      const actionName = casual.word
      const method = casual.http_method
      const context = {
        userId: casual.uuid
      }

      const actionHandler = jest.fn()
        .mockResolvedValue({
          name: casual.name
        })

      const endpoint = {
        id: casual.uuid,
        query: `fields/${actionName}/${casual.word}`,
        type: {
          actions: {
            [actionName]: {
              invoke: actionHandler,
              method,
              description: casual.text
            }
          }
        },
        referrer: {
          id: casual.uuid,
          type: casual.word,
          referrer: null
        }
      }

      const result = await handleQueryRequest(
        method,
        null,
        endpoint,
        context
      )

      expect(handleOutboundField).toHaveBeenCalledTimes(1)
      const args = handleOutboundField.mock.calls[0]
      expect(args).toHaveProperty('length', 3)
      expect(args[0]).toBe(method)
      expect(args[1]).toEqual({
        ...endpoint,
        query: endpoint.query.split('/').slice(1)
      })
      expect(args[2]).toBe(context)

      expect(result).toBe(
        await handleOutboundField.mock.results[0].value
      )
    })
  })
})
