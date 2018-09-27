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
  ).returns({
    [casual.word]: 'some type'
  })

  const NextREST = require('./index.js')
  let nextREST

  beforeEach(() => {
    nextREST = NextREST()
    findTypeStub.reset()
  })

  afterAll(() => {
    findTypeStub.restore()
  })

  it('calls findType with its types and the request url', () => {
    const req = {
      url: casual.url
    }

    nextREST(req)

    expect(findTypeStub).toHaveProperty('calledOnce', true)

    const { args } = findTypeStub.getCall(0)
    expect(args).toHaveProperty('length', 2)
    expect(args[0]).toBe(nextREST.getRegisteredTypes())
    expect(args[1]).toBe(req.url)
  })

  it('exposes registerType and internally uses the registerType function', () => {
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
})
