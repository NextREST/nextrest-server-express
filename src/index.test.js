const casual = require('casual')

jest.mock('./findType')
jest.mock('./registerType')
jest.mock('./handleRequest')

const NextREST = require('./index.js')

const findType = require('./findType')
const registerType = require('./registerType')
const handleRequest = require('./handleRequest')

describe('NextREST()', () => {
  let nextREST

  beforeEach(() => {
    nextREST = NextREST()

    findType.mockReset()
    findType.mockReturnValue({
      id: null,
      type: {},
      referrer: null
    })

    registerType.mockReset()
    registerType.mockReturnValue({
      [casual.word]: 'some type'
    })

    handleRequest.mockReset()
  })

  afterAll(() => {
    findType.mockRestore()
    registerType.mockRestore()
    handleRequest.mockRestore()
  })

  it('calls findType() with its types and the request path', () => {
    const req = {
      path: casual.url
    }

    nextREST(req)

    expect(findType).toHaveBeenCalledTimes(1)
    expect(findType).toHaveBeenCalledWith(
      nextREST.getRegisteredTypes(),
      req.path
    )
    expect(findType.mock.calls[0][0]).toBe(
      nextREST.getRegisteredTypes()
    ) // check if it's the same reference
  })

  it('exposes registerType() and internally uses the registerType function', () => {
    const type = {
      resourceName: casual.word
    }

    const typesBefore = nextREST.getRegisteredTypes()
    nextREST.registerType(type)

    expect(registerType).toHaveBeenCalledTimes(1)

    const { value: returnValue } = registerType.mock.results[0]
    const args = registerType.mock.calls[0]

    expect(nextREST.getRegisteredTypes()).toBe(returnValue)

    expect(args).toHaveProperty('length', 2)
    expect(args[0]).toBe(typesBefore)
    expect(args[1]).toBe(type)
  })

  describe('handleRequest()', () => {
    it('gets passed the request method as the first argument', async () => {
      const req = {
        method: casual.http_method
      }

      await nextREST(req)

      expect(handleRequest).toHaveBeenCalledTimes(1)

      const args = handleRequest.mock.calls[0]
      expect(args).toHaveProperty('length', 3)
      expect(args[0]).toBe(req.method)
    })

    it('gets passed the result of findType() as the second argument', async () => {
      await nextREST({})

      expect(handleRequest).toHaveBeenCalledTimes(1)
      expect(findType).toHaveBeenCalledTimes(1)

      const args = handleRequest.mock.calls[0]
      expect(args).toHaveProperty('length', 3)
      expect(args[1]).toBe(findType.mock.results[0].value)
    })

    it('gets passed the resolved value of the users buildContext() as the third argument', async () => {
      const req = {}
      const buildContext = jest.fn()
        .mockResolvedValue(casual.username)

      nextREST = NextREST(buildContext)
      await nextREST(req)

      expect(buildContext).toHaveBeenCalledTimes(1)
      const  buildContextArgs = buildContext.mock.calls[0]
      const { value: context } = buildContext.mock.results[0]

      expect(buildContextArgs).toHaveProperty('length', 1)
      expect(buildContextArgs[0]).toBe(req)

      expect(handleRequest).toHaveBeenCalledTimes(1)

      const args = handleRequest.mock.calls[0]
      expect(args).toHaveProperty('length', 3)
      expect(args[2]).toBe(await context)
    })
  })
})
