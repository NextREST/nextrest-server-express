const makeActionsDescriptor = require('../../makeActionsDescriptor')

const handleAction = async function handleActionRequest (method, data, endpoint, context) {
  const { id, type, query, referrer } = endpoint
  const [ actionName, subResource, ...additionalParams ] = query

  if (!subResource) {
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

  const action = (type.actions || {})[actionName]
  if (!action) {
    return {
      status: 404
    }
  }

  if (additionalParams.length === 0) {
    if (subResource === 'invoke') {
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

    if (subResource === 'description') {
      if (method !== 'GET') {
        return {
          status: 405,
          headers: {
            Allow: 'GET'
          }
        }
      }

      return {
        status: 200,
        body: action.description
      }
    }
  }

  return {
    status: 404
  }
}

module.exports = handleAction
