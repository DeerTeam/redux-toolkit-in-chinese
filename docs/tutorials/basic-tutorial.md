---
id: basic-tutorial
title: 基础教程
sidebar_label: 基础教程
hide_title: true
---

# 基础教程: 介绍 Redux 工具包

欢迎使用 Redux 工具包 ！这个教程将为你展示 Redux 工具包（也可以简称 RTK） 所包含的基础功能。

本教程需要你已经熟悉了 Redux 库的基本概念，也就是你已经可以配合 React 使用 Redux 了。如果你还不熟悉，你可以先花点时间阅读一下 [Redux 文档](https://redux.js.org) and [React-Redux 文档](https://react-redux.js.org) 。在这里主要聚焦于 Redux 工具包 与传统的 Redux 代码在用法上的不同点。

## 介绍：编写一个计数应用

接下来开始看一个最简单的 Redux 例子：一个简单的计数器应用

### Redux "纯计数器" 示例

在 Redux 的文档中有一个 ["纯计数器" 示例](https://redux.js.org/introduction/examples#counter-vanilla) ，展示了如何配合 reducer 去创建一个用于存储单个数字及响应 `"INCREMENT"` 和 `"DECREMENT"` action 类型的简单的 Redux store。你可以查看 [在 CodeSandbox 的完整代码](https://codesandbox.io/s/github/reduxjs/redux/tree/master/examples/counter-vanilla)，下面展示的是重要的代码片段：

```js
function counter(state, action) {
  if (typeof state === 'undefined') {
    return 0
  }

  switch (action.type) {
    case 'INCREMENT':
      return state + 1
    case 'DECREMENT':
      return state - 1
    default:
      return state
  }
}

var store = Redux.createStore(counter)

document.getElementById('increment').addEventListener('click', function() {
  store.dispatch({ type: 'INCREMENT' })
})
```

代码片段表示创建了一个叫 `counter` 的 reducer 函数，首先确保它默认的状态值是 `0`，接着根据 action 类型监听 `"INCREMENT"` 和 `"DECREMENT"` ，最后在点击按钮时发起了 `"INCREMENT"` action 类型。

### 一个更典型的计数器示例

尽管这个例子挺简单，但是它在真实场景中不一定这么实现。大多数的 Redux 应用都是使用 ES6 的语法来写的，因此函数的参数默认值是 undefined 。最常见的做法是编写 ["action creator" 函数](https://redux.js.org/basics/actions#action-creators) 而不是直接在代码中编写 action 对象；编写整个 action 类型作为常量而不是每次都是纯字符串。

让我们使用这样的实现方式，重写一下上面的那个例子，看看会是什么样：

```js
const INCREMENT = 'INCREMENT'
const DECREMENT = 'DECREMENT'

function increment() {
  return { type: INCREMENT }
}

function decrement() {
  return { type: DECREMENT }
}

function counter(state = 0, action) {
  switch (action.type) {
    case INCREMENT:
      return state + 1
    case DECREMENT:
      return state - 1
    default:
      return state
  }
}

const store = Redux.createStore(counter)

document.getElementById('increment').addEventListener('click', () => {
  store.dispatch(increment())
})
```

因为这个例子很小，表面上看起来好像没有太大的区别。在代码大小方面，通过使用默认参数，我们节省了几行代码，但是编写 action creator 函数让代码量变得更大了。而且，这里有一些重复代码。编写 `const INCREMENT = 'INCREMENT'` 看起来很傻 :) 特别是当它只在 action creator 和 reducer 两个地方用到。

此外，switch 语句让很多人困扰。如果我们能用某种查找表的方式代替它就好了。

### 介绍：`configureStore`

Redux 工具包包含了一些能够简化你的 Redux 代码的函数。我们看到的第一个函数是 [`configureStore`](../api/configureStore.mdx) 。

通常情况下，你可以调用 `createStore()` 来创建一个 Redux store ，并传入你的根 reducer 函数。Redux 工具包有一个 `configureStore()` 函数，其中覆盖了 `createStore()` 来做同样的事情，同时也设置了一些有用的开发工具给你作为 store 创建过程的一部分。

我们可以很容易的用 `configureStore` 替换现有的 `createStore` 调用。`configureStore` 接受一个具有指定字段的对象，而不是多个函数参数，因此我们需要将 reducer 函数作为一个名为 `reducer` 的字段传递：

```js
// 之前:
const store = createStore(counter)

// 之后:
const store = configureStore({
  reducer: counter
})
```

这看起来可能没太大不同。但是，在底层实现里，store 已经被配置启用，使用 [Redux 开发工具扩展](https://github.com/zalmoxisus/redux-devtools-extension) 可以看到发起 action 的历史行为以及 store 状态改变是如何改变的，并且还 [默认包含的一些 Redux 中间件](../api/getDefaultMiddleware.mdx) 。我们将在下一个教程中更详细地介绍这些内容。

### 介绍：`createAction`

接下来，我们来看一看 [`createAction`](../api/createAction.mdx).

`createAction` 接受一个 action type 字符串作为参数，并返回一个使用该 type 字符串的 action creator 函数。（我们正在创建一个 "action creator 函数"，而不是 "action 对象" - 让这个函数名看起来好像有点不正确），但它比 `createActionCreator` 更短更容易记住。因此，这两个例子是等价的:

```js
// 原本的实现: 纯手工编写 action type 和 action creator
const INCREMENT = 'INCREMENT'

function incrementOriginal() {
  return { type: INCREMENT }
}

console.log(incrementOriginal())
// {type: "INCREMENT"}

// 或者，使用 `createAction` 来生成 action creator:
const incrementNew = createAction('INCREMENT')

console.log(incrementNew())
// {type: "INCREMENT"}
```

但是如果我们需要在 reducer 中引用 action type 字符串呢？有两种方式你可以配合 `createAction` 做到这一点。第一种，action creator 的 `toString()` 方法已经被重写，而且将返回 action type 字符串。第二种，type 字符串也可以在函数里作为一个 `.type` 字段：

```js
const increment = createAction('INCREMENT')

console.log(increment.toString())
// "INCREMENT"

console.log(increment.type)
// "INCREMENT"
```

我们可以使用 `createAction` 来简化前一个计数器的例子。

```js
const increment = createAction('INCREMENT')
const decrement = createAction('DECREMENT')

function counter(state = 0, action) {
  switch (action.type) {
    case increment.type:
      return state + 1
    case decrement.type:
      return state - 1
    default:
      return state
  }
}

const store = configureStore({
  reducer: counter
})

document.getElementById('increment').addEventListener('click', () => {
  store.dispatch(increment())
})
```

这里又节省了几行代码，至少我们没有到处重复 `INCREMENT` 这个单词了。

### 介绍：`createReducer`

现在让我们来看看 reducer 函数。尽管你可以在一个 Redux reducer 中使用像 `if` 条件语句和循环这样的任何条件逻辑，最常见的实现是检查 `action.type` 字段然后为每个 action type 做特定的逻辑。一个 reducer 也将提供一个初始化的状态值，如果 action 不是它所关心的则返回现有的状态。

Redux 工具包 包含了一个 [`createReducer` 函数](../api/createReducer.mdx) ，它让使用"查找表"对象的方式编写 reducer，其中对象的每一个 key 都是一个 Redux action type 字符串，value 是 reducer 函数。我们可以直接使用它来替代现有的 `counter` 函数定义。由于我们需要使用 action type 字符串作为 key，所以我们可以使用 [ES6 object "computed property" syntax](http://javascript.info/object#computed-properties) 从 type 字符串变量来创建 key。

```js
const increment = createAction('INCREMENT')
const decrement = createAction('DECREMENT')

const counter = createReducer(0, {
  [increment.type]: state => state + 1,
  [decrement.type]: state => state - 1
})
```

或者，由于计算属性语法将在其中任何变量上调用 `toString()` ，我们可以直接使用 action creator 函数而不用 `.type` 字段：

```js
const counter = createReducer(0, {
  [increment]: state => state + 1,
  [decrement]: state => state - 1
})
```

要查看到目前为止的完整代码，请参见[在 CodeSandbox 展示了 `createAction` 和 `createReducer` 的用法](https://codesandbox.io/s/counter-vanilla-redux-toolkit-sjouq)。

### 介绍：`createSlice`

让我们回顾一下目前的计数器例子：

```js
const increment = createAction('INCREMENT')
const decrement = createAction('DECREMENT')

const counter = createReducer(0, {
  [increment]: state => state + 1,
  [decrement]: state => state - 1
})

const store = configureStore({
  reducer: counter
})

document.getElementById('increment').addEventListener('click', () => {
  store.dispatch(increment())
})
```

这样看并不糟糕，但是我们可以对其再做一次重大的修改。我们为什么还需要单独生成 action creator，或者写出那些 action type 字符串呢？这里真正重要的部分只是 reducer 函数。

这正是 [`createSlice` 函数](../api/createSlice.mdx) 的作用。它允许我们提供一个带有 reducer 函数的对象，并且它将根据我们列出的 reducer 的名称自动生成 action type 字符串和 action creator 函数。

`createSlice` 返回一个 "切片" 对象，该对象包含被生成的 reducer 函数，其作为一个名为 `reducer` 的字段，以及被生成的、放置在一个名为 `actions` 的对象中的所有 action creator 函数。

下面是使用了 `createSlice` 的计数器例子：

```js
const counterSlice = createSlice({
  name: 'counter',
  initialState: 0,
  reducers: {
    increment: state => state + 1,
    decrement: state => state - 1
  }
})

const store = configureStore({
  reducer: counterSlice.reducer
})

document.getElementById('increment').addEventListener('click', () => {
  store.dispatch(counterSlice.actions.increment())
})
```

大多数时候，你可能会想使用 ES6 的解构语法来提取 action creator 函数作为变量，也可能是 reducer:

```js
const { actions, reducer } = counterSlice
const { increment, decrement } = actions
```

## 总结

让我们来回顾一下这些函数的作用：

- `configureStore`: 像从 Redux 最初的 `createStore` 一样，创建一个 Redux store 实例， 但是接受一个命名选项对象，并自动设置 Redux DevTools 扩展
- `createAction`: 接受一个 action type 字符串，并使用该 type 返回一个使用该类型的 action creator 函数
- `createReducer`: 为 reducer 函数接受一个初始状态值和 action type 的查找表，并创建一个 reducer 来处理所有这些 action type
- `createSlice`: 接受一个初始状态和一个包含 reducer 名称和函数的查找表，并自动生成 action creator 函数、action type 字符串和一个 reducer 函数

注意，这些都没有改变 Redux 的工作方式。我们仍然在创建一个 Redux store，发起了"发生了什么"的 action 对象，并使用一个 reducer 函数返回更新后的状态。另外，请注意，无论使用什么方法来构建 UI，都可以使用 Redux 工具箱 里的函数，因为它们只处理代码的 "纯 Redux store" 部分。我们的例子使用了 "纯 JS"UI（无框架） 的 store，但是我们可以将这个 store 与 React、Angular、Vue 或任何其他 UI 层一起使用。

最后，如果你仔细看这个例子，你会看到有一个地方，我们写了一些异步逻辑 - "增量异步" 按钮:

```js
document.getElementById('incrementAsync').addEventListener('click', function() {
  setTimeout(function() {
    store.dispatch(increment())
  }, 1000)
})
```

您可以看到，我们将异步处理与 reducer 逻辑分离，并且在需要更新 store 时发起一个 action。Redux 工具包 并不会改变这一点。

下面是我们在 sandbox 中的完整示例:

<iframe src="https://codesandbox.io/embed/counter-vanilla-createslice-redux-toolkit-6gkxx?fontsize=14&hidenavigation=1&theme=dark&view=editor"
     style={{ width: '100%', height: '500px', border: 0, borderRadius: '4px', overflow: 'hidden' }} 
     title="counter-vanilla createSlice - Redux Toolkit"
     allow="geolocation; microphone; camera; midi; vr; accelerometer; gyroscope; payment; ambient-light-sensor; encrypted-media; usb"
     sandbox="allow-modals allow-forms allow-popups allow-scripts allow-same-origin"
></iframe>

现在您已经了解了每个函数的基本知识，为了了解它们是如何工作的，下一步应该尝试在一个 _稍微_ 更大的示例中使用它们。我们将在 [中级教程](./intermediate-tutorial.md) 中讨论这个问题。
