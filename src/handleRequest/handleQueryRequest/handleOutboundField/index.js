const handleOutboundField = async function handleOutboundFieldRequest (method, endpoint, context) {
  const { id, type, query, referrer } = endpoint
  const [ fieldName, ...additionalParams ] = query

  if (additionalParams.length > 0) {
    return {
      status: 404
    }
  }

  const requestHandler = (type.outboundFields || {})[fieldName]
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

  const result = await requestHandler(id, {
    context,
    referrer
  })

  return {
    status: 200,
    body: result
  }
}

module.exports = handleOutboundField
