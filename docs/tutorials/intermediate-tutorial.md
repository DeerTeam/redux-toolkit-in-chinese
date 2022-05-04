---
id: intermediate-tutorial
title: 中级教程
sidebar_label: 中级教程
hide_title: true
---

# 中级教程: 把 Redux 工具包 实践起来

在 [基础教程](./basic-tutorial.md) 中，你已经看到了 Redux 工具包 中包含的主要的 API 函数，以及一些为什么和如何使用它们的简短的例子。你也可以看到你能够不使用 React、NPM、Webpack 或者任何构建工具，在一个 HTML 页面的 script 标签就能使用 Redux 和 RTK。

在这个教程中，你将看到在一个简单的 React 应用中如何使用这些 API。具体点说，是我们转而使用 RTK 来把这些 [原 Redux "todos" 示例应用](https://redux.js.org/introduction/examples#todos) 进行转换。

我们将会介绍几个概念:

- 如何将 "纯 Redux" 代码转化使用为 RTK 代码
- 如何在一个典型的 React+Redux 应用中使用 RTK
- 如何使用 RTK 里一些更强大的特性来简化你的 Redux 代码

另外，尽管接下来的并不仅针对于 RTK，我们也会研究几种能改进你的 React-Redux 代码的方法。

本教程中，实现整个应用的完整源代码可以从 [github.com/reduxjs/rtk-convert-todos-example](https://github.com/reduxjs/rtk-convert-todos-example) 获得。我们将逐步解释整个转换的过程，正如仓库里的历史记录所展示一样。有特殊意义的、独立的代码提交的链接，将像如下高亮的引用块显示：

> - 这里是提交信息

## 回顾 Redux Todos 示例

如果我们查看 [当前 `todos` 示例源代码](https://github.com/reduxjs/redux/tree/9c9a4d2a1c62c9dbddcbb05488f8bd77d24c81de/examples/todos/src)，我们可以观察到以下几点：

- [`todos` reducer 函数](https://github.com/reduxjs/redux/blob/9c9a4d2a1c62c9dbddcbb05488f8bd77d24c81de/examples/todos/src/reducers/todos.js) 通过复制嵌套的 JS 对象和数组来 "手工" 进行 immutable 更新
- [`actions` 文件](https://github.com/reduxjs/redux/blob/9c9a4d2a1c62c9dbddcbb05488f8bd77d24c81de/examples/todos/src/actions/index.js)
  中，有几个纯手工写的 action creator 函数，同时 action type 字符串在 actions 文件和 reducer 文件中重复出现
- 项目代码结构用的是 ["folder-by-type" 结构](https://redux.js.org/faq/code-structure#what-should-my-file-structure-look-like-how-should-i-group-my-action-creators-and-reducers-in-my-project-where-should-my-selectors-go)， `actions` 和 `reducers` 由不同的文件组成
- React 组件用的是一种严格版本的 ["容器/展示"模式 ("container/presentational" pattern)](https://medium.com/@dan_abramov/smart-and-dumb-components-7ca2f9a7c7d0) 来撰写的, 其中 ["展示"组件放置于一个文件夹当中](https://github.com/reduxjs/redux/tree/9c9a4d2a1c62c9dbddcbb05488f8bd77d24c81de/examples/todos/src/components)，而 [定义 Redux 连接逻辑的"容器"组件则在另一个文件中](https://github.com/reduxjs/redux/tree/9c9a4d2a1c62c9dbddcbb05488f8bd77d24c81de/examples/todos/src/containers)
- 若干代码并没有遵某些 Redux 所推荐的"最佳实践"模式。在展示的过程中，我们会仔细观察一些具体的例子

一方面，这是一个小小的示例应用。它的意图是说明实际中一起使用 React 和 Redux 的基础知识，并不是一定要在一个全面的生产的应用中作为"正确的方式"来使用。另一方面，大多数人会使用他们在文档和示例中看到的模式，这里面肯定有改进的空间。

## 初始转换步骤

### 在项目中添加 Redux 工具包

由于原始的 todos 示例在 Redux 代码仓库中，我们可以先拷贝 Redux "todos" 源码到的一个全新的 Create-React-App 项目中去，之后再把 Prettier 添加到项目中，以确保项目代码能保持一致的格式。另外，项目中还有一个 [jsconfig.json](https://code.visualstudio.com/docs/languages/jsconfig) 文件，以便我们能够使用 `/src` 文件夹作为根文件夹，来使用"绝对引入路径"方法。

> - [首次提交](https://github.com/reduxjs/rtk-convert-todos-example/commit/a8e0a9a9d77b9dcd9e881079e7cca449084ca7b1).
> - [添加 jsconfig.json 来支持绝对引入](https://github.com/reduxjs/rtk-convert-todos-example/commit/b866e205b9ebece84367f11d2faabc557bd08e23)

在基础教程中，我们只是作为一个独立的 script 标签链接到 Redux Toolkit。单身，在一个典型的应用中，你需要将 RTK 作为一个包引用添加到你的项目。你可以使用 NPM 或者 Yarn
任意一种包管理器：

```bash
# 如果你正在使用 NPM:
npm install @reduxjs/toolkit

# 或者 Yarn:
yarn add @reduxjs/toolkit
```

一旦完成之后，你应该暂存和提交被修改过的 `package.json` 文件，以及那被你的包管理器”锁定了的文件“ (NPM 是 `package-lock.json`， 或者 Yarn 是 `yarn.lock`).

> - [添加 Redux Toolkit](https://github.com/reduxjs/rtk-convert-todos-example/commit/c3f47aeaecf855561e4db9d452b928f1b8b6c016)

这一步完成之后，我们就可以着手写代码了。

### 使用 `configureStore` 转化 Store 

正如 "counter" 示例一样，我们可以使用 RTK 的 `configureStore` 去替换纯 Redux 的 `createStore` 函数。这一步会自动把 Redux DevTools Extension 设置好。

这里的只是一些简单的转换。我们更新 `src/index.js`，引入 `configureStore` 而非 `createStore`，并且把函数调用替换掉。请记住 `configureStore` 接收一个带有具名字段的选项对象作为参数，因此我们将其作为一个名为 `reducer` 的对象字段进行传入 ，而不是直接给 `rootReducer` 传入第一个参数。

> - [以使用 configureStore 转换 store 配置](https://github.com/reduxjs/rtk-convert-todos-example/commit/cdfc15edbd82beda9ef0521aa191574b6cc7695a)

```diff {3-4,9-12}
import React from "react";
import { render } from "react-dom";
-import { createStore } from "redux";
+import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import App from "./components/App";
import rootReducer from "./reducers";

- const store = createStore(rootReducer);
+ const store = configureStore({
+   reducer: rootReducer,
+});
```

**注意，我们仍然在使用原应用里的相同的根 reducer 函数，并且一个 Redux store 仍旧需要被创建出来。唯一的变化仅仅是，store 是利用协助开发的工具自动设置好的。**

如果你安装好了 [Redux DevTools 浏览器插件](https://github.com/zalmoxisus/redux-devtools-extension)， 启动应用之后，你应该能看到的开发模式下的当前状态，并且能够打开开发者工具插件。它应该长这个样子：

![展示 Redux DevTools 初始状态的插件截图](/assets/tutorials/intermediate/int-tut-01-redux-devtools.png)

## 创建 Todos 分片

第一个重写应用的重大步骤，就是将 todos 逻辑转化成一个新的 "分片"。

### 理解"分片"

目前为止，todos 代码被分为两个部分。reducer 逻辑在 `reducers/todos.js`，而 action creators 在 `actions/index.js`。在一个更大型的应用中，我们有可能还会看到 action type 常量，比如 `constants/todos.js`，因此可以在以上两处地方被复用。

我们 _可以_ 使用 RTK [`createReducer`](../api/createReducer.mdx) 和 [`createAction`](../api/createAction.mdx) 函数把它们替换掉。然而，RTK [`createSlice` 函数](../api/createSlice.mdx) 可以让我们把这些逻辑整合到一个地方。它的内部使用了 `createReducer` 和 `createAction`，因此 **在大部分应用中, 你无需亲自调用这两个函数 - `createSlice` 足够了。**

你可能会有疑惑，“究竟什么是‘分片’呢？“。一个普通的 Redux 应用里，有一个在状态树顶级的 JS 对象，并且该对象是调用了 Redux [`combineReducers` 函数](https://redux.js.org/api/combinereducers) （其目的是聚合多个 reducer 函数到一个更大的 ”根 reducer“）的结果。**我们把这个对象的任意一个键/值区域称为一个 '分片' , 同时我们使用 ["分片 reducer"](https://redux.js.org/recipes/structuring-reducers/splitting-reducer-logic) 这个术语，去形容负责更新该分片状态的 reducer 函数。**

在这个应用中，这个根 reducer 长这样：

```js
import todos from './todos'
import visibilityFilter from './visibilityFilter'

export default combineReducers({
  todos,
  visibilityFilter
})
```
因此，合并之后的状态长 `{todos: [], visibilityFilter: "SHOW_ALL"}`. `state.todos` 这样。 `state.todos` 是一个 “分片”， 而 `todos` reducer 函数是一个 “分片 reducer”。

### 审视原始 Todos Reducer

原来的 todos reducer 逻辑是这样的:

```js
const todos = (state = [], action) => {
  switch (action.type) {
    case 'ADD_TODO':
      return [
        ...state,
        {
          id: action.id,
          text: action.text,
          completed: false
        }
      ]
    case 'TOGGLE_TODO':
      return state.map(todo =>
        todo.id === action.id ? { ...todo, completed: !todo.completed } : todo
      )
    default:
      return state
  }
}

export default todos
```

我们可以看到它要处理三种情况：

- 拷贝当前的 `state` 数组以及添加一个新的 todo 条目到数组末尾，从而添加一条新的 todo
- 利用 `state.map()` 方法，拷贝当前的数组，从而进行 todo 条目的状态切换；数组中，需要更新的 todo 对象会被替换掉，而其余的 todo 条目则不作修改
- 对所有其他的 actions 一律返回当前的状态（等价于 "我根本不关心这个 action")

并且，它以一个默认值 `[]` 初始化了状态值，并且自身被默认暴露出来。
### 撰写分片 Reducer

我们可以利用 `createSlice` 去完成同样的工作，但是会以一种更简单的方式。

首先，我们会添加一个名为 `/features/todos/todosSlice.js` 的新文件。注意到，尽管如何组织你的应用里面的文件夹与文件并不是一个大问题，但是我们发现 [a "feature folder" approach](https://redux.js.org/faq/code-structure#what-should-my-file-structure-look-like-how-should-i-group-my-action-creators-and-reducers-in-my-project-where-should-my-selectors-go) 在很多应用中效果会更好。文件命名也是由完全取决于你，但是 `someFeatureSlice.js` 的约定是比较合理的。

在这个文件当中，我们会添加如下的逻辑：

> - [添加初始 todos 分片](https://github.com/reduxjs/rtk-convert-todos-example/commit/48ce059dbb0fce1b961631821534fbcb766d3471)

```js
import { createSlice } from '@reduxjs/toolkit'

const todosSlice = createSlice({
  name: 'todos',
  initialState: [],
  reducers: {
    addTodo(state, action) {
      const { id, text } = action.payload
      state.push({ id, text, completed: false })
    },
    toggleTodo(state, action) {
      const todo = state.find(todo => todo.id === action.payload)
      if (todo) {
        todo.completed = !todo.completed
      }
    }
  }
})

export const { addTodo, toggleTodo } = todosSlice.actions

export default todosSlice.reducer
```

#### `createSlice` 选项

让我们来解构一下它做了哪些事情：

- `createSlice` takes an options object as its argument, with these options:
  - `name`: a string that is used as the prefix for generated action types
  - `initialState`: the initial state value for the reducer
  - `reducers`: an object, where the keys will become action type strings, and the functions are reducers that will be run when that action type is dispatched. (These are sometimes referred to as ["case reducers"](https://redux.js.org/recipes/structuring-reducers/splitting-reducer-logic), because they're similar to a `case` in a `switch` statement)

So, the `addTodo` case reducer function will be run when an action with the type `"todos/addTodo"` is dispatched.

There's no `default` handler here. The reducer generated by `createSlice` will automatically handle all other action types by returning the current state, so we don't have to list that ourselves.

#### "Mutable" Update Logic

Notice that the `addTodo` reducer is calling `state.push()`. Normally, this is bad, because [the `array.push()` function mutates the existing array](https://doesitmutate.xyz/#push), and **[Redux reducers must _never_ mutate state!](https://redux.js.org/basics/reducers#handling-actions)**.

However, `createSlice` and `createReducer` wrap your function with [`produce` from the Immer library](https://github.com/immerjs/immer). **This means you can write code that "mutates" the state inside the reducer, and Immer will safely return a correct immutably updated result.**

Similarly, `toggleTodo` doesn't map over the array or copy the matching todo object. Instead, it just finds the matching todo object, and then mutates it by assigning `todo.completed = !todo.completed`. Again, Immer knows this object was updated, and makes copies of both the todo object and the containing array.

Normal immutable update logic tends to obscure what you're actually trying to do because of all of the extra copying that has to happen. Here, the intent should be much more clear: we're adding an item to the end of an array, and we're modifying a field in a todo entry.

#### Exporting the Slice Functions

`createSlice` returns an object that looks like this:

```js
{
  name: "todos",
  reducer: (state, action) => newState,
  actions: {
    addTodo: (payload) => ({type: "todos/addTodo", payload}),
    toggleTodo: (payload) => ({type: "todos/toggleTodo", payload})
  },
  caseReducers: {
    addTodo: (state, action) => newState,
    toggleTodo: (state, action) => newState,
  }
}
```

**Notice that it auto-generated the appropriate action creator functions _and_ action types for each of our reducers - we don't have to write those by hand!**

We'll need to use the action creators and the reducer in other files, so at a minimum we would need to export the slice object. However, we can use a Redux community code convention called [the "ducks" pattern](https://github.com/erikras/ducks-modular-redux). Simply put, **it suggests that you should put all your action creators and reducers in one file, do named exports of the action creators, and a default export of the reducer function**.

Thanks to `createSlice`, we already have our action creators and the reducer right here in one file. All we have to do is export them separately, and our todos slice file now matches the common "ducks" pattern.

#### Working with Action Payloads

Speaking of the action creators, let's go back and re-examine the reducer logic for a minute.

By default, the action creators from the RTK `createAction` function only accept one argument. That argument, whatever it is, is put into the action object as a field called `payload`.

There's nothing special about the field `action.payload` by itself. Redux doesn't know or care about that name. But, like "ducks", the name `payload` comes from another Redux community convention called ["Flux Standard Actions"](https://github.com/redux-utilities/flux-standard-action).

Actions usually need to include some extra data along with the `type` field. The original Redux code for `addTodo` has an action object that looks like `{type, id, text}`. **The FSA convention suggests that rather than having data fields with random names directly in the action object, you should always put your data inside a field named `payload`**.

It's up to the reducer to establish what it thinks `payload` should be for each action type, and whatever code dispatches the action needs to pass in values that match that expectation. If only one value is needed, you could potentially use that as the whole `payload` value directly. More commonly, you'd need to pass in multiple values, in which case `payload` should be an object containing those values.

In our todos slice, `addTodo` needs two fields, `id` and `text`, so we put those into an object as `payload`. For `toggleTodo`, the only value we need is the `id` of the todo being changed. We could have made that the `payload`, but I prefer always having `payload` be an object, so I made it `action.payload.id` instead.

(As a sneak peek: there _is_ a way to customize how action object payloads are created. We'll look at that later in this tutorial, or you can look through [the `createAction` API docs](../api/createAction.mdx) for an explanation.)

### Updating the Todos Tests

The original todos reducer has a tests file with it. We can port those over to work with our todos slice, and verify that they both work the same way.

The first step is to copy `reducers/todos.spec.js` over to `features/todos/todosSlice.spec.js`, and change the import path to read the reducer from the slice file.

> - [Copy tests to todos slice](https://github.com/reduxjs/rtk-convert-todos-example/commit/b603312ddf55899e8a75522d407c40474948ae0b)

Once that is done, we need to update the tests to match how RTK works.

The first issue is that the test file hardcodes action types like `'ADD_TODO'`. RTK's action types look like `'todos/addTodo'`. We can reference that by also importing the action creators from the todos slice, and replacing the original type constants in the test with `addTodo.type`.

The other problem is that the action objects in the tests look like `{type, id, text}`, whereas RTK always puts those extra values inside `action.payload`. So, we need to modify the test actions to match that.

(We really _could_ just replace all the inline action objects in the test with calls like `addTodo({id : 0, text: "Buy milk"})`, but this is a simpler set of changes to show for now.)

> - [Port the todos tests to work with the todos slice](https://github.com/reduxjs/rtk-convert-todos-example/commit/39dbbf37bd4c559db956c8291bbd0bf1135546bb)

An example of the changes would be:

```diff
// Change the imports to get the action creators
-import todos from './todosSlice'
+import todos, { addTodo, toggleTodo } from './todosSlice'

// later, in a test:
  it('should handle ADD_TODO', () => {
    expect(
      todos([], {
-       type: 'ADD_TODO',
-       text: 'Run the tests',
-       id: 0
+       type: addTodo.type,
+       payload: {
+         text: 'Run the tests',
+         id: 0
+       }
      })
    ).toEqual([
```

After those changes, all the tests in `todosSlice.spec.js` should pass, proving that our new RTK slice reducer works exactly the same as the original hand-written reducer!

### Implementing Todo IDs

In the original code, each newly added todo gets an ID value from an incrementing number:

```js
let nextTodoId = 0
export const addTodo = text => ({
  type: 'ADD_TODO',
  id: nextTodoId++,
  text
})
```

Right now, our todos slice doesn't do that, because the `addTodo` action creator is automatically generated for us.

We _could_ add that behavior for requiring that whatever code dispatches the add todo should have to pass in a new ID, like `addTodo({id: 1, text: "Buy milk"})`, but that would be annoying. Why should the caller have to track that value? Also, what if there are multiple parts of the app that would need to dispatch that action? It would be better to encapsulate that logic in the action creator.

RTK allows you to customize how the `payload` field is created in your action objects. If you are using `createAction` by itself, you can pass a "prepare callback" as the second argument. Here's what this would look like:

> - [Implement addTodo ID generation](https://github.com/reduxjs/rtk-convert-todos-example/commit/0c9e3b721c209d368d23a70cf8faca8f308ff8df)

```js
let nextTodoId = 0

export const addTodo = createAction('ADD_TODO', text => {
  return {
    payload: { id: nextTodoId++, text }
  }
})
```

**Note that the "prepare callback" _must_ return an object with a field called `payload` inside!** Otherwise, the action's payload will be undefined. It _may_ also include a field called `meta`, which can be used to include extra additional metadata related to the action.

If you're using `createSlice`, it automatically calls `createAction` for you. If you need to customize the payload there, you can do so by passing an object containing `reducer` and `prepare` functions to the `reducers` object, instead of just the reducer function by itself:

```js
let nextTodoId = 0

const todosSlice = createSlice({
  name: 'todos',
  initialState: [],
  reducers: {
    addTodo: {
      reducer(state, action) {
        const { id, text } = action.payload
        state.push({ id, text, completed: false })
      },
      prepare(text) {
        return { payload: { text, id: nextTodoId++ } }
      }
    }
  }
}
```

We can add an additional test that confirms this works:

```js
describe('addTodo', () => {
  it('should generate incrementing todo IDs', () => {
    const action1 = addTodo('a')
    const action2 = addTodo('b')

    expect(action1.payload).toEqual({ id: 0, text: 'a' })
    expect(action2.payload).toEqual({ id: 1, text: 'b' })
  })
})
```

## Using the New Todos Slice

### Updating the Root Reducer

We have a shiny new todos reducer function, but it isn't hooked up to anything yet.

The first step is to go update our root reducer to use the reducer from the todos slice instead of the original reducer. We just need to change the import statement in `reducers/index.js`:

> - [Use the todos slice reducer](https://github.com/reduxjs/rtk-convert-todos-example/commit/7b6e005377c856d7415e328387188260330ebae4)

```diff
import { combineReducers } from 'redux'
-import todos from './todos'
+import todosReducer from 'features/todos/todosSlice'
import visibilityFilter from './visibilityFilter'

export default combineReducers({
- todos,
+ todos: todosReducer,
  visibilityFilter
})
```

While we could have kept the imported function named as `todos` so that we can use the object literal shorthand with `combineReducers`, it's a little more clear if we name the imported function `todosReducer` and define the field as `todos: todosReducer`.

### Updating the Add Todo Component

If we reload the app, we should still see that `state.todos` is an empty array. But, if we click on "Add Todo", nothing will happen. We're still dispatching actions whose type is `'ADD_TODO'`, while our todos slice is looking for an action type of `'todos/addTodo'`. We need to import the correct action creator and use it in the `AddTodo.js` file.

While we're at it, there are a couple of other problems with how the `AddTodo` component is written. First, it's currently using a React "callback ref" to read the current text value from the input when you click "Add Todo". This works, but the standard "React way" to handle form fields is with the "controlled inputs" pattern, where the current field value is stored in the component's state.

Second, the connected component is getting `dispatch` as a prop. Again, this works, but the normal way to use connect is to [pass action creator functions to `connect`](https://react-redux.js.org/using-react-redux/connect-mapdispatch), and then dispatch the actions by calling the functions that were passed in as props.

Since we've got this component open, we can fix those issues too. Here's what the final version looks like:

> - [Update AddTodo to dispatch the new action type](https://github.com/reduxjs/rtk-convert-todos-example/commit/d7082409ebaa113b74f6989bf70ee09600f37d0b)

```js
import React, { useState } from 'react'
import { connect } from 'react-redux'
import { addTodo } from 'features/todos/todosSlice'

const mapDispatch = { addTodo }

const AddTodo = ({ addTodo }) => {
  const [todoText, setTodoText] = useState('')

  const onChange = e => setTodoText(e.target.value)

  return (
    <div>
      <form
        onSubmit={e => {
          e.preventDefault()
          if (!todoText.trim()) {
            return
          }
          addTodo(todoText)
          setTodoText('')
        }}
      >
        <input value={todoText} onChange={onChange} />
        <button type="submit">Add Todo</button>
      </form>
    </div>
  )
}

export default connect(null, mapDispatch)(AddTodo)
```

We start by importing the correct `addTodo` action creator from our todos slice.

The input is now being handled as a standard "controlled input", with the text value being stored in the component's state. We can use that state text value in the form's submit handler.

Finally, we use the ["object shorthand" form of `mapDispatch`](https://react-redux.js.org/using-react-redux/connect-mapdispatch#defining-mapdispatchtoprops-as-an-object) to simplify passing the action creators to `connect`. The "bound" version of `addTodo` is passed in to the component as a prop, and it will dispatch the action as soon as we call it.

### Updating the Todo List

The `TodoList` and `VisibleTodoList` components have similar issues: they're using the older `toggleTodo` action creator, and the `connect` setup isn't using the "object shorthand" form of `mapDispatch`. We can fix both of those.

> - [Update TodoList to dispatch the new toggle action type](https://github.com/reduxjs/rtk-convert-todos-example/commit/b47b2124d6a28386b7461bccb9216682a81edb3e)

```diff
// VisibleTodoList.js
-import { toggleTodo } from '../actions'
+import { toggleTodo } from 'features/todos/todosSlice'

-const mapDispatchToProps = dispatch => ({
- toggleTodo: id => dispatch(toggleTodo(id))
-})
+const mapDispatchToProps = { toggleTodo }
```

And with that, we should now be able to add and toggle todos again, but using our new todos slice!

## Creating and Using the Filters Slice

Now that we've created the todos slice and hooked it up to the UI, we can do the same for the filter selection logic as well.

### Writing the Filters Slice

The filter logic is really simple. We have one action, which sets the current filter value by returning what's in the action. Here's the whole slice:

> - [Add the filters slice](https://github.com/reduxjs/rtk-convert-todos-example/commit/b77f4155e3b45bce24d0d0ef6e2f7b0c3bd11ee1)

```js
import { createSlice } from '@reduxjs/toolkit'

export const VisibilityFilters = {
  SHOW_ALL: 'SHOW_ALL',
  SHOW_COMPLETED: 'SHOW_COMPLETED',
  SHOW_ACTIVE: 'SHOW_ACTIVE'
}

const filtersSlice = createSlice({
  name: 'visibilityFilters',
  initialState: VisibilityFilters.SHOW_ALL,
  reducers: {
    setVisibilityFilter(state, action) {
      return action.payload
    }
  }
})

export const { setVisibilityFilter } = filtersSlice.actions

export default filtersSlice.reducer
```

We've copied over the `VisibilityFilters` enum object that was originally in `actions/index.js`. The slice code just creates the one reducer, we export the action creator and reducer, and we're done.

### Using the Filters Slice

As with the todos reducer, we need to import and add the visibility reducer to our root reducer:

> - [Use the filters slice reducer](https://github.com/reduxjs/rtk-convert-todos-example/commit/623c47b1987914a1d90142824892686ec76c20a1)

```diff
import todosReducer from 'features/todos/todosSlice'
-import visibilityFilter from './visibilityFilter'
+import visibilityFilterReducer from 'features/filters/filtersSlice'

export default combineReducers({
  todos: todosReducer,
- visibilityFilter
+ visibilityFilter: visibilityFilterReducer
})
```

From there, we need to dispatch the `setVisibilityFilter` action when the user clicks on the buttons. First, for consistency, we should update `VisibleTodoList.js` and `Footer.js` to use the `VisibilityFilter` enum that's exported from the filter slice file, instead of the one from the actions file.

From there, the link components will take just a bit more work. `FilterLink` is currently creating new functions that capture the current value of `ownProps.filter`, so that `Link` is just getting a function called `onClick`. While that's a valid way to do it, for consistency we'd like to continue using the object shorthand form of `mapDispatch`, and modify `Link` to pass the filter value in when it dispatches the action.

> - [Use the new filters action in the UI](https://github.com/reduxjs/rtk-convert-todos-example/commit/776b39088384513ff68af41039fe5fc5188fe8fb)

```diff
// FilterLink.js
-import { setVisibilityFilter } from '../actions'
+import { setVisibilityFilter } from 'features/filters/filtersSlice'

-const mapDispatchToProps = (dispatch, ownProps) => ({
- onClick: () => dispatch(setVisibilityFilter(ownProps.filter))
-})
+const mapDispatchToProps = { setVisibilityFilter }


// Link.js
import React from 'react'
import PropTypes from 'prop-types'

-const Link = ({ active, children, onClick }) => (
+const Link = ({ active, children, setVisibilityFilter, filter }) => (
  <button
-    onClick={onClick}
+    onClick={() => setVisibilityFilter(filter)}
    disabled={active}
    style={{
      marginLeft: '4px'
    }}
  >
    {children}
  </button>
)

Link.propTypes = {
  active: PropTypes.bool.isRequired,
  children: PropTypes.node.isRequired,
- onClick: PropTypes.func.isRequired
+ setVisibilityFilter: PropTypes.func.isRequired,
+ filter: PropTypes.string.isRequired
}

export default Link
```

Again, note that most of this doesn't have to do with RTK specifically, but it's good to try to consistently use some of the recommended best practices in this example code.

With that done, we should be able to add a couple todos, toggle the state of some of them, and then switch the filters to change the display list.

## Optimizing Todo Filtering

The `VisibleTodoList` component currently uses a function called `getVisibleTodos` to do the work of filtering the todos array for display. This is a "selector function", as described in the Redux docs page on [Computing Derived Data](https://redux.js.org/recipes/computing-derived-data). It encapsulates the process of reading values from the Redux store and extracting part or all of those values for use.

However, the code as currently written has a problem. If the filter is set to `SHOW_COMPLETED` or `SHOW_ACTIVE`, it will _always_ return a new array _every_ time it is called. Since it's being used in a `mapState` function, that means it will return a new array reference when _any_ action is dispatched.

In this tiny todo example app, that isn't a problem. The only actions we have involve altering the todos list or filtering it, anyway. But, in a real app, many other actions will be dispatched. Imagine if this todo app had a counter in it, and `"INCREMENT"` was dispatched while the list is filtered. We would create a new list, and the `TodoList` would have to re-render even though nothing changed.

While this isn't a real performance issue now, it's worth showing how we can improve the behavior.

Redux apps commonly use a library called [Reselect](https://github.com/reduxjs/reselect), which has a `createSelector` function that lets you define "memoized" selector functions. These memoized selectors only recalculate values if the inputs have actually changed.

RTK re-exports the `createSelector` function from Reselect, so we can import that and use it in `VisibleTodoList`.

> - [Convert visible todos to a memoized selector](https://github.com/reduxjs/rtk-convert-todos-example/commit/4fc943b7111381974f20f74750a114b5e52ce1b2)

```diff
import { connect } from 'react-redux'
+import { createSelector } from '@reduxjs/toolkit'
import { toggleTodo } from 'features/todos/todosSlice'
import TodoList from '../components/TodoList'
import { VisibilityFilters } from 'features/filters/filtersSlice'

-const getVisibleTodos = (todos, filter) => {
-  switch (filter) {
-    case VisibilityFilters.SHOW_ALL:
-      return todos
-    case VisibilityFilters.SHOW_COMPLETED:
-      return todos.filter(t => t.completed)
-    case VisibilityFilters.SHOW_ACTIVE:
-      return todos.filter(t => !t.completed)
-    default:
-      throw new Error('Unknown filter: ' + filter)
-  }
-}

+const selectTodos = state => state.todos
+const selectFilter = state => state.visibilityFilter

+const selectVisibleTodos = createSelector(
+  [selectTodos, selectFilter],
+  (todos, filter) => {
+    switch (filter) {
+      case VisibilityFilters.SHOW_ALL:
+        return todos
+      case VisibilityFilters.SHOW_COMPLETED:
+        return todos.filter(t => t.completed)
+      case VisibilityFilters.SHOW_ACTIVE:
+        return todos.filter(t => !t.completed)
+      default:
+        throw new Error('Unknown filter: ' + filter)
+    }
+  }
+)

const mapStateToProps = state => ({
- todos: getVisibleTodos(state.todos, state.visibilityFilter)
+ todos: selectVisibleTodos(state)
})

const mapDispatchToProps = { toggleTodo }
```

First, we import `createSelector` from RTK, and define a couple one-line selector functions that grab the `todos` and `visibilityFilter` fields from their `state` argument.

We then call `createSelector`, and pass those two small selector functions in the "input selectors" array. `createSelector` will call those, take the return values, and pass those to the "output selector" we've defined, which can then do the filtering and return the final result.

There's a couple small changes in how this is defined and used. While you can give selector functions any name you want, `selectX` is a more common naming convention than `getX`. Also, because the input selectors take care of reading the necessary values, we can just call `selectVisibleTodos(state)`, with `state` as the only argument.

If we re-run the app, the filtering logic _should_ work exactly the same as before from what you can see in the UI.

## Cleanup

That's the end of the actual conversion work. We now have a bunch of action and reducer files that are no longer being used, so we should delete those to clean up the project.

We can safely remove `actions/index.js`, `reducers/todos.js`, `reducers/visibilityFilter.js`, and the associated test files.

We can also try completely switching from the "folder-by-type" structure to a "feature folder" structure, by moving all of the component files into the matching feature folders.

> - [Remove unused action and reducer files](https://github.com/reduxjs/rtk-convert-todos-example/commit/fbc0b965949e082748b8613b734612226ffe9e94)
> - [Consolidate components into feature folders](https://github.com/reduxjs/rtk-convert-todos-example/commit/138cc162b1cc9c64ab67fae0a1171d07940414e6)

If we do that, the final source code structure looks like this:

- `/src`
  - `/components`
    - `App.js`
  - `/features`
    - `/filters`
      - `FilterLink.js`
      - `filtersSlice.js`
      - `Footer.js`
      - `Link.js`
    - `/todos`
      - `AddTodo.js`
      - `Todo.js`
      - `TodoList.js`
      - `todosSlice.js`
      - `todosSlice.spec.js`
      - `VisibleTodoList.js`
  - `/reducers`
    - `index.js`
  - `index.js`

对于"可维护"的文件夹结构，每个人都有不同的偏好，但总体而言，结果看起来相当一致，易于遵循。

现在，让我们来看看代码的最终版本！

<iframe src="https://codesandbox.io/embed/rtk-convert-todos-example-uqqy3?fontsize=14&hidenavigation=1&module=%2Fsrc%2Ffeatures%2Ftodos%2FtodosSlice.js&theme=dark&view=editor"
     style={{ width: '100%', height: '500px', border: 0, borderRadius: '4px', overflow: 'hidden' }}
     title="rtk-convert-todos-example"
     allow="geolocation; microphone; camera; midi; vr; accelerometer; gyroscope; payment; ambient-light-sensor; encrypted-media; usb"
     sandbox="allow-modals allow-forms allow-popups allow-scripts allow-same-origin"
></iframe>

## 总结

在该教程中，你看到了：

- 如何在一个典型的 React 应用中使用 RTK，包括添加包、编写"切片"文件以及从 React 组件发起 action
- 如何使用 "可变" reducer，准备 action payload，并编写选择器函数
- 一些简化 React-Redux 代码的技术，比如使用 `mapDispatch` 的"对象简写"形式
- 使用 "功能文件夹" 结构组织代码的例子。

希望这有助于说明如何在实践中实际使用这些方法。

接下来，[高级教程](./advanced-tutorial.md) 将介绍如何在一个应用程序中使用 RTK 来完成异步数据抓取并使用 TypeScript。
