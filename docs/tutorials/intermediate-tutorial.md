---
id: intermediate-tutorial
title: 中级教程
sidebar_label: 中级教程
hide_title: true
---

# 中级教程: 把 Redux工具包 实践起来

在 [基础教程](./basic-tutorial.md) 中，你已经看到了 Redux工具包 中包含的主要的 API 函数，以及一些为什么和如何使用它们的简短的例子。你也可以看到你能够不使用 React、NPM、Webpack 或者任何构建工具，在一个 HTML 页面的 script 标签就能使用 Redux 和 RTK。

在这个教程中，你将看到在一个简单的 React 应用中如何使用这些 API。具体点说，是我们把这些 [原 Redux "todos" 示例应用](https://redux.js.org/introduction/examples#todos) 进行转换，以便使用 RTK。

我们将会介绍几个概念:

- 如何将 "纯 Redux" 代码转换为使用 RTK 代码
- 如何在一个典型的 React+Redux 应用中使用 RTK
- 如何使用 RTK 里一些更强大的特性来简化你的 Redux 代码

另外，尽管接下来的并不仅针对于 RTK，我们也会研究几种能改进你的 React-Redux 代码的方法。

本教程中，实现整个应用的完整源代码可以从 [github.com/reduxjs/rtk-convert-todos-example](https://github.com/reduxjs/rtk-convert-todos-example) 获得。我们将逐步解释整个转换的过程，正如仓库里的历史记录所展示一样。有特殊意义的、独立的代码提交的链接，将像如下高亮的引用块显示：

> - 这里是提交信息

## 回顾 Redux Todos 示例

如果我们查看 [当前 `todos` 示例源代码](https://github.com/reduxjs/redux/tree/9c9a4d2a1c62c9dbddcbb05488f8bd77d24c81de/examples/todos/src)，我们可以观察到以下几点：

- [`todos` reducer 函数](https://github.com/reduxjs/redux/blob/9c9a4d2a1c62c9dbddcbb05488f8bd77d24c81de/examples/todos/src/reducers/todos.js) 通过复制嵌套的 JS 对象和数组来 "手工" 进行 immutable 更新
- [`actions` 文件](https://github.com/reduxjs/redux/blob/9c9a4d2a1c62c9dbddcbb05488f8bd77d24c81de/examples/todos/src/actions/index.js)
  中，有几个纯手写的 action creator 函数，同时 action type 字符串在 actions 文件和 reducer 文件中重复出现
- 项目代码结构用的是 ["类型文件夹"("folder-by-type") 结构](https://redux.js.org/faq/code-structure#what-should-my-file-structure-look-like-how-should-i-group-my-action-creators-and-reducers-in-my-project-where-should-my-selectors-go)， `actions` 和 `reducers` 由不同的文件组成
- React 组件用的是一种严格版本的 ["容器/展示"模式 ("container/presentational" pattern)](https://medium.com/@dan_abramov/smart-and-dumb-components-7ca2f9a7c7d0) 来编写的, 其中 ["展示"组件放置于一个文件夹当中](https://github.com/reduxjs/redux/tree/9c9a4d2a1c62c9dbddcbb05488f8bd77d24c81de/examples/todos/src/components)，而 [定义 Redux 连接逻辑的"容器"组件则在另一个文件中](https://github.com/reduxjs/redux/tree/9c9a4d2a1c62c9dbddcbb05488f8bd77d24c81de/examples/todos/src/containers)
- 若干代码并没有遵某些 Redux 所推荐的"最佳实践"模式。在演示的过程中，我们会仔细观察一些具体的例子

一方面，这是一个小小的示例应用。它的意图是说明实际中一起使用 React 和 Redux 的基础知识，并不是一定要在一个全面的生产的应用中作为"正确的方式"来使用。另一方面，大多数人会使用他们在文档和示例中看到的模式，这里面肯定有改进的空间。

## 初始转换步骤

### 在项目中添加 Redux工具包

由于原 todos 示例在 Redux 代码仓库中，我们可以先拷贝 Redux "todos" 源码到的一个全新的 Create-React-App 项目中，然后再把 Prettier 添加到项目，以确保项目代码能保持一致的格式。另外，项目中还有一个 [jsconfig.json](https://code.visualstudio.com/docs/languages/jsconfig) 文件，以便我们能够使用 `/src` 文件夹作为根文件夹，来使用"绝对引入路径"方法。

> - [首次提交](https://github.com/reduxjs/rtk-convert-todos-example/commit/a8e0a9a9d77b9dcd9e881079e7cca449084ca7b1)
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

### 转换成使用 `configureStore` 的 Store

正如 "counter" 示例一样，我们可以使用 RTK 的 `configureStore` 去替换纯 Redux 的 `createStore` 函数。这一步会为我们把 Redux DevTools Extension 自动设置好。

这里看到的只是一些简单的变化。我们更新 `src/index.js`，以引入 `configureStore` 而非 `createStore`，并且把函数调用替换掉。请记住， `configureStore` 接收一个带有具名字段的选项对象作为参数，因此我们将其作为一个名为 `reducer` 的对象字段进行传入 ，而不是直接给 `rootReducer` 传入第一个参数。

> - [转换成使用 configureStore 的 store 设置代码](https://github.com/reduxjs/rtk-convert-todos-example/commit/cdfc15edbd82beda9ef0521aa191574b6cc7695a)

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

**注意，我们仍然在使用已经在应用里存在的，与原应用一样的 root reducer 函数，并且一个 Redux store 仍旧需要被创建出来。所有的变化，仅是 store 是使用了协助开发的工具而被自动设置好的**

如果 [Redux DevTools 浏览器插件](https://github.com/zalmoxisus/redux-devtools-extension) 已经安装好了， 在开发模式下启动应用且打开插件，你应该能看到应用当前状态。它应该长这个样子：

![展示 Redux DevTools 初始状态的插件截图](/assets/tutorials/intermediate/int-tut-01-redux-devtools.png)

## 创建 Todos 切片

第一个重写应用的重大步骤，就是将 todos 逻辑转换成一个新的 "切片"。

### 理解"切片"

目前为止，todos 代码被分为两个部分。reducer 逻辑在 `reducers/todos.js`，而 action creators 在 `actions/index.js`。在一个更大型的应用中，我们有可能还会看到 action type 常量，比如 `constants/todos.js`，因此可以在以上两处地方被复用。

我们 _可以_ 使用 RTK [`createReducer`](../api/createReducer.mdx) 和 [`createAction`](../api/createAction.mdx) 函数把它们替换掉。然而，RTK [`createSlice` 函数](../api/createSlice.mdx) 可以让我们把这些逻辑整合到一个地方。它的内部使用了 `createReducer` 和 `createAction`，因此 **在大部分应用中, 你无需亲自调用这两个函数 - `createSlice` 足够了。**

你可能会有疑惑，“究竟什么是‘切片’呢？“。一个普通的 Redux 应用里，有一个在状态树顶级的 JS 对象，并且该对象是调用了 Redux [`combineReducers` 函数](https://redux.js.org/api/combinereducers) （其目的是聚合多个 reducer 函数到一个更大的 ”根 reducer“）的结果。**我们把这个对象的任意一个键/值区域称为一个 '切片' , 同时我们使用 ["切片 reducer"](https://redux.js.org/recipes/structuring-reducers/splitting-reducer-logic) 这个术语，去形容负责更新该切片状态的 reducer 函数。**

在这个应用中，这个 root reducer 长这样：

```js
import todos from './todos'
import visibilityFilter from './visibilityFilter'

export default combineReducers({
  todos,
  visibilityFilter
})
```

因此，合并之后的状态长 `{todos: [], visibilityFilter: "SHOW_ALL"}`. `state.todos` 这样。 `state.todos` 是一个 “切片”，而 `todos` reducer 函数是一个 “切片 reducer”。

### 审视原 Todos Reducer

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
- 对所有其他的 actions 一律返回当前的状态（等效于 "我根本不关心这个 action")

并且，它以一个默认值 `[]` 初始化了状态值，并且自身被默认暴露出来。

### 编写切片 Reducer

我们可以利用 `createSlice` 去完成同样的工作，但是会以一种更简单的方式。

首先，我们会添加一个名为 `/features/todos/todosSlice.js` 的新文件。注意到，尽管如何组织你的应用里面的文件夹与文件并不是一个大问题，但是我们发现 [a "feature folder" approach](https://redux.js.org/faq/code-structure#what-should-my-file-structure-look-like-how-should-i-group-my-action-creators-and-reducers-in-my-project-where-should-my-selectors-go) 在很多应用中效果会更好。文件命名也是由完全取决于你，但是 `someFeatureSlice.js` 的约定是比较合理的。

在这个文件当中，我们会添加如下的逻辑：

> - [添加初始 todos 切片](https://github.com/reduxjs/rtk-convert-todos-example/commit/48ce059dbb0fce1b961631821534fbcb766d3471)

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

- `createSlice` 接收一个选项对象作为参数，其中的选项有：
  - `name`: 字符串，被用于生成的 action type 的的前缀
  - `initialState`: reducer 的初始状态值
  - `reducers`: 对象，其中的键会成为 action type 字符串，而函数是当 action type 被分发时调用的 reducers。(有时候它们也会被称为 ["case reducers"](https://redux.js.org/recipes/structuring-reducers/splitting-reducer-logic)，因为它们类似于 `switch` 语句中的 `case`)

因此，当一个带有 `"todos/addTodo"` 的 action 被分发时， `addTodo` case reducer 函数会被调用。

这里没有 `default` 处理函数。`createSlice` 生成的 reducer 会通过返回当前的状态，自动处理其他的 action types，所以我们不用自己列出来。

#### "可变" 更新逻辑

注意到 `addTodo` 正在调用 `state.push()` 。 通常情况下，这是很糟糕的，因为 [`array.push()` 函数改变了已有的数组](https://doesitmutate.xyz/#push)，并且还有 **[Redux reducers _一定不能_ 修改状态!](https://redux.js.org/basics/reducers#handling-actions)**

然而，`createSlice` 和 `createReducer` 把你的函数用 [Immer 里的 `produce`](https://github.com/immerjs/immer) 封装了起来。**这意味着你可以写任何修改 reducer 里面的状态的代码，而 Immer 会安全地返回一个被正确地更新过的结果**

同样地，`toggleTodo` 并不会遍历数组或者拷贝匹配的 todo 对象。相反，它仅仅查找对应的 todo 对象，并且通过 `todo.completed = !todo.completed` 的赋值操作进行更改。再次地，Immer 知道这个对象被更改过了，因此会拷贝这个 todo 对象还有对应的数组。

正是因为这些所有必须要发生的额外拷贝操作，普通的可变更新逻辑趋向于模糊化你正在尝试做的事情。在此，你的目的需要更加明确：我们正在往一个数组的末尾添加一个元素，或是我们正在修改一个 todo 条目的字段。

#### 导出切片函数

`createSlice` 返回的对象长这样:

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

**注意它自动生成了合适的 action creator 函数 **和** 每一个我们的 reducers 的 action types - 我们不必自己手动去写**

我们需要在其他文件中使用 action creators 和 reducers，因此至少上我们会需要导出这个切片对象。但是，我们可以利用 Redux 社区的一种叫做 ["鸭子" 模式](https://github.com/erikras/ducks-modular-redux)的约定。简单来说，**它意味着你需要把你所有的 action creators 和 reducers 放到一个文件当中，完成具名地导出 action creators，还有一个 reducer 函数的默认导出**

多亏了 `createSlice`，我们已经可以让我们的 action creators 和 reducer 同时放在一个文件中。我们需要做的就是把它们分别导出，并且我们的 todos 切片文件与常规的 “鸭子” 模式对应上了。

#### 使用 Action Payloads

说到 action creators, 让我们稍微重温与回顾一下 reducer 的逻辑。

默认情况下，RTK 的 `createAction` 函数创造出来 action creators 只接受一个实参。不管那个实参是什么，都会被放到 action 对象中，作为一个名为 `payload` 的字段。

关于 `action.payload` 本身其实没什么特别的。Redux 并不知道也不关心它的命名。但是，比如“鸭子模式”， `payload` 这个名字来自于另外一个 Redux 社区的约定，名为 ["Flux Standard Actions"](https://github.com/redux-utilities/flux-standard-action)。

联同 `type` 字段，actions 通常需要包含其他额外的数据。 原 `addTodo` 的 Redux 代码中有一个 action 对象，形如 `{type, id, text}`。 **FSA 约定建议，与其允许 action 对象中直接存在有任意的名称的数据字段， 你应该把数据放到一个名为 `payload` 的字段**

`payload` 的形状结构，取决于 reducer 对不同 action type 的想法，并且不管派发什么代码，该 action 需要把符合该预期的值传进来。 如果只需要一个值，你或许可以直接使用该值充当 `payload` 的全部。更常见的是，你需要传入多个值，并且在这种情况下， `payload` 应该是一个含有所有那些值的一个对象。

在我们的 todos 切片中，`addTodo` 需要两个字段，`id` 和 `text`，所以我们把这两个值传到一个 `payload` 对象中。而对于 `toggleTodo`，我们唯一需要的值，是需要被修改的一条 todo 的 `id`。 我们原本可以那直接当作 `payload` 而传入，但是我们比较习惯于把 `payload` 始终作为一个对象，所以我干脆将其构造成 `action.payload.id`。

(剧透一下: _确实有_ 一种自定义如何构造 action 对象 payloads 的方法。我们会在本教程后段进行探讨，或者你也可以查阅 [the `createAction` API docs](../api/createAction.mdx) 寻找相关解释。 )

### 更新 Todos 的测试

原 todos reducer 包含了一个测试文件。我们可以把它搬运到我们的 todos 切片当中来，并且检验一下它们具有相同的输出结果。

第一步是先拷贝 `reducers/todos.spec.js` 到 `features/todos/todosSlice.spec.js`, 接着修改引入路径从而能读取到切片文件的 reducer

> - [拷贝测试到 todos 切片](https://github.com/reduxjs/rtk-convert-todos-example/commit/b603312ddf55899e8a75522d407c40474948ae0b)

完成之后，我们需要更新测试文件以匹配 RTK。

第一个问题是，测试文件把例如像 `'ADD_TODO'` 这样的 action types 硬编码了。 RTK 的 action types 形如 `'todos/addTodo'` 。我们也可以通过从 todos 切片导入 action creators，从而引用到它，然后把原来的 type 常量用 `addTodo.type` 替换掉。

另外一个问题是，测试案例的 action 对象长得像 `{type, id, text}` ，而 RTK 永远把这些额外的值放到 `action.payload` 。因此，我们需要更改测试 actions 以作匹配。

(我们的确 _可以_ 仅仅把测试用例中的行内 action 对象用 `addTodo({id : 0, text: "Buy milk"})` 替换掉，但是就目前来说上述是一套稍微简单一些的更改操作。)

> - [搬运 todos 测试案例到 todos 切片中](https://github.com/reduxjs/rtk-convert-todos-example/commit/39dbbf37bd4c559db956c8291bbd0bf1135546bb)

其中一个更改示例会如下:

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

更改过后，所有 `todosSlice.spec.js` 里面的测试用例都会通过，证明我们的 RTK 切片 reducer 跟之前纯手写的 reducer 一模一样。

### 实现 Todo IDs

在原应用的代码中，每一个新添加的 todo 都有一个自增 number 类型的 ID 值：

```js
let nextTodoId = 0
export const addTodo = text => ({
  type: 'ADD_TODO',
  id: nextTodoId++,
  text
})
```

现在，我们的 todos 切片并不那么做，因为 `addTodo` action creator 是为我们自动生成的。

我们 _可以_ 为此添加这种行为，要求无论什么代码派发添加 todo 这个 action 时都应该传入一个新的 ID，比如像 `addTodo({id: 1, text: "Buy milk"})`，但是这将非常麻烦。为什么调用者需要追踪这个值？另外，如果应用当中还有其他地方需要派发这个 action 呢？更好的办法是把这段逻辑封装到 action creator 中去。

RTK 允许你自定义 `payload` 在 action 对象中的生成方式。如果你单独 `createAction` 使用，你可以传入一个 “prepare 回调函数“ 作为第二个实参。大概长这个样子：

> - [实现 addTodo ID 生成方式](https://github.com/reduxjs/rtk-convert-todos-example/commit/0c9e3b721c209d368d23a70cf8faca8f308ff8df)

```js
let nextTodoId = 0

export const addTodo = createAction('ADD_TODO', text => {
  return {
    payload: { id: nextTodoId++, text }
  }
})
```

**注意 “prepare 回调函数” _必须_ 返回一个带有一个 `payload` 字段的对象**。否则，action 的 payload 会变成 undefined。它也可以包含一个叫 `meta` 的字段，其可以被用作涵盖其他额外的跟该 action 相关的元数据。

如果你使用 `createSlice`，它会自动调用 `createAction`。如果你需要自定义 payload，你可以传入一个带有 `reducer` 和 `prepare` 函数的对象到 `reducers` 对象中，而不是只是 reducer 函数本身：

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

我们可以添加另外一个确认这种实现可行的测试：

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

## 使用新的 Todos 切片

### 更新 root Reducer

我们现在有一个崭新的 todos reducer 函数，但是它目前还没有与任何东西进行绑定。

第一步是先更新我们的根 reducer，让其使用来自 todos 切片的 reducer 而不是原来的 reducer。我们只需要在 `reducers/index.js` 更改 import 语句：

> - [使用 todos 切片 reducer](https://github.com/reduxjs/rtk-convert-todos-example/commit/7b6e005377c856d7415e328387188260330ebae4)

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

尽管我们可以保留被引入函数 `todos` 的这个名字，这样我们就可以在 `combineReducers` 中使用对象字面量的简写形式，但是如果我们为 `todosReducer` 命名，且定义这个字段为 `todos: todosReducer`，这样会稍微清晰一些。

### 更新 Add Todo 组件

如果我们重新加载应用，我们应该能看到 `state.todos` 还是一个空数组。但是，如果我们点击 "Add Todo"， 不会有任何响应。我们仍旧在派发 type 为 `'ADD_TODO'` 的 actions，然而我们的 todos 切片是在寻找一个 type 为 `'todos/addTodo'` 的 action。我们需要引入正确的 action creator，并且在 `AddTodo.js` 文件中使用它。

趁此机会，我们可以说说几个关于 `AddTodo` 编写方面存在的问题。首先，它目前使用的是 React 中的"callback ref" ，以读取当你点击 "Add Todo"时输入框的当前 text 的值。这是奏效的，但是处理表单字段的标准 “React 做法“ 是利用 ”可控 inputs“ 模式，其中当前表单字段的值是存到组件的状态中的。

第二，被连接的组件正接受 `dispatch` 作为一个属性 prop。正如所料，这依然奏效，但是常规的连接做法是
[给 `connect` 传入 action creator 函数](https://react-redux.js.org/using-react-redux/connect-mapdispatch)，然后通过调用被作为 props 的函数，从而派发 actions。

因为我们已经拿到了这个组件所在的文件，我们可以把这些也一并修复。最终的版本长这样：

> - [更新 AddTodo 以派发新的 action type](https://github.com/reduxjs/rtk-convert-todos-example/commit/d7082409ebaa113b74f6989bf70ee09600f37d0b)

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

我们首先从我们的 todos 切片引入正确的 `addTodo` action creator 函数。

输入框现在被视作一个标准的 “可控输入"，text 的值被存储到组件的状态中。我们可以利用在表单的 submit 处理函数中利用这个状态值。

最后，我们使用 [`mapDispatch` 的"对象简写"形式](https://react-redux.js.org/using-react-redux/connect-mapdispatch#defining-mapdispatchtoprops-as-an-object) 去简化给 `connect` 传入 action creators 的过程。`addTodo` 的 “有界” 版本被作为一个 prop 传进来，它会在我们调用它的时候，派发对应的 action 。

### 更新 Todo 列表

`TodoList` 和 `VisibleTodoList` 组件有着相同的问题：它们都是用了更早期版本的 `toggleTodo` action creator，并且 `connect` 并不是通过 `mapDispatch` 的"对象简写"形式设置的。我们可以解决这两个问题。

> - [更新 TodoList 以派发新的 toggle action type](https://github.com/reduxjs/rtk-convert-todos-example/commit/b47b2124d6a28386b7461bccb9216682a81edb3e)

```diff
// VisibleTodoList.js
-import { toggleTodo } from '../actions'
+import { toggleTodo } from 'features/todos/todosSlice'

-const mapDispatchToProps = dispatch => ({
- toggleTodo: id => dispatch(toggleTodo(id))
-})
+const mapDispatchToProps = { toggleTodo }
```

设置好之后，我们应该能够再次添加和切换 todos 状态了，但是我们这里用我们新的 todos 切片！

## 创建和使用 Filters 切片

既然我们创建了 todos 切片并且把它绑定到我们的 UI，我们可以对过滤选择的逻辑重施故技。

### 编写 Filters 切片

过滤的逻辑其实非常简单。我们有一个 action，其通过返回 action 里面的东西来设置当前的过滤值。整个切片如下：

> - [添加 filters 切片](https://github.com/reduxjs/rtk-convert-todos-example/commit/b77f4155e3b45bce24d0d0ef6e2f7b0c3bd11ee1)

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

我们把 `VisibilityFilters` 原先在 `actions/index.js` 的枚举对象复制了过来。这个切片代码只是创建一个 reducer, 我们把其中的 action creator 和 reducer 导出之后就完成了。

### 使用 Filters 切片

就像 todos reducer 一样，我们需要导入和添加 visibility reducer 到我们的 root reducer 中：

> - [使用 filters 切片 reducer](https://github.com/reduxjs/rtk-convert-todos-example/commit/623c47b1987914a1d90142824892686ec76c20a1)

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

从这里开始，当用户点击按钮时，我们需要派发 `setVisibilityFilter` action。首先，为了保持一致，我们需要更新 `VisibleTodoList.js` 和 `Footer.js` 以使用 `VisibilityFilter` 从 filter 切片文件而来的枚举对象，而非从 actions 文件而来的那个。

从这里开始，link 组件需要承担更多的工作。`FilterLink` 正在创建捕获 `ownProps.filter` 当前值的新函数，因此 `Link` 只是获得了一个名为 `onClick` 的函数。尽管这种做法没有问题，为了一致性我们想继续使用 `mapDispatch` 对象简写形式，随后在 `Link` 派发 action 的时候修改传给它的过滤值。

> - [在 UI 中使用新的 filters action](https://github.com/reduxjs/rtk-convert-todos-example/commit/776b39088384513ff68af41039fe5fc5188fe8fb)

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

再一次地，注意到这些大部分这些改动其实并非针 RTK 而做的，但是在示例代码中尽可能地为了保持一致性而采用一些最佳实践，总归是一件好事。

工作完成之后，我们应该可以添加一些 todos，修改其中某些的状态，然后切换过滤器来呈现不同形式的展示列表。

## 优化 Todo 过滤工作

`VisibleTodoList` 组件目前使用着一个名为 `getVisibleTodos` 的函数以完成过滤 todos 数组。这其实是一个 “selector 函数”，如在 Redux 官方文档 [Computing Derived Data](https://redux.js.org/recipes/computing-derived-data) 所介绍。它封装了从 Redux store 读取的过程，并且把部分或者全部的值都提取了出来。

然而，目前的代码隐含着一个问题。如果过滤值被设置成 `SHOW_COMPLETED` 或者 `SHOW_ACTIVE` ，_每一次_ 它被调用的时候，它会 _永远_ 只返回一个新的数组。因为它被用在了一个 `mapState` 函数中，这意味每当 _任何_ 的 action 被派发的时， 它都会返回一个新的数组引用。

在这个小的 todo 示例应用中，这并不是是个问题。反正，我们的 actions 只是牵涉到修改 todo 列表或者过滤它。但是，在真正的应用，许多其他的 actions 会被派发。想想一下如果这个 todo 应用有一个计数器，然后当列表被过滤之后， `"INCREMENT"` 被派发了。我们会创建出一个新的列表，并且 `TodoList` 被迫重新渲染，即使其中没有发生任何事物发生了改变。

即使这不是一个真正的性能上的问题，关于我们如何改进这个问题，这总是值得展示的一件事。

Redux 应用经常使用一个叫 [Reselect](https://github.com/reduxjs/reselect) 的库，其中有一个 `createSelector` 函数，可以让你定义 "被记住的 (memoized)" selector 函数。这些 memoized selectors 只会在输入的值变化时，重新计算它们。

RTK 把 `createSelector` 函数从 Reselect 重新导出，所以我们可以在 `VisibleTodoList` 导入并且使用它。

> - [把可见的 todos 转换为一个 memoized selector](https://github.com/reduxjs/rtk-convert-todos-example/commit/4fc943b7111381974f20f74750a114b5e52ce1b2)

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

首先，我们从 RTK 导入 `createSelector`，然后定义一些单行 selector 函数，以从 `todos` 和 `visibilityFilter` 的 `state` 参数中获取这两个字段。

我们接着调用 `createSelector` ，并且把这两个小的 selector 函数传入到"输入 selectors"数组中。 `createSelector` 会调用它们，获取到返回值，然后把返回值放置到我们定义的 "输出 selector" 数组中，之后就会开始进行过滤和返回最终的结果。

上述代码的定义和使用，我们做了一些小改变。尽管你可以 selector 函数任意地命名，`selectX` 是一种更传统的命名规则。另外，因为 input selectors 负责读取必须要的值，我们可只调用 `selectVisibleTodos(state)`，其中 state 作为唯一的参数。

当我们重新运行应用的时候，过滤逻辑的效果 _应该_ 和之前你在 UI 里面看到的相同。

## 清理工作

我们来到的本教程的卫生。我们现在能看得到许多已经不再需要的 action 和 reducer 文件，所以我们应该把它们都删除了以清理我们的项目。

我们可以很安全地删除 `actions/index.js`, `reducers/todos.js`, `reducers/visibilityFilter.js` 以及相关的测试文件。

我们同时也可以尝试把 "类型文件夹" 结构彻底地换成 "功能文件夹" 结构，做法是把组件文件移入 feature 文件夹中。

> - [删除无用的 action 和 reducer 文件](https://github.com/reduxjs/rtk-convert-todos-example/commit/fbc0b965949e082748b8613b734612226ffe9e94)
> - [整合组件到 feature 文件夹中](https://github.com/reduxjs/rtk-convert-todos-example/commit/138cc162b1cc9c64ab67fae0a1171d07940414e6)

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
