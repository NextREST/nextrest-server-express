const makeActionsDescriptor = require('../makeActionsDescriptor')

const handleQueryRequest = async function handleRequestWithQuery (method, data, endpoint, context) {
  const { id, query, type, referrer } = endpoint

  const querySegments = query.split('/')
  const queryType = querySegments[0]

  if (queryType === 'actions') {
    if (querySegments.length === 1) {
      if (method !== 'GET') {
        return {
          status: 405,
          headers: {
            Allow: 'GET'
          }
        }
      }

      const actionsDescriptor = makeActionsDescriptor(type.actions)

      return {
        status: 200,
        body: actionsDescriptor
      }
    }

    const action = (type.actions || {})[querySegments[1]]
    if (!action) {
      return {
        status: 404
      }
    }

    if (querySegments.length === 3 && querySegments[2] === 'invoke') {
      if (method !== action.method) {
        return {
          status: 405,
          headers: {
            Allow: action.method
          }
        }
      }

      const result = await action.invoke(id, data, {
        context,
        referrer
      })

      return {
        status: action.successStatus || 200,
        body: result
      }
    }
  }

  if (queryType === 'fields') {
    if (querySegments.length !== 2) {
      return {
        status: 404
      }
    }

    const requestHandler = (type.outboundFields || {})[querySegments[1]]
    if (!requestHandler) {
      return {
        status: 404
      }
    }

    if (method !== 'GET') {
      return {
        status: 405,
        headers: {
          Allow: 'GET'
        }
      }
    }

    const result = await requestHandler(
      id, {
        context,
        referrer
      }
    )

    return {
      status: 200,
      body: result
    }
  }

  return {
    status: 404
  }
}

module.exports = handleQueryRequest
