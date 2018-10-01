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

  if (!requestHandler) {
    const typeSupportsRequestType = Object.keys(methodToFunctionMapping)
      .map((method) => ({
        method,
        fnName: methodToFunctionMapping[method].fnName
      }))
      .filter(({ fnName }) => type[fnName])

    if (typeSupportsRequestType.length > 0) {
      return {
        status: 405,
        headers: {
          Allow: typeSupportsRequestType
            .map(({ method }) => method)
            .join(', ')
        }
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
