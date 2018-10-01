const casual = require('casual')

const HTTP_METHODS = [
  'GET',
  'PUT',
  'POST',
  'PATCH',
  'DELETE'
]
casual.define('http_method', function () {
  return casual.random_element(HTTP_METHODS)
})

global.generateRandomWithBlacklist = (generator, forbiddenResults) => {
  if (!Array.isArray(forbiddenResults)) {
    forbiddenResults = [ forbiddenResults ]
  }

  let result
  do {
    result = generator()
  } while (forbiddenResults.includes(result))

  return result
}
