const casual = require('casual')

jest.mock('../../makeActionsDescriptor')

const handleAction = require('./index.js')

const makeActionsDescriptor = require('../../makeActionsDescriptor')

describe('handleAction()', () => {
  beforeEach(() => {
    makeActionsDescriptor.mockReset()
    makeActionsDescriptor.mockReturnValue({
      [casual.word]: {
        description: casual.url
      }
    })
  })

  it('returns the result of makeActionsDescriptor() as the response body and a status of 200 using GET', async () => {
    const actions = {
      [casual.word]: {
        invoke: () => null,
        description: casual.text
      }
    }

    const result = await handleAction(
      'GET',
      null,
      {
        type: {
          actions
        },
        query: []
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

    const result = await handleAction(
      method,
      null,
      {
        type: {
          actions
        },
        query: []
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

  it('returns a status of 404 with more than 2 query elements', async () => {
    const actionName = casual.word
    const method = casual.http_method

    const endpoint = {
      id: casual.uuid,
      query: [ actionName, 'invoke', casual.word ],
      type: {
        actions: {
          [actionName]: {
            invoke: () => null
          }
        }
      },
      referrer: {
        id: casual.uuid,
        type: casual.word,
        referrer: null
      }
    }

    const result = await handleAction(
      method,
      null,
      endpoint
    )

    expect(result).toEqual({
      status: 404
    })
  })

  describe('[actionName]', () => {
    describe('invoke', () => {
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
          query: [ actionName, 'invoke' ],
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

        const result = await handleAction(
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
          query: [ actionName, 'invoke' ],
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

        const result = await handleAction(
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
          query: [ actionName, 'invoke' ],
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

        const result = await handleAction(
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
          query: [ actionName, 'invoke' ],
          type: {},
          referrer: {
            id: casual.uuid,
            type: casual.word,
            referrer: null
          }
        }

        const result = await handleAction(
          method,
          null,
          endpoint
        )

        expect(result).toEqual({
          status: 404
        })
      })
    })

    describe('description', () => {
      it('returns the requested actions\' description and a status of 200 if the action exists and the method is GET', async () => {
        const actionName = casual.word
        const description = casual.text
        const endpoint = {
          id: casual.uuid,
          query: [ actionName, 'description' ],
          type: {
            actions: {
              [actionName]: {
                description
              }
            }
          },
          referrer: {
            id: casual.uuid,
            type: casual.word,
            referrer: null
          }
        }

        const result = await handleAction(
          'GET',
          null,
          endpoint
        )

        expect(result).toEqual({
          status: 200,
          body: description
        })
      })

      it('returns a status of 404 if the action doesn\'t exist', async () => {
        const actionName = casual.word
        const endpoint = {
          id: casual.uuid,
          query: [
            global.generateRandomWithBlacklist(
              () => casual.word,
              actionName
            ),
            'description'
          ],
          type: {
            actions: {
              [actionName]: {
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

        await expect(
          handleAction(
            'GET',
            null,
            endpoint
          )
        ).resolves.toEqual({
          status: 404
        })

        await expect(
          handleAction(
            'GET',
            null,
            {
              ...endpoint,
              type: {}
            }
          )
        ).resolves.toEqual({
          status: 404
        })
      })

      it('returns a status of 405 and an appropiate Allow header if called with a method other than GET', async () => {
        const actionName = casual.word
        const description = casual.text
        const endpoint = {
          id: casual.uuid,
          query: [ actionName, 'description' ],
          type: {
            actions: {
              [actionName]: {
                description
              }
            }
          },
          referrer: {
            id: casual.uuid,
            type: casual.word,
            referrer: null
          }
        }

        const method = global.generateRandomWithBlacklist(
          () => casual.http_method,
          'GET'
        )
        const result = await handleAction(
          method,
          null,
          endpoint
        )

        expect(result).toEqual({
          status: 405,
          headers: {
            Allow: 'GET'
          }
        })
      })
    })

    describe('[NOT invoke OR description]', () => {
      it('returns a status of 404', async () => {
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
          [ 'invoke', 'description' ]
        )

        const endpoint = {
          id: casual.uuid,
          query: [ actionName, subResource ],
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

        const result = await handleAction(
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
  })
})
