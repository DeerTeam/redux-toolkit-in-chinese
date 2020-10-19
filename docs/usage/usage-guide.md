---
id: usage-guide
title: 使用指南
sidebar_label: 使用指南
hide_title: true
---

# 使用指南

Redux 核心库有意地不要求你按照它的方式使用它。它让你自行决定如何处理一切，比如 store 体系，要管理什么状态，以及你希望如何构建你的 reducer。

在某些情况下，这是很好的，它富有灵活性，但灵活性并不总是必须的。有时，我们只是希望以最简单可行的方式上手，并具有一些良好的默认行为，开箱即用。 或者，可能你在开发一个比较大的应用并发现自己在写一些类似的代码，你希望能够减少必须手写的代码量。

如[快速开始](../introduction/quick-start.md)这个页面所述，Redux 工具包的目标是帮助简化常见的 Redux 使用案例。它并非旨在为你可能需要使用 Redux 做的所有事情提供一个完整的解决方案，但是它应该尽可能使很多 Redux 相关的代码变得更简单（或者在一些情况下，完全消除手写代码）。

Redux 工具包导出了可以在应用中使用的几个单独的功能，并添加对 Redux 常用的软件包的依赖。这使你可以决定如何在自己的应用中使用它们，不管是全新项目还是更新大型的已有项目。

让我们来看看 Redux 工具包帮助改善 Redux 相关代码的一些方法。

## 设置 Store

每一个 Redux 应用都需要配置和构建 Redux store。通常包含几个步骤：

- 引入或创建 root reducer 方法。
- 配置 middleware ，比如至少包含一个处理异步逻辑的 middleware。
- 配置 [Redux DevTools 拓展](https://github.com/zalmoxisus/redux-devtools-extension)。
- 基于应用是构建于开发模式还是生产模式，可能需要改变一些逻辑。

### 手动设置 Store

接下来的例子摘取自 Redux 文档的[配置你的 Store](https://redux.js.org/recipes/configuring-your-store)，它展示了一个典型的 store 设置过程。

```js
import { applyMiddleware, createStore } from 'redux'
import { composeWithDevTools } from 'redux-devtools-extension'
import thunkMiddleware from 'redux-thunk'

import monitorReducersEnhancer from './enhancers/monitorReducers'
import loggerMiddleware from './middleware/logger'
import rootReducer from './reducers'

export default function configureStore(preloadedState) {
  const middlewares = [loggerMiddleware, thunkMiddleware]
  const middlewareEnhancer = applyMiddleware(...middlewares)

  const enhancers = [middlewareEnhancer, monitorReducersEnhancer]
  const composedEnhancers = composeWithDevTools(...enhancers)

  const store = createStore(rootReducer, preloadedState, composedEnhancers)

  if (process.env.NODE_ENV !== 'production' && module.hot) {
    module.hot.accept('./reducers', () => store.replaceReducer(rootReducer))
  }

  return store
}
```

这个例子虽然可读，但是过程并不直截了当：

- 基本的 Redux `createStore` 函数采用指定位置的参数：`(rootReducer, preloadedState, enhancer)`。有时候很容易忘了到底哪个参数应该是哪个。
- 设置 middleware 和 enhancers 让人感到困惑，特别是如果你要添加几项配置进去。
- Redux Devtools 拓展文档原本建议使用[手写代码检查全局命名空间以查看扩展是否可用](https://github.com/zalmoxisus/redux-devtools-extension#11-basic-store)。很多使用者复制粘贴了那些片段，导致代码更难读。

### 使用 `configureStore` 简化 Store 设置

`configureStore` 帮助解决这些问题：

- 接受一个带有“具名”参数的配置对象，这样能更方便阅读。
- 你可以提供想要添加到 store 的 middleware 和 enhancer 的数组，它会自动调用 `applyMiddleware` 和 `compose`。
- 自动开启 Redux DevTools 扩展

另外，`configureStore` 默认添加了一些 middleware，每一个都有特殊的作用：

- [`redux-thunk`](https://github.com/reduxjs/redux-thunk) 是用于组件外部的同步和异步逻辑的最常用的 middleware。
- 在开发中，用来检查常规错误的 middleware，例如改变状态或者使用不可序列化的值。

这意味着设置 store 的代码变得更简短并且更容易阅读，而且你也可以获得开箱即用的良好的默认行为。

使用它的最简单的方法是将root reducer 函数做为名为 `reducer` 的参数传递：

```js
import { configureStore } from '@reduxjs/toolkit'
import rootReducer from './reducers'

const store = configureStore({
  reducer: rootReducer
})

export default store
```

你可以传递一个全是 ["slice reducers"](https://redux.js.org/recipes/structuring-reducers/splitting-reducer-logic) 的对象，`configureStore` 会为此调用 [`combineReducers`](https://redux.js.org/api/combinereducers)：

```js
import usersReducer from './usersReducer'
import postsReducer from './postsReducer'

const store = configureStore({
  reducer: {
    users: usersReducer,
    posts: postsReducer
  }
})
```

请注意，这只适用于一级的 reducer。如果想要嵌套 reducer，则需要自行调用 `combineReducers` 来处理嵌套。

如果需要自定义 store 设置，你可以传递其他配置项。这是使用 Redux 工具包的热重载的例子：

```js
import { configureStore, getDefaultMiddleware } from '@reduxjs/toolkit'

import monitorReducersEnhancer from './enhancers/monitorReducers'
import loggerMiddleware from './middleware/logger'
import rootReducer from './reducers'

export default function configureAppStore(preloadedState) {
  const store = configureStore({
    reducer: rootReducer,
    middleware: [loggerMiddleware, ...getDefaultMiddleware()],
    preloadedState,
    enhancers: [monitorReducersEnhancer]
  })

  if (process.env.NODE_ENV !== 'production' && module.hot) {
    module.hot.accept('./reducers', () => store.replaceReducer(rootReducer))
  }

  return store
}
```

如果你提供了 `middleware` 参数，则 `configureStore` 将仅使用你列出的 middleware。如果你想同时拥有自定义的 _以及_ 默认的 middleware，你可以调用 [`getDefaultMiddleware`](../api/getDefaultMiddleware.mdx) 并将结果包括在你提供的 `middleware` 数组中。

## 编写 Reducer

[Reducer](https://redux.js.org/basics/reducers) 是最重要的 Redux 概念。典型的 reducer 函数需要：

- 查看 action 对象的 `type` 字段，以了解它将如何响应
- 通过创建需要改变的部分 state 的副本并仅修改这部分副本，来不变地更新它的 state。

你可以在一个 reducer 里[如你所愿地使用条件逻辑](https://blog.isquaredsoftware.com/2017/05/idiomatic-redux-tao-of-redux-part-2/#switch-statements)，最常用的方法是 `switch` 语句，因为这是处理单个字段的多种可能值的最直接的办法。不过，很多人不喜欢 switch 语句，Redux 文档展示了[编写一个基于 action type 的充当查找表的函数](https://redux.js.org/recipes/reducing-boilerplate#generating-reducers) 的例子，但由使用者自行定制该功能了。

围绕编写 reducer 常见的痛点与不变地更新 state 有关。JavaScript 是一种可变语言，[手动更新嵌套的 immutable 数据非常困难](https://redux.js.org/recipes/structuring-reducers/immutable-update-patterns)，并且很容易出错。

### 使用 `createReducer` 简化 Reducer

由于“查找表”的办法很流行，于是 Redux 工具包就包含了一个类似于 Redux 文档中所展示的 `createReducer` 函数。但是，我们的 `createReducer` 因其更具特殊“魔法”的效果而使它更好。它内置地使用了 [Immer](https://github.com/mweststrate/immer) 库，能让你“改变”了某些数据的代码实际上是在不变地应用更新。这使得不可能意外地改变 reducer 里的 state。

通常，任何使用 `switch` 语句的 Redux reducer 都可以直接转换为使用 `createReducer`。每个 switch 里的 `case` 会变成传递给 `createReducer` 的对象的 key 。Immutable 的更新逻辑（例如展开对象或者复制数组）能直接转换为 "mutation"。也可以保持 immutable 更新原样，并返回更新后的副本。

这里是一些些如何使用 `createReducer` 的例子。我们将从典型的运用了 switch 语句和 immutable 更新的 “todo list” reducer 开始：

```js
function todosReducer(state = [], action) {
  switch (action.type) {
    case 'ADD_TODO': {
      return state.concat(action.payload)
    }
    case 'TOGGLE_TODO': {
      const { index } = action.payload
      return state.map((todo, i) => {
        if (i !== index) return todo

        return {
          ...todo,
          completed: !todo.completed
        }
      })
    }
    case 'REMOVE_TODO': {
      return state.filter((todo, i) => i !== action.payload.index)
    }
    default:
      return state
  }
}
```

注意，我们特意调用 `state.concat()` 来返回带有新 todo 事项的复制数组，在 toggle 的情况下中调用 `state.map()` 以返回复制数组，并使用对象展开运算符复制需要更新的 todo 。

我们可以用 `createReducer` 大大简化这个例子：

```js
const todosReducer = createReducer([], {
  ADD_TODO: (state, action) => {
    // "mutate" the array by calling push()
    state.push(action.payload)
  },
  TOGGLE_TODO: (state, action) => {
    const todo = state[action.payload.index]
    // "mutate" the object by overwriting a field
    todo.completed = !todo.completed
  },
  REMOVE_TODO: (state, action) => {
    // Can still return an immutably-updated value if we want to
    return state.filter((todo, i) => i !== action.payload.index)
  }
})
```

尝试更新深层嵌套的 state 时，"mutate" state 的能力显得非常重要。这是一段复杂又痛苦的代码：

```js
case "UPDATE_VALUE":
  return {
    ...state,
    first: {
      ...state.first,
      second: {
        ...state.first.second,
        [action.someId]: {
          ...state.first.second[action.someId],
          fourth: action.someValue
        }
      }
    }
  }
```

可以简化为这样：

```js
updateValue(state, action) {
    const {someId, someValue} = action.payload;
    state.first.second[someId].fourth = someValue;
}
```

好多了！

### 定义对象中的函数

在现代 JavaScript 中，有几种合法的方法在对象中定义键和函数（这点并不特定于 Redux），并且你可以混合和搭配不同键定义和函数定义。例如，以下是在对象中定义函数的所有合法的方法：

```js
const keyName = "ADD_TODO4";

const reducerObject = {
	// Explicit quotes for the key name, arrow function for the reducer
	"ADD_TODO1" : (state, action) => { }

	// Bare key with no quotes, function keyword
	ADD_TODO2 : function(state, action){  }

	// Object literal function shorthand
	ADD_TODO3(state, action) { }

	// Computed property
	[keyName] : (state, action) => { }
}
```

使用 ["对象字面函数简写"](https://www.sitepoint.com/es6-enhanced-object-literals/) 可能是最短的代码，但你可以随意使用任意一种写法。

### 使用 `createReducer` 的注意事项

尽管 Redux 工具包的 createReducer 函数确实很有帮助，但请记住：

- “mutative” 代码仅在 `createReducer` 函数内部正常工作
- Immer 不会让您混合“改变”草稿状态并返回新的状态值

更多详情请参照 [`createReducer` API 参考](../api/createReducer.mdx)。

## 编写 Action Creators

Redux 鼓励你 [编写 “action creator” 函数](https://blog.isquaredsoftware.com/2016/10/idiomatic-redux-why-use-action-creators/) 以封装 action 对象的创建过程。尽管并非严格要求，但这是 Redux 使用的标准部分。

大部分 action creator 是非常简单的。它们带有一些参数，并且返回一个包含了特定 `type` 字段以及 action 内部参数的 action 对象。这些参数通常被放在一个称为 `payload` 的字段里，该字段是 [Flux 标准 Action](https://github.com/redux-utilities/flux-standard-action) 约定的一部分，用来组织 action 对象的内容。典型的 action creator 可能是这样的：

```js
function addTodo(text) {
  return {
    type: 'ADD_TODO',
    payload: { text }
  }
}
```

### 使用 `createAction` 定义 Action Creators

手写 action creator 可能会很乏味。Redux 工具包提供了一个名为 `createAction` 的函数，它仅生成一个使用给定的 action type 的 action creator，并将参数转换为 `payload` 字段。

```js
const addTodo = createAction('ADD_TODO')
addTodo({ text: 'Buy milk' })
// {type : "ADD_TODO", payload : {text : "Buy milk"}})
```

`createAction` 还接受一个 "prepare callback" 的参数，它允许你自定义结果 `payload` 字段并可选地添加一个 `meta` 字段。 想要了解带有 prepare callback 定义 action creator 的详细信息，请参阅[`createAction` API 参考](../api/createAction.mdx#using-prepare-callbacks-to-customize-action-contents)。

### 使用 Action Creators 作为 Action Types

Redux reducer 需要寻找特定的 action type 来确定如何更新其状态。通常，这是通过分别定义 action type 字符串和 action creator 函数来完成的。Redux 工具包的 `createAction` 函数使用了一些技巧来简化此过程。

首先，`createAction` 会覆盖它生成的 action creator 的 `toString()` 方法。**这意味着 action creator 本身可以在某些地方用作 "action type" 引用**，比如提供给 `createReducer` 的键。

其次，action type 还被定义为 action creator 的 `type` 字段。

```js
const actionCreator = createAction("SOME_ACTION_TYPE");

console.log(actionCreator.toString())
// "SOME_ACTION_TYPE"

console.log(actionCreator.type);
// "SOME_ACTION_TYPE"

const reducer = createReducer({}, {
    // actionCreator.toString() will automatically be called here
    [actionCreator] : (state, action) => {}

    // Or, you can reference the .type field:
    [actionCreator.type] : (state, action) => { }
});
```

这意味着你不必编写或使用单独的 action type 变量，或者是重复 action type 的 name 和 value，例如 `const SOME_ACTION_TYPE = "SOME_ACTION_TYPE"`。

不幸的是，switch 语句不会隐式转化为字符串。如果要在 switch 语句中使用某个 action creator，你需要自行调用 `actionCreator.toString()`：

```js
const actionCreator = createAction('SOME_ACTION_TYPE')

const reducer = (state = {}, action) => {
  switch (action.type) {
    // ERROR: this won't work correctly!
    case actionCreator: {
      break
    }
    // CORRECT: this will work as expected
    case actionCreator.toString(): {
      break
    }
    // CORRECT: this will also work right
    case actionCreator.type: {
      break
    }
  }
}
```

如果你将 Redux 工具包和 TypeScript 一起使用，请注意，将 action creator 作为 object 的 key 时，TypeScript 编译器可能不接受隐式的 `toString()` 转换。

## 创建 State 分片

Redux state 通常组织为 “分片（slice）”, 由传递给 `combineReducers` 的 reducer 定义:

```js
import { combineReducers } from 'redux'
import usersReducer from './usersReducer'
import postsReducer from './postsReducer'

const rootReducer = combineReducers({
  users: usersReducer,
  posts: postsReducer
})
```

在这个例子中，`users` 和 `posts` 都会被视为 “分片”，这两个 reducer：

- “拥有”状态，包括初始值
- 定义状态如何更新
- 定义了哪些 action 将导致状态更新

通常，分片的 reducer 函数是在自己的文件中定义的，并在其他文件中定义 action creator。由于两个函数都需要引用相同的 action type，因此通常会定义第三个文件中定义它们，然后在前面所说的两个地方中引用：

```js
// postsConstants.js
const CREATE_POST = 'CREATE_POST'
const UPDATE_POST = 'UPDATE_POST'
const DELETE_POST = 'DELETE_POST'

// postsActions.js
import { CREATE_POST, UPDATE_POST, DELETE_POST } from './postConstants'

export function addPost(id, title) {
  return {
    type: CREATE_POST,
    payload: { id, title }
  }
}

// postsReducer.js
import { CREATE_POST, UPDATE_POST, DELETE_POST } from './postConstants'

const initialState = []

export default function postsReducer(state = initialState, action) {
  switch (action.type) {
    case CREATE_POST: {
      // omit implementation
    }
    default:
      return state
  }
}
```

这里唯一真正必要的部分是 reducer 本身。考虑其他部分：

- 我们可以在两个地方都将 action type 编写为内联字符串。
- Action creator 很好，但是使用 Redux 不是必需的——一个组件可以跳过向 `connect` 提供 `mapDispatch` 参数，而只需要自行调用 `this.props.dispatch({type : "CREATE_POST", payload : {id : 123, title : "Hello World"}})`。
- 我们要编写多个文件的唯一原因，是按其功能拆分代码是很常见的。

```js
// postsDuck.js
const CREATE_POST = 'CREATE_POST'
const UPDATE_POST = 'UPDATE_POST'
const DELETE_POST = 'DELETE_POST'

export function addPost(id, title) {
  return {
    type: CREATE_POST,
    payload: { id, title }
  }
}

const initialState = []

export default function postsReducer(state = initialState, action) {
  switch (action.type) {
    case CREATE_POST: {
      // Omit actual code
      break
    }
    default:
      return state
  }
}
```

这简化了事情，因为我们不需要多个文件，并且可以删掉 action type 常量的多余引入。但是我们仍须手动编写 action type 和 action creator。

### 使用 `createSlice` 简化分片

为了简化此过程，Redux 工具包包含一个 `createSlice` 函数，该函数可以基于你提供的 reducer 函数名自动化生成 action type 和 action creator。

这里是一个使用 `createSlice` 的 posts 的例子：

```js
const postsSlice = createSlice({
  name: 'posts',
  initialState: [],
  reducers: {
    createPost(state, action) {},
    updatePost(state, action) {},
    deletePost(state, action) {}
  }
})

console.log(postsSlice)
/*
{
    name: 'posts',
    actions : {
        createPost,
        updatePost,
        deletePost,
    },
    reducer
}
*/

const { createPost } = postsSlice.actions

console.log(createPost({ id: 123, title: 'Hello World' }))
// {type : "posts/createPost", payload : {id : 123, title : "Hello World"}}
```

`createSlice` 会查看 `reducers` 字段中定义的所有函数，并为提供的每个 "case reducer" 函数生成一个 action creator，该 action creator 会将 reducer 的名称作为 action type 本身。

```js
const postsSlice = createSlice({
  name: 'posts',
  initialState: [],
  reducers: {
    createPost(state, action) {},
    updatePost(state, action) {},
    deletePost(state, action) {}
  }
})

const { createPost } = postsSlice.actions

console.log(createPost({ id: 123, title: 'Hello World' }))
// {type : "posts/createPost", payload : {id : 123, title : "Hello World"}}
```

### 导出和使用分片

大多数时候，你会需要定义一个分片，并导出其 action creator 和 reducer。推荐的作法是使用ES6解构和导出语法：

```js
const postsSlice = createSlice({
  name: 'posts',
  initialState: [],
  reducers: {
    createPost(state, action) {},
    updatePost(state, action) {},
    deletePost(state, action) {}
  }
})

// Extract the action creators object and the reducer
const { actions, reducer } = postsSlice
// Extract and export each action creator by name
export const { createPost, updatePost, deletePost } = actions
// Export the reducer, either as a default or named export
export default reducer
```

如果愿意，你也可以直接导出分片对象本身。

以这种方式定义的分片，在概念上与用于定义和导出 action creator 和 reducer 的 ["Redux Ducks" 模式](https://github.com/erikras/ducks-modular-redux)非常相似。但是，在导入和导出分片时，需要注意几个潜在的缺点。

首先，**Redux action type 并不意味着单个分片是排他的**。从概念上说，每个分片 reducer “拥有”自己的 Redux 状态，但是它应该能够监听任何 action type 并适当地更新其状态。例如，许多不同的分片可能会希望通过清除数据或者重置到初始状态值来响应“用户注销”的操作。在设置 state 形态和创建分片的时候，请留意这一点。

其次，**JS 模块在两个模块相互引用的时候可能有“循环引用”的问题**。这可能会导致引入 undefined，很可能使那些需要导入的代码崩溃。特别是在“鸭子”或者分片的情况下，如果在两个不同的文件中定义的分片都希望响应另一个文件中定义的 action，则这种情况就会发生。

这个 CodeSandbox 示例演示了这个问题：

<iframe src="https://codesandbox.io/embed/rw7ppj4z0m" style={{ width: '100%', height: '500px', border: 0, borderRadius: '4px', overflow: 'hidden' }} sandbox="allow-modals allow-forms allow-popups allow-scripts allow-same-origin"></iframe>

如果遇到这种情况，则需要以避免循环引用的方式重构代码。这通常需要将共享代码提取到一个单独的通用文件中，两个模块均可以引入和使用。在这种情况下，你可以在单独的文件中用 `createAction` 定义一些常用的 action type，将这些 action creator 引入到每个分片文件中，并用 `extraReducers` 参数进行处理。

[JS里如何解决循环依赖的问题](https://medium.com/visual-development/how-to-fix-nasty-circular-dependency-issues-once-and-for-all-in-javascript-typescript-a04c987cf0de)包含其他信息及示例可以帮助解决此问题。

## 异步逻辑和数据获取

### 使用 middleware 启用异步逻辑

就其本身而言，Redux store 对于异步逻辑一无所知。它仅知道如何同步调度 action，如何调用 root reducer 函数来更新状态，以及如何通知 UI 某些改变。任何异步都必须在 store 外部发生。

但是，如果要让异步逻辑通过派发或者检查当前 store 状态与 store 交互呢？这就是 [Redux middleware](https://redux.js.org/advanced/middleware) 的用处。它们拓展了 store，允许你：

- 派发任何 action 时执行额外的逻辑（比如记录 action 和状态）
- 暂停，更改，延迟，替换，或者停止派发 action
- 编写可以访问 `dispatch` 和 `getState` 的额外代码
- 通过截取并派发真实的 action 对象，教 `dispatch` 如何接受普通 action 对象以外的其他值（比如函数和 promise）

[使用 middleware 最常见的原因是允许不同类型的异步逻辑与 store 进行交互](https://redux.js.org/faq/actions#how-can-i-represent-side-effects-such-as-ajax-calls-why-do-we-need-things-like-action-creators-thunks-and-middleware-to-do-async-behavior)。这允许你可以编写可派发 action 并且检查 store 状态的代码，同时保持逻辑与UI分离。

Redux 有多种异步 middleware，每种 middleware 都可以让你以不同的语法编写逻辑。最常见的异步 middleware 是：

- [`redux-thunk`](https://github.com/reduxjs/redux-thunk)，让你能直接编写包含异步逻辑的简单函数
- [`redux-saga`](https://github.com/redux-saga/redux-saga)，使用 generator 函数返回行为描述，以便可以由 middleware 执行
- [`redux-observable`](https://github.com/redux-observable/redux-observable/)，它使用 RxJS observable 库来创建处理 action 的函数链

[这些库都有不同的用例和权衡](https://redux.js.org/faq/actions#what-async-middleware-should-i-use-how-do-you-decide-between-thunks-sagas-observables-or-something-else).

**我们建议 [使用 Redux Thunk middleware 作为标准方法](https://github.com/reduxjs/redux-thunk)**，因为它能满足大多典型用例（比如基础 AJAX 数据获取）。另外，thunk 所使用的 `async/await` 语法使其更易于阅读。

**Redux 工具包的 `configureStore` 函数[默认情况下会自动设置 thunk middleware](../api/getDefaultMiddleware.mdx)**，因此你可以立即开始将 thunk 编写为应用代码的一部分。

### 在分片中定义异步逻辑

Redux 工具包当前不提供任何特殊的 API 或语法来编写 thunk 函数。 特别是, **不能将它们定义为 `createSlice()` 调用的一部分**。您必须将它们与 reducer 逻辑分开编写，与使用普通 Redux 代码完全相同。

Thunk 通常会派发普通 action，比如 `dispatch(dataLoaded(response.data))`。

许多 Redux 应用都使用“按照类型分文件夹”的方法组织其代码。在这种结构下，通常在 "action" 文件中与普通 action creator 一起定义 thunk action creator。

因为我们没有单独的 "action" 文件，**所以将这些 thunk 直接编写在“分片”文件中是有意义的**。这样，他们就可以从分片中访问简单的 action creator，并且能够很容易地找到 thunk 函数所在位置。

典型的包含 thunk 的分片文件是这样的：

```js
// First, define the reducer and action creators via `createSlice`
const usersSlice = createSlice({
  name: 'users',
  initialState: {
    loading: 'idle',
    users: []
  },
  reducers: {
    usersLoading(state, action) {
      // Use a "state machine" approach for loading state instead of booleans
      if (state.loading === 'idle') {
        state.loading = 'pending'
      }
    },
    usersReceived(state, action) {
      if (state.loading === 'pending') {
        state.loading = 'idle'
        state.users = action.payload
      }
    }
  }
})

// Destructure and export the plain action creators
export const { usersLoading, usersReceived } = usersSlice.actions

// Define a thunk that dispatches those action creators
const fetchUsers = () => async dispatch => {
  dispatch(usersLoading())
  const response = await usersAPI.fetchAll()
  dispatch(usersReceived(response.data))
}
```

### Redux 数据获取模式

Redux 的数据获取逻辑通常遵循可预测的模式：

- 在请求之前派发 "start" action，以指示请求正在进行。可用于追踪加载中状态，以允许跳过重复的请求或者在UI上显示加载中的指示符。
- 发出异步请求
- 根据请求结果，异步逻辑会派发包含成结果数据的“成功” action 或者是包含了错误详情的“失败” action。在两种情况下，reducer 逻辑都会清除加载中状态，处理请求成功时的结果数据或者为潜在显示存储错误值。

这些步骤不是必需的，但[在 Redux 教程中推荐将它们作为建议的模式](https://redux.js.org/advanced/async-actions)。

典型的实现可能如下所示：

```js
const getRepoDetailsStarted = () => ({
  type: "repoDetails/fetchStarted"
})
const getRepoDetailsSuccess = (repoDetails) => {
  type: "repoDetails/fetchSucceeded",
  payload: repoDetails
}
const getRepoDetailsFailed = (error) => {
  type: "repoDetails/fetchFailed",
  error
}
const fetchIssuesCount = (org, repo) => async dispatch => {
  dispatch(getRepoDetailsStarted())
  try {
    const repoDetails = await getRepoDetails(org, repo)
    dispatch(getRepoDetailsSuccess(repoDetails))
  } catch (err) {
    dispatch(getRepoDetailsFailed(err.toString()))
  }
}
```

但是，用这种方法编写代码很繁琐。每个单独的请求类型需要重复类似的实现：

- 三种不同的情况下都需要定义各不相同的 action type
- 这些 action type 通常都具有相应的 action creator 函数
- 必须编写一个 thunk，以正确的顺序派发正确的 action

`createAsyncThunk` 通过生成 action type 和 action creator 并生成派发这些 action 的 thunk 来抽象该模式。

### 使用 `createAsyncThunk` 的异步请求

作为开发者，你可能最关心发出API请求所需的实际逻辑，Redux action 历史记录中显示哪些 action type 名称以及 reducer 如何处理获取到的数据。

`createAsyncThunk` 简化了这一过程——你只需要提供一个用作 action type 前缀的字符串和一个 payload creator 回调即可，该回调执行实际的异步逻辑并返回包含结果的 promise。作为回报，`createAsyncThunk` 将会为你提供一个 thunk，它将根据你返回的 promise 以及你可以在 reducer 中处理的 action type 来调度正确的 action。

```js {5-11,22-25,30}
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { userAPI } from './userAPI'

// First, create the thunk
const fetchUserById = createAsyncThunk(
  'users/fetchByIdStatus',
  async (userId, thunkAPI) => {
    const response = await userAPI.fetchById(userId)
    return response.data
  }
)

// Then, handle actions in your reducers:
const usersSlice = createSlice({
  name: 'users',
  initialState: { entities: [], loading: 'idle' },
  reducers: {
    // standard reducer logic, with auto-generated action types per reducer
  },
  extraReducers: {
    // Add reducers for additional action types here, and handle loading state as needed
    [fetchUserById.fulfilled]: (state, action) => {
      // Add user to the state array
      state.entities.push(action.payload)
    }
  }
})

// Later, dispatch the thunk as needed in the app
dispatch(fetchUserById(123))
```

Thunk action creator 接受一个参数，它将作为第一个参数被传递给你的 payload creator 回调。

Payload creator 还会接收一个 `thunkAPI` 对象，其中包含通常会传递给标准 Redux thunk 函数的参数，以及自动生成的唯一随机请求ID字符串和一个 [`AbortController.signal` 对象](https://developer.mozilla.org/en-US/docs/Web/API/AbortController/signal)：

```ts
interface ThunkAPI {
  dispatch: Function
  getState: Function
  extra?: any
  requestId: string
  signal: AbortSignal
}
```

你可以根据需要使用 payload 回调中的任意一个来确定最终结果是什么。

## 管理规范化数据

大多数应用通常要处理深层嵌套或相关的数据。标准化数据的目的是为了有效地组织 state 中的数据。通常，这是通过使用 `id` 的键将集合存储为对象，同时存储这些 `ids` 的排序数组来完成的。有关更深入的解释和更多示例，[Redux 文档中“规范化 State 形态”页面](https://redux.js.org/recipes/structuring-reducers/normalizing-state-shape)上有很好的参考。

### 手动规范化

规范化数据不需要任何特殊的库。这是一个基本示例，说明如何使用一些手写的逻辑规范化来自 `fetchAll` API 请求的响应，该请求以 `{ users: [{id: 1, first_name: 'normalized', last_name: 'person'}] }` 返回数据：

```js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import userAPI from './userAPI'

export const fetchUsers = createAsyncThunk('users/fetchAll', async () => {
  const response = await userAPI.fetchAll()
  return response.data
})

export const slice = createSlice({
  name: 'users',
  initialState: {
    ids: [],
    entities: {}
  },
  reducers: {},
  extraReducers: builder => {
    builder.addCase(fetchUsers.fulfilled, (state, action) => {
      // reduce the collection by the id property into a shape of { 1: { ...user }}
      const byId = action.payload.users.reduce((byId, user) => {
        byId[user.id] = user
        return byId
      }, {})
      state.entities = byId
      state.ids = Object.keys(byId)
    })
  }
})
```

尽管我们有能力编写这些代码，但是它确实具有重复性，特别是在处理多种类型数据时。另外，这个例子只是处理了将 entry 加载到 state ，而没有更新它们。

### 使用 `normalizr` 规范化

[`normalizr`](https://github.com/paularmstrong/normalizr) 是一个用于规范化数据的受欢迎的现有库。你可以在没有 Redux 的情况下单独使用它，但是在 Redux 非常常用。典型的用法是格式化 API 响应数据，然后在 reducer 中进行处理。

```js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { normalize, schema } from 'normalizr'

import userAPI from './userAPI'

const userEntity = new schema.Entity('users')

export const fetchUsers = createAsyncThunk('users/fetchAll', async () => {
  const response = await userAPI.fetchAll()
  // Normalize the data before passing it to our reducer
  const normalized = normalize(response.data, [userEntity])
  return normalized.entities
})

export const slice = createSlice({
  name: 'users',
  initialState: {
    ids: [],
    entities: {}
  },
  reducers: {},
  extraReducers: builder => {
    builder.addCase(fetchUsers.fulfilled, (state, action) => {
      state.entities = action.payload.users
      state.ids = Object.keys(action.payload.users)
    })
  }
})
```

与手写版本一样，它并不会处理向 state 中添加其他 entry 或是稍后对其更新的过程——它只是加载收到的所有内容。

### 使用 `createEntityAdapter` 规范化

Redux 工具包的 `createEntityAdapter` API 提供了一种标准化的方式，可以通过获取集合并将其设置为 `{ ids: [], entities: {} }` 的形式，将数据存储在分片中。连同此预定义的 state 形态，它生成了一组知道如何处理数据的 reducer 函数和选择器。

```js
import {
  createSlice,
  createAsyncThunk,
  createEntityAdapter
} from '@reduxjs/toolkit'
import userAPI from './userAPI'

export const fetchUsers = createAsyncThunk('users/fetchAll', async () => {
  const response = await userAPI.fetchAll()
  // In this case, `response.data` would be:
  // [{id: 1, first_name: 'Example', last_name: 'User'}]
  return response.data
})

export const updateUser = createAsyncThunk('users/updateOne', async arg => {
  const response = await userAPI.updateUser(arg)
  // In this case, `response.data` would be:
  // { id: 1, first_name: 'Example', last_name: 'UpdatedLastName'}
  return response.data
})

export const usersAdapter = createEntityAdapter()

// By default, `createEntityAdapter` gives you `{ ids: [], entities: {} }`.
// If you want to track 'loading' or other keys, you would initialize them here:
// `getInitialState({ loading: false, activeRequestId: null })`
const initialState = usersAdapter.getInitialState()

export const slice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    removeUser: usersAdapter.removeOne
  },
  extraReducers: builder => {
    builder.addCase(fetchUsers.fulfilled, usersAdapter.upsertMany)
    builder.addCase(updateUser.fulfilled, (state, { payload }) => {
      const { id, ...changes } = payload
      usersAdapter.updateOne(state, { id, changes })
    })
  }
})

const reducer = slice.reducer
export default reducer

export const { removeUser } = slice.actions
```

你可以[在 CodeSandbox 中查看完整的使用示例](https://codesandbox.io/s/rtk-entities-basic-example-1xubt)。

### 将 `createEntityAdapter` 和规范化库一起使用

如果你已经使用 `normalizr` 或其他规范化库，则可以考虑将其与 `createEntityAdapter` 一起使用。为了扩展上述示例，这里展示了如何使用 `normalizr` 格式化 payload，然后利用 `createEntityAdapter` 提供的实用程序。

默认情况下，`setAll` ，`addMany` 和 `upsertMany` CRUD 方法需要一个 entry 数组。不过，它们还允许传入呈 `{ 1: { id: 1, ... }}` 形式的对象作为替代，这样可以更简单地插入预规范化数据。

```js
// features/articles/articlesSlice.js
import {
  createSlice,
  createEntityAdapter,
  createAsyncThunk,
  createSelector
} from '@reduxjs/toolkit'
import fakeAPI from '../../services/fakeAPI'
import { normalize, schema } from 'normalizr'

// Define normalizr entity schemas
export const userEntity = new schema.Entity('users')
export const commentEntity = new schema.Entity('comments', {
  commenter: userEntity
})
export const articleEntity = new schema.Entity('articles', {
  author: userEntity,
  comments: [commentEntity]
})

const articlesAdapter = createEntityAdapter()

export const fetchArticle = createAsyncThunk(
  'articles/fetchArticle',
  async id => {
    const data = await fakeAPI.articles.show(id)
    // Normalize the data so reducers can load a predictable payload, like:
    // `action.payload = { users: {}, articles: {}, comments: {} }`
    const normalized = normalize(data, articleEntity)
    return normalized.entities
  }
)

export const slice = createSlice({
  name: 'articles',
  initialState: articlesAdapter.getInitialState(),
  reducers: {},
  extraReducers: {
    [fetchArticle.fulfilled]: (state, action) => {
      // Handle the fetch result by inserting the articles here
      articlesAdapter.upsertMany(state, action.payload.articles)
    }
  }
})

const reducer = slice.reducer
export default reducer

// features/users/usersSlice.js

import { createSlice, createEntityAdapter } from '@reduxjs/toolkit'
import { fetchArticle } from '../articles/articlesSlice'

const usersAdapter = createEntityAdapter()

export const slice = createSlice({
  name: 'users',
  initialState: usersAdapter.getInitialState(),
  reducers: {},
  extraReducers: builder => {
    builder.addCase(fetchArticle.fulfilled, (state, action) => {
      // And handle the same fetch result by inserting the users here
      usersAdapter.upsertMany(state, action.payload.users)
    })
  }
})

const reducer = slice.reducer
export default reducer

// features/comments/commentsSlice.js

import { createSlice, createEntityAdapter } from '@reduxjs/toolkit'
import { fetchArticle } from '../articles/articlesSlice'

const commentsAdapter = createEntityAdapter()

export const slice = createSlice({
  name: 'comments',
  initialState: commentsAdapter.getInitialState(),
  reducers: {},
  extraReducers: {
    [fetchArticle.fulfilled]: (state, action) => {
      // Same for the comments
      commentsAdapter.upsertMany(state, action.payload.comments)
    }
  }
})

const reducer = slice.reducer
export default reducer
```

你可以[在 CodeSandbox 查看 `normalizr` 使用示例的完整代码](https://codesandbox.io/s/rtk-entities-basic-example-with-normalizr-bm3ie)。

### 将选择器与 `createEntityAdapter` 一起使用

Entity adapter 提供了 selector factory 可为你生成最常用的 selector。以上面的例子为例，我们可以将添加 selector 到 `usersSlice`，如下所示：

```js
// Rename the exports for readability in component usage
export const {
  selectById: selectUserById,
  selectIds: selectUserIds,
  selectEntities: selectUserEntities,
  selectAll: selectAllUsers,
  selectTotal: selectTotalUsers
} = usersAdapter.getSelectors(state => state.users)
```

然后，你可以在组件里使用这些 selector，如下所示：

```js
import React from 'react'
import { useSelector } from 'react-redux'
import { selectTotalUsers, selectAllUsers } from './usersSlice'

import styles from './UsersList.module.css'

export function UsersList() {
  const count = useSelector(selectTotalUsers)
  const users = useSelector(selectAllUsers)

  return (
    <div>
      <div className={styles.row}>
        There are <span className={styles.value}>{count}</span> users.{' '}
        {count === 0 && `Why don't you fetch some more?`}
      </div>
      {users.map(user => (
        <div key={user.id}>
          <div>{`${user.first_name} ${user.last_name}`}</div>
        </div>
      ))}
    </div>
  )
}
```

### 指定备用 ID 字段

默认情况下，`createEntityAdapter` 假设你的数据在 `entity.id` 字段中具有唯一的ID。如果你的数据集将其ID存储在其他字段中，则可以传入 `selectId` 参数，以返回适当的字段。

```js
// In this instance, our user data always has a primary key of `idx`
const userData = {
  users: [
    { idx: 1, first_name: 'Test' },
    { idx: 2, first_name: 'Two' }
  ]
}

// Since our primary key is `idx` and not `id`,
// pass in an ID selector to return that field instead
export const usersAdapter = createEntityAdapter({
  selectId: user => user.idx
})
```

### Entities 排序

`createEntityAdapter` 提供了一个 `sortComparer` 参数，你可以利用该参数对 state 中的 `ids` 集合进行排序。当你要保证顺序并且数据没有预排序时，这可能会非常有用。

```js
// In this instance, our user data always has a primary key of `idx`
const userData = {
  users: [
    { id: 1, first_name: 'Test' },
    { id: 2, first_name: 'Banana' }
  ]
}

// Sort by `first_name`. `state.ids` would be ordered as
// `ids: [ 2, 1 ]`, since 'B' comes before 'T'.
// When using the provided `selectAll` selector, the result would be sorted:
// [{ id: 2, first_name: 'Banana' }, { id: 1, first_name: 'Test' }]
export const usersAdapter = createEntityAdapter({
  sortComparer: (a, b) => a.first_name.localeCompare(b.first_name)
})
```

## 处理不可序列化的数据

Redux 的核心使用原则之一是[你不应该在 state 或者 action 中放置不可序列化的值](https://redux.js.org/style-guide/style-guide#do-not-put-non-serializable-values-in-state-or-actions)。

不过，像大多数规则一样，也有例外。在某些情况下，你必须处理需要接受非序列化数据的 action。只有在很少的时候必要时才这样做，并且这些不可序列化的 payload 永远不要通过 reducer 传入你应用的 state。

[可序列化的开发者检查 middleware](../api/getDefaultMiddleware.mdx) 将在任何时候检测到你的 action 或 state 中有不可序列化的值时自动发出警告。我们鼓励你将该 middleware 设置为可用，以帮助你避免意外地犯错误。但是，如果 _确实_ 需要关闭这些警告，你可以通过配置 middleware 去忽略特定的 action type，或者 action 和 state 中的字段来定制 middleware：

```js
configureStore({
  //...
  middleware: getDefaultMiddleware({
    serializableCheck: {
      // Ignore these action types
      ignoredActions: ['your/action/type'],
      // Ignore these field paths in all actions
      ignoredActionPaths: ['meta.arg', 'payload.timestamp'],
      // Ignore these paths in the state
      ignoredPaths: ['items.dates']
    }
  })
})
```

### 使用 Redux-Persist

如果使用 Redux-Persist，你需要特定地忽略它 dispatch 的所有 action type：

```jsx
import { configureStore, getDefaultMiddleware } from '@reduxjs/toolkit'
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER
} from 'redux-persist'
import storage from 'redux-persist/lib/storage'
import { PersistGate } from 'redux-persist/integration/react'

import App from './App'
import rootReducer from './reducers'

const persistConfig = {
  key: 'root',
  version: 1,
  storage
}

const persistedReducer = persistReducer(persistConfig, rootReducer)

const store = configureStore({
  reducer: persistedReducer,
  middleware: getDefaultMiddleware({
    serializableCheck: {
      ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER]
    }
  })
})

let persistor = persistStore(store)

ReactDOM.render(
  <Provider store={store}>
    <PersistGate loading={null} persistor={persistor}>
      <App />
    </PersistGate>
  </Provider>,
  document.getElementById('root')
)
```

更多讨论可查看 [Redux 工具包 #121: 如何使用 Redux-Persist?](https://github.com/reduxjs/redux-toolkit/issues/121) 和 [Redux-Persist #988: 不可序列化值错误](https://github.com/rt2zz/redux-persist/issues/988#issuecomment-552242978)。

### 使用 React-Redux-Firebase

3.x 版本中，RRF在大多数 action 和 state 中包含时间戳值，但是从 4.x 版本开始，有些 PR 可以改善这一行为。

与该行为配合使用的可能的配置如下所示：

```ts
import { configureStore, getDefaultMiddleware } from '@reduxjs/toolkit'
import {
  getFirebase,
  actionTypes as rrfActionTypes
} from 'react-redux-firebase'
import { constants as rfConstants } from 'redux-firestore'
import rootReducer from './rootReducer'

const extraArgument = {
  getFirebase
}

const middleware = [
  ...getDefaultMiddleware({
    serializableCheck: {
      ignoredActions: [
        // just ignore every redux-firebase and react-redux-firebase action type
        ...Object.keys(rfConstants.actionTypes).map(
          type => `${rfConstants.actionsPrefix}/${type}`
        ),
        ...Object.keys(rrfActionTypes).map(
          type => `@@reactReduxFirebase/${type}`
        )
      ],
      ignoredPaths: ['firebase', 'firestore']
    },
    thunk: {
      extraArgument
    }
  })
]

const store = configureStore({
  reducer: rootReducer,
  middleware
})

export default store
```
