const handleAction = require('./handleAction')
const handleOutboundField = require('./handleOutboundField')

const handleQueryRequest = async function handleRequestWithQuery (method, data, endpoint, context) {
  const { query } = endpoint

  const [ queryType, ...querySegments ] = query.split('/')

  if (queryType === 'actions') {
    return handleAction(
      method,
      data,
      {
        ...endpoint,
        query: querySegments
      },
      context
    )
  }

  if (queryType === 'fields') {
    return handleOutboundField(
      method,
      {
        ...endpoint,
        query: querySegments
      },
      context
    )
  }

  return {
    status: 404
  }
}

module.exports = handleQueryRequest
