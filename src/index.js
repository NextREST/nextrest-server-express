const registerType = require('./registerType')
const findType = require('./findType')
const handleRequest = require('./handleRequest')

const NextREST = function nextRESTMiddlewareFactory (buildContext) {
  let types = {}

  const middleware = async function (req, res, next) {
    const endpoint = findType(types, req.path)
    if (endpoint === false) {
      return res.sendStatus(404)
    }

    const context = typeof buildContext === 'function'
      ? await buildContext(req)
      : buildContext

    const result = await handleRequest(req.method, req.body, endpoint, context)
  }

  middleware.registerType = function registerTypeToNextREST (type) {
    types = registerType(types, type)
  }

  middleware.getRegisteredTypes = function () {
    return types
  }

  return middleware
}

module.exports = NextREST
