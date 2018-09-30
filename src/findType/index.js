const reservedKeywords = [
  'actions',
  'fields'
]

const isEven = function (num) {
  return num % 2 === 0
}

const findType = function findTypeByPath (types, url) {
  const path = url.split('/').slice(1)

  let type = types
  let referrer = null
  let query = null
  for (let i = 0; i < path.length; i++) {
    const section = path[i]

    if (reservedKeywords.includes(section)) {
      query = path.slice(i).join('/')
      break
    }

    if (isEven(i)) {
      type = (
        i === 0
          ? type[section]
          : type.outboundFields[section]
      ) || false

      if (!type) {
        break
      }

      if (i === 0) {
        continue
      }

      referrer = {
        id: path[i - 1],
        type: path[i - 2],
        referrer
      }

      continue
    }
  }

  return {
    id: (isEven(path.length) && type)
      ? path[path.length - 1]
      : null,
    type,
    referrer,
    query
  }
}

module.exports = findType
