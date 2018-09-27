# nextrest-server-express
NextREST server implementation for the Node.JS express package.

## Goal

A common problem with REST is the duplication of code, which makes developing slow and boring.
Adding route after route simply is a cumbersome progress not enjoyable at all and very counter intuitive.

In addition there often are discussions how to properly do RESTful API design and over the right HTTP methods etc.

NextREST aims at making programming fun again and to allow for rapid development, by taking those meta tasks off the developers in order to allow them to focus on what matters to them: business logic and its performance.

## How it works

NextREST is building upon an OO approach. You simply define your types and their actions - then NextREST takes care of the meta work for you.

`Todo.js`:
```js
import Service from './TodoService.js'

const actions = {
  setStatus: {
    invoke: Service.setTodoStatus,
    description: 'Sets the todos status',
    idempotent: true,
    parameters: {
      status: {
        type: [ 'done', 'todo'],
        description: 'The status'
      }
    }
  }
}

const Todo = {
  resourceName: 'todos',
  get: Service.getTodo,
  list: Service.getTodos,
  delete: Service.deleteTodo,
  actions
}

export default Todo
```
`app.js`:
```js
import express from 'express'
import NextREST from 'nextrest-server-express'

import TodoType from './Todo.js'

const app = express()
const nextREST = NextREST()

nextREST.register(TodoType)

app.use('/REST', nextREST)
app.listen(3000, () => {
  console.log('Listening on port 3000!')
})
```

##### Results in:
`GET http://localhost:3000/REST/todos`
```json
[ {
  "id": 1,
  "title": "Todo 1",
  "text": "My first todo!",
  "status": "todo",
  "actions": {
    "setStatus": {
      "description": "http://localhost:3000/REST/todos/1/actions/setstatus",
      "invoke": "http://localhost:3000/REST/todos/1/actions/setstatus/invoke",
      "method": "PUT",
      "params": {
        "status": {
          "type": [ "done", "todo" ],
          "description": "http://localhost:3000/REST/todos/1/actions/setstatus/params/status"
        }
      }
    }
  }
} ]
```
