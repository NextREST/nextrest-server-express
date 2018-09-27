const { registerType } = require('./registerType')
const { findType } = require('./findType')

const NextREST = function nextRESTMiddlewareFactory () {
  let types = {}

  const middleware = function (req, res, next) {
    const type = findType(types, req.url)
  }

  middleware.registerType = function registerTypeToNextREST (type) {
    types = registerType(types, type)
  }

  middleware.getRegisteredTypes = function () {
    return types
  }

  return middleware
}

/******

Functions:

  findType (types, url)
    finds the addressed type based on the request url

******/

module.exports = NextREST
