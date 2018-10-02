const casual = require('casual')

const handleOutboundField = require('./index.js')

describe('handleOutboundField()', () => {
  it('returns a status of 404 if there\'s no field name provided', async () => {
    const endpoint = {
      id: casual.uuid,
      query: [],
      type: {
        outboundFields: {
          [casual.word]: () => null
        }
      }
    }

    const result = await handleOutboundField(
      'GET',
      endpoint
    )

    expect(result).toEqual({
      status: 404
    })
  })

  it('returns a status of 404 if there\'s a field sub-resource selected (e.g. /status/sub-resource)', async () => {
    const endpoint = {
      id: casual.uuid,
      query: [ casual.word, casual.word ],
      type: {
        outboundFields: {
          [casual.word]: () => null
        }
      }
    }

    const result = await handleOutboundField(
      'GET',
      endpoint
    )

    expect(result).toEqual({
      status: 404
    })
  })

  describe('/[fieldName]', () => {
    describe('if the field exists', () => {
      it('calls type.outboundFields[fieldName] and returns its result as the response body with a status of 200 when using GET', async () => {
        const fieldName = casual.word
        const requestHandler = jest.fn()
          .mockResolvedValue({
            name: casual.name
          })

        const endpoint = {
          id: casual.uuid,
          query: [ fieldName ],
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

        const result = await handleOutboundField(
          'GET',
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
          query: [ fieldName ],
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

        const result = await handleOutboundField(
          method,
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
          query: [ casual.word ],
          type: {},
          referrer: {
            id: casual.uui,
            type: casual.word,
            referrer: null
          }
        }

        const result = await handleOutboundField(
          'GET',
          endpoint
        )

        expect(result).toEqual({
          status: 404
        })
      })

      it('returns a status of 404 when using a method other than GET', async () => {
        const endpoint = {
          id: casual.uuid,
          query: [ casual.word ],
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

        const result = await handleOutboundField(
          method,
          endpoint
        )

        expect(result).toEqual({
          status: 404
        })
      })
    })
  })
})
