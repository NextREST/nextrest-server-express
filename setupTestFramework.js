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
