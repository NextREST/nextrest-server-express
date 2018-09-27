const sinon = require('sinon')
const casual = require('casual')

describe('NextREST()', () => {
  const findTypeStub = sinon.stub(
    require('./findType'),
    'findType'
  )

  const registerTypeStub = sinon.stub(
    require('./registerType'),
    'registerType'
  )

  const handleRequestStub = sinon.stub(
    require('./handleRequest'),
    'handleRequest'
  )

  const NextREST = require('./index.js')
  let nextREST

  beforeEach(() => {
    nextREST = NextREST()

    findTypeStub.reset()
    findTypeStub.returns({
      id: null,
      type: {},
      referrer: null
    })

    registerTypeStub.reset()
    registerTypeStub.returns({
      [casual.word]: 'some type'
    })

    handleRequestStub.reset()
  })

  afterAll(() => {
    findTypeStub.restore()
    registerTypeStub.restore()
    handleRequestStub.restore()
  })

  it('calls findType() with its types and the request path', () => {
    const req = {
      path: casual.url
    }

    nextREST(req)

    expect(findTypeStub).toHaveProperty('calledOnce', true)

    const { args } = findTypeStub.getCall(0)
    expect(args).toHaveProperty('length', 2)
    expect(args[0]).toBe(nextREST.getRegisteredTypes())
    expect(args[1]).toBe(req.path)
  })

  it('exposes registerType() and internally uses the registerType function', () => {
    const type = {
      resourceName: casual.word
    }

    const typesBefore = nextREST.getRegisteredTypes()
    nextREST.registerType(type)

    expect(registerTypeStub).toHaveProperty('calledOnce', true)

    const { args, returnValue } = registerTypeStub.getCall(0)

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

      expect(handleRequestStub).toHaveProperty('calledOnce', true)

      const { args } = handleRequestStub.getCall(0)
      expect(args).toHaveProperty('length', 3)
      expect(args[0]).toBe(req.method)
    })

    it('gets passed the result of findType() as the second argument', async () => {
      await nextREST({})

      expect(handleRequestStub).toHaveProperty('calledOnce', true)
      expect(findTypeStub).toHaveProperty('calledOnce', true)

      const { args } = handleRequestStub.getCall(0)
      expect(args).toHaveProperty('length', 3)
      expect(args[1]).toBe(findTypeStub.getCall(0).returnValue)
    })

    it('gets passed the resolved value of the users buildContext() as the third argument', async () => {
      const req = {}
      const buildContext = sinon.stub()
        .resolves(casual.username)

      nextREST = NextREST(buildContext)
      await nextREST(req)

      expect(buildContext).toHaveProperty('calledOnce', true)
      const {
        args: buildContextArgs,
        returnValue: context
      } = buildContext.getCall(0)

      expect(buildContextArgs).toHaveProperty('length', 1)
      expect(buildContextArgs[0]).toBe(req)

      expect(handleRequestStub).toHaveProperty('calledOnce', true)

      const { args } = handleRequestStub.getCall(0)
      expect(args).toHaveProperty('length', 3)
      expect(args[2]).toBe(await context)
    })
  })
})
