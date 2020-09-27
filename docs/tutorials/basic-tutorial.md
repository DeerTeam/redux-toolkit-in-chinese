---
id: basic-tutorial
title: 基础教程
sidebar_label: 基础教程
hide_title: true
---

# 基础教程: 介绍 Redux工具包

欢迎使用 Redux工具包 ！这个教程将为你展示 Redux工具包（也可以简称RTK） 所包含的基础功能。

本教程需要你已经熟悉了 Redux 库的基本概念，也就是你已经可以配合 React 使用 Redux 了。如果你还不熟悉，你可以先花点时间阅读一下 [Redux 文档](https://redux.js.org) and [React-Redux 文档](https://react-redux.js.org) 。在这里主要聚焦于 Redux工具包 与传统的 Redux 代码在用法上的不同点。

## 介绍: 编写一个计数应用

接下来开始看一个最简单的 Redux 例子：一个简单的计数器应用

### Redux "Counter-Vanilla" 示例

在 Redux 的文档中有一个 ["纯计数器" 示例](https://redux.js.org/introduction/examples#counter-vanilla) ，展示了如何配合 reducer 去创建一个用于存储单个数字及响应 `"INCREMENT"` 和 `"DECREMENT"` action 类型的简单的 Redux store。你可以查看 [在CodeSandbox的完整代码](https://codesandbox.io/s/github/reduxjs/redux/tree/master/examples/counter-vanilla)，下面展示的是重要的代码片段：

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

尽管这个例子挺简单，但是它在真实场景中不一定这么实现。大多数的 Redux 应用都是使用 ES6 的语法来写的，因此函数的参数默认值是 undefined 。最常见的做法是编写 ["action creator" 函数](https://redux.js.org/basics/actions#action-creators)  而不是直接在代码中编写 action 对象、编写整个 action 类型作为常量而不是每次都是纯字符串。

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

### 介绍： `configureStore`

Redux工具包包含了一些能够简化你的 Redux 代码的函数。我们看到的第一个函数是  [`configureStore`](../api/configureStore.mdx) 。

通常情况下，你可以调用 `createStore()` 来创建一个 Redux store ，并传入你的根 reducer 函数。Redux工具包有一个 `configureStore()` 函数，其中覆盖了 `createStore()` 来做同样的事情，同时也设置了一些有用的开发工具给你作为 store 创建过程的一部分。

We can easily replace the existing `createStore` call with `configureStore` instead. `configureStore` accepts a single object with named fields, instead of multiple function arguments, so we need to pass our reducer function as a field named `reducer`:

```js
// Before:
const store = createStore(counter)

// After:
const store = configureStore({
  reducer: counter
})
```

This probably doesn't look like much is different. But, under the hood, the store has been configured to enable using the [Redux DevTools Extension](https://github.com/zalmoxisus/redux-devtools-extension) to view the history of dispatched actions and how the store state changed, and has had [some Redux middleware included by default](../api/getDefaultMiddleware.mdx). We'll look at these in more detail in the next tutorial.

### Introducing: `createAction`

Next up, let's look at [`createAction`](../api/createAction.mdx).

`createAction` accepts an action type string as an argument, and returns an action creator function that uses that type string. (Yes, this means the name is a bit incorrect - we're creating an "action creator function", not an "action object", but it's shorter and easier to remember than `createActionCreator`.) So, these two examples are equivalent:

```js
// Original approach: write the action type and action creator by hand
const INCREMENT = 'INCREMENT'

function incrementOriginal() {
  return { type: INCREMENT }
}

console.log(incrementOriginal())
// {type: "INCREMENT"}

// Or, use `createAction` to generate the action creator:
const incrementNew = createAction('INCREMENT')

console.log(incrementNew())
// {type: "INCREMENT"}
```

But what if we need to reference the action type string in a reducer? With `createAction`, you can do that in two ways. First, the action creator's `toString()` method has been overridden, and will return the action type string. Second, the type string is also available as a `.type` field on the function:

```js
const increment = createAction('INCREMENT')

console.log(increment.toString())
// "INCREMENT"

console.log(increment.type)
// "INCREMENT"
```

We can use `createAction` to simplify the previous counter example.

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

That saved us a few lines again, and at least we're not repeating the word `INCREMENT` everywhere.

### Introducing: `createReducer`

Now, let's look at the reducer function. While you can use any conditional logic you want in a Redux reducer, including `if` statements and loops, the most common approach is to check the `action.type` field and do some specific logic for each action type. A reducer will also provide an initial state value, and return the existing state if the action isn't something it cares about.

Redux Toolkit includes a [`createReducer` function](../api/createReducer.mdx) that lets you write reducers using a "lookup table" object, where each key in the object is a Redux action type string, and the values are reducer functions. We can use it to directly replace the existing `counter` function definition. Since we need to use the action type strings as the keys, we can use the [ES6 object "computed property" syntax](http://javascript.info/object#computed-properties) to create keys from the type string variables.

```js
const increment = createAction('INCREMENT')
const decrement = createAction('DECREMENT')

const counter = createReducer(0, {
  [increment.type]: state => state + 1,
  [decrement.type]: state => state - 1
})
```

Or, since the computed properties syntax will call `toString()` on whatever variable is inside, we can just use the action creator functions directly without the `.type` field:

```js
const counter = createReducer(0, {
  [increment]: state => state + 1,
  [decrement]: state => state - 1
})
```

To see the complete code so far, see [this CodeSandbox showing the use of `createAction` and `createReducer`](https://codesandbox.io/s/counter-vanilla-redux-toolkit-sjouq).

### Introducing: `createSlice`

Let's review what the counter example looks like at this point:

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

That's not bad, but we can make one more major change to this. Why do we even need to generate the action creators separately, or write out those action type strings? The really important part here is the reducer functions.

That's where the [`createSlice` function](../api/createSlice.mdx) comes in. It allows us to provide an object with the reducer functions, and it will automatically generate the action type strings and action creator functions based on the names of the reducers we listed.

`createSlice` returns a "slice" object that contains the generated reducer function as a field named `reducer`, and the generated action creators inside an object called `actions`.

Here's what our counter example would look like using `createSlice` instead:

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

Most of the time, you'll probably want to use ES6 destructuring syntax to pull out the action creator functions as variables, and possibly the reducer as well:

```js
const { actions, reducer } = counterSlice
const { increment, decrement } = actions
```

## Summary

Let's recap what the functions do:

- `configureStore`: creates a Redux store instance like the original `createStore` from Redux, but accepts a named options object and sets up the Redux DevTools Extension automatically
- `createAction`: accepts an action type string, and returns an action creator function that uses that type
- `createReducer`: accepts an initial state value and a lookup table of action types to reducer functions, and creates a reducer that handles all of those action types
- `createSlice`: accepts an initial state and a lookup table with reducer names and functions, and automatically generates action creator functions, action type strings, and a reducer function.

Notice that none of these changed anything about how Redux works. We're still creating a Redux store, dispatching action objects that describe "what happened", and returning updated state using a reducer function. Also, notice that the Redux Toolkit functions can be used no matter what approach was used to build the UI, since they just handle the "plain Redux store" part of the code. Our example used the store with a "vanilla JS" UI, but we could use this same store with React, Angular, Vue, or any other UI layer.

Finally, if you look carefully at the example, you'll see that there's one place where we've written some async logic - the "increment async" button:

```js
document.getElementById('incrementAsync').addEventListener('click', function() {
  setTimeout(function() {
    store.dispatch(increment())
  }, 1000)
})
```

You can see that we're keeping the async handling separate from the reducer logic, and we dispatch an action when the store needs to be updated. Redux Toolkit doesn't change anything about that.

Here's the complete example in a sandbox:

<iframe src="https://codesandbox.io/embed/counter-vanilla-createslice-redux-toolkit-6gkxx?fontsize=14&hidenavigation=1&theme=dark&view=editor"
     style={{ width: '100%', height: '500px', border: 0, borderRadius: '4px', overflow: 'hidden' }} 
     title="counter-vanilla createSlice - Redux Toolkit"
     allow="geolocation; microphone; camera; midi; vr; accelerometer; gyroscope; payment; ambient-light-sensor; encrypted-media; usb"
     sandbox="allow-modals allow-forms allow-popups allow-scripts allow-same-origin"
></iframe>

Now that you know the basics of each function, the next step is to try using them in a _slightly_ larger example to see more of how they work. We'll cover that in the [Intermediate Tutorial](./intermediate-tutorial.md).
