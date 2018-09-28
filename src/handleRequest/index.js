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

const handleRequest = async function handleRequestForType (method, endpoint, context) {
  const { type, id, referrer } = endpoint

  const methodToFunctionMapping = methodToFunctionMappingByRequestType[
    id === null ? 'type' : 'entity'
  ]
  const { fnName, resStatus } = methodToFunctionMapping[method]
  const resolver = type[fnName]

  if (!resolver) {
    const typeSupportsRequestType = Object.values(methodToFunctionMapping)
      .some(({ fnName }) => type[fnName])

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
      ? await resolver(meta)
      : await resolver(id, meta)
  }
}

module.exports = handleRequest
