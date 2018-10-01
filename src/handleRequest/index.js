const handleQueryRequest = require('./handleQueryRequest')

const handleRequest = async function handleRequestForType (method, endpoint, context) {
  const { type, id, referrer, query = null } = endpoint

  if (query !== null) {
    return handleQueryRequest(method, endpoint, context)
  }

  const methodToFunctionMapping = methodToFunctionMappingByRequestType[
    id === null ? 'type' : 'entity'
  ]
  const { fnName, resStatus } = methodToFunctionMapping[method]
  const requestHandler = type[fnName]

    const typeSupportsRequestType = Object.values(methodToFunctionMapping)
      .some(({ fnName }) => type[fnName])
  if (!requestHandler) {

    if (typeSupportsRequestType) {
      return {
        status: 405
      }
    }

    return {
      status: 404
    }
  }

  const meta = {
    context,
    referrer
  }

  return {
    status: resStatus,
    body: id === null
      ? await requestHandler(meta)
      : await requestHandler(id, meta)
  }
}

const methodToFunctionMappingByRequestType = {
  type: {
    'GET': {
      fnName: 'list',
      resStatus: 200
    },
    'POST': {
      fnName: 'create',
      resStatus: 201
    },
    'PUT': {
      fnName: 'replace',
      resStatus: 200
    }
  },
  entity: {
    'GET': {
      fnName: 'get',
      resStatus: 200
    },
    'DELETE': {
      fnName: 'delete',
      resStatus: 200
    },
    'PATCH': {
      fnName: 'edit',
      resStatus: 200
    }
  }
}

module.exports = handleRequest
