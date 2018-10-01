const casual = require('casual')

jest.mock('../makeActionsDescriptor')

const handleQueryRequest = require('./index.js')

const makeActionsDescriptor = require('../makeActionsDescriptor')

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
      makeActionsDescriptor.mockReset()
      makeActionsDescriptor.mockReturnValue({
        [casual.word]: {
          description: casual.url
        }
      })
    })

    describe('/actions', () => {
      it('returns the result of makeActionsDescriptor() as the response body and a status of 200 with GET', async () => {
        const actions = {
          [casual.word]: {
            invoke: () => null,
            description: casual.text
          }
        }

        const result = await handleQueryRequest(
          'GET',
          null,
          {
            type: {
              actions
            },
            query: 'actions'
          }
        )

        expect(makeActionsDescriptor).toHaveBeenCalledTimes(1)
        const args = makeActionsDescriptor.mock.calls[0]
        expect(args).toHaveProperty('length', 1)
        expect(args[0]).toBe(actions)

        expect(result.status).toBe(200)
        expect(result.body).toBe(
          makeActionsDescriptor.mock.results[0].value
        )
      })

      it('returns a status of 405 and an Allow: \'GET\' header when requested with a method other than GET', async () => {
        const actions = {
          [casual.word]: {
            invoke: () => null,
            description: casual.text
          }
        }

        const method = global.generateRandomWithBlacklist(
          () => casual.http_method,
          'GET'
        )

        const result = await handleQueryRequest(
          method,
          null,
          {
            type: {
              actions
            },
            query: 'actions'
          }
        )

        expect(makeActionsDescriptor).toHaveBeenCalledTimes(0)
        expect(result).toEqual({
          status: 405,
          headers: {
            Allow: 'GET'
          }
        })
      })

      it('returns a status of 404 if calling a non-existent sub-resource of an action', async () => {
        const actionName = casual.word
        const method = casual.http_method
        const context = {
          userId: casual.uuid
        }
        const data = {
          name: casual.name
        }

        const actionHandler = jest.fn()
          .mockResolvedValue({
            name: casual.name
          })

        const subResource = global.generateRandomWithBlacklist(
          () => casual.word,
          [ 'invoke' ]
        )

        const endpoint = {
          id: casual.uuid,
          query: `actions/${actionName}/${subResource}`,
          type: {
            actions: {
              [actionName]: {
                invoke: actionHandler,
                method
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

        expect(actionHandler).toHaveBeenCalledTimes(0)

        expect(result).toEqual({
          status: 404
        })
      })
    })

    describe('/actions/[actionName]/invoke', () => {
      it('invokes the action if called with the right method and defaults the response status to 200', async () => {
        const actionName = casual.word
        const method = casual.http_method
        const context = {
          userId: casual.uuid
        }
        const data = {
          name: casual.name
        }

        const actionHandler = jest.fn()
          .mockResolvedValue({
            name: casual.name
          })

        const endpoint = {
          id: casual.uuid,
          query: `actions/${actionName}/invoke`,
          type: {
            actions: {
              [actionName]: {
                invoke: actionHandler,
                method
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

        expect(actionHandler).toHaveBeenCalledTimes(1)
        const args = actionHandler.mock.calls[0]
        expect(args).toHaveProperty('length', 3)
        expect(args[0]).toBe(endpoint.id)
        expect(args[1]).toBe(data)
        expect(args[2]).toEqual({
          context,
          referrer: endpoint.referrer
        })

        expect(result.body).toBe(
          await actionHandler.mock.results[0].value
        )
        expect(result.status).toBe(200)
      })

      it('sets the response status to action.successStatus when given', async () => {
        const actionName = casual.word
        const method = casual.http_method
        const successStatus = casual.integer(201, 210)

        const endpoint = {
          id: casual.uuid,
          query: `actions/${actionName}/invoke`,
          type: {
            actions: {
              [actionName]: {
                invoke: () => null,
                method,
                successStatus
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
          endpoint
        )

        expect(result.status).toBe(successStatus)
      })

      it('doesn\'t invoke the action and set the status to 405 if called with a wrong method', async () => {
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
          query: `actions/${actionName}/invoke`,
          type: {
            actions: {
              [actionName]: {
                invoke: actionHandler,
                method
              }
            }
          },
          referrer: {
            id: casual.uuid,
            type: casual.word,
            referrer: null
          }
        }

        const actualMethod = global.generateRandomWithBlacklist(
          () => casual.http_method,
          method
        )

        const result = await handleQueryRequest(
          actualMethod,
          null,
          endpoint,
          context
        )

        expect(actionHandler).toHaveBeenCalledTimes(0)
        expect(result).toEqual({
          status: 405,
          headers: {
            Allow: method
          }
        })
      })

      it('returns a status of 404 if the requested action does not exist', async () => {
        const actionName = casual.word
        const method = casual.http_method

        const endpoint = {
          id: casual.uuid,
          query: `actions/${actionName}/invoke`,
          type: {},
          referrer: {
            id: casual.uuid,
            type: casual.word,
            referrer: null
          }
        }

        const result = await handleQueryRequest(
          method,
          null,
          endpoint
        )

        expect(result).toEqual({
          status: 404
        })
      })
    })
  })

  describe('outbound fields', () => {
    it('returns a status of 404 if there\'s no field name provided', async () => {
      const endpoint = {
        id: casual.uuid,
        query: 'fields',
        type: {
          outboundFields: {
            [casual.word]: () => null
          }
        }
      }

      const result = await handleQueryRequest(
        'GET',
        null,
        endpoint
      )

      expect(result).toEqual({
        status: 404
      })
    })

    it('returns a status of 404 if there\'s a field sub-resource selected (e.g. /fields/status/sub-resource)', async () => {
      const endpoint = {
        id: casual.uuid,
        query: `fields/${casual.word}/${casual.word}`,
        type: {
          outboundFields: {
            [casual.word]: () => null
          }
        }
      }

      const result = await handleQueryRequest(
        'GET',
        null,
        endpoint
      )

      expect(result).toEqual({
        status: 404
      })
    })

    describe('/fields/[fieldName]', () => {
      describe('if the field exists', () => {
        it('calls type.outboundFields[fieldName] and returns its result as the response body with a status of 200 when using GET', async () => {
          const fieldName = casual.word
          const requestHandler = jest.fn()
            .mockResolvedValue({
              name: casual.name
            })

          const endpoint = {
            id: casual.uuid,
            query: `fields/${fieldName}`,
            type: {
              outboundFields: {
                [fieldName]: requestHandler
              }
            },
            referrer: {
              id: casual.uui,
              type: casual.word,
              referrer: null
            }
          }

          const context = {
            userId: casual.uui
          }

          const result = await handleQueryRequest(
            'GET',
            null,
            endpoint,
            context
          )

          expect(requestHandler).toHaveBeenCalledTimes(1)

          expect(result).toEqual({
            status: 200,
            body: await requestHandler.mock.results[0].value
          })

          const args = requestHandler.mock.calls[0]
          expect(args).toHaveProperty('length', 2)
          expect(args[0]).toBe(endpoint.id)
          expect(args[1]).toEqual({
            context,
            referrer: endpoint.referrer
          })
        })

        it('returns a status of 405 and the header Allow: \'GET\' if called with a method other than GET', async () => {
          const fieldName = casual.word
          const requestHandler = jest.fn()
            .mockResolvedValue({
              name: casual.name
            })

          const endpoint = {
            id: casual.uuid,
            query: `fields/${fieldName}`,
            type: {
              outboundFields: {
                [fieldName]: requestHandler
              }
            },
            referrer: {
              id: casual.uui,
              type: casual.word,
              referrer: null
            }
          }

          const method = global.generateRandomWithBlacklist(
            () => casual.http_method,
            'GET'
          )

          const result = await handleQueryRequest(
            method,
            null,
            endpoint
          )

          expect(requestHandler).toHaveBeenCalledTimes(0)
          expect(result).toEqual({
            status: 405,
            headers: {
              Allow: 'GET'
            }
          })
        })
      })

      describe('if the field does not exist', () => {
        it('returns a status of 404 when using GET', async () => {
          const endpoint = {
            id: casual.uuid,
            query: `fields/${casual.word}`,
            type: {},
            referrer: {
              id: casual.uui,
              type: casual.word,
              referrer: null
            }
          }

          const result = await handleQueryRequest(
            'GET',
            null,
            endpoint
          )

          expect(result).toEqual({
            status: 404
          })
        })

        it('returns a status of 404 when using a method other than GET', async () => {
          const endpoint = {
            id: casual.uuid,
            query: `fields/${casual.word}`,
            type: {},
            referrer: {
              id: casual.uui,
              type: casual.word,
              referrer: null
            }
          }

          const method = global.generateRandomWithBlacklist(
            () => casual.http_method,
            'GET'
          )

          const result = await handleQueryRequest(
            method,
            null,
            endpoint
          )

          expect(result).toEqual({
            status: 404
          })
        })
      })
    })
  })
})
