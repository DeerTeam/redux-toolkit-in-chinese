---
id: usage-with-typescript
title: 配合TypeScript使用
sidebar_label: 配合TypeScript使用
hide_title: true
---

# 配合 TypeScript 使用

Redux工具包 是使用 TypeScript 编写的，它的 API 被设计得能很好地与 TypeScript 应用进行整合。

这一章节的目的是提供一个你在使用 RTK 和 TypeScript 的过程中，关于所有常见用例以及最有可能会遇到的隐患的概览。

**如果你碰到了任何在本章节中没有提到过的关于类型方面的问题，请给我们提出 issue 以便进行讨论**

## 配合 TypeScript 使用 `configureStore`

使用 [configureStore](../api/configureStore.mdx) 应该不再需要额外的类型定义。但是，你可能需要把 `RootState` 和 `Dispatch` 的类型提取出来。

### 获取 `State` 的类型

获取 `State` 最简单的方法，是提前把 root reducer 的类型获取到还有提取它的 `ReturnType` 。

建议的做法是，给这个类型取一个不同的名字比如 `RootState` ，以避免产生混淆，因为 `State` 这个类型名字经常被滥用。

```typescript {3}
import { combineReducers } from '@reduxjs/toolkit'
const rootReducer = combineReducers({})
export type RootState = ReturnType<typeof rootReducer>
```

另外一种方式是，如果你不打算自己创建 `rootReducer` ，而是把切片 reducers 直接传入 `configureStore()`，你需要稍微修改一下类型，从而能正确地推断出 root reducer 的类型。

```ts
import { configureStore } from '@reduxjs/toolkit'
// ...
const store = configureStore({
  reducer: {
    one: oneSlice.reducer,
    two: twoSlice.reducer
  }
})
export type RootState = ReturnType<typeof store.getState>

export default store
```

### 获取 `Dispatch` 类型

如果你想从你的 store 获取到 `Dispatch` 类型，你可以在创建了 store 之后把它提取出来。建议的做法是，给这个类型取一个不同的名字比如 `AppDispatch` 来避免混淆，因为 `Dispatch` 这个类型名字经常被滥用。同时你也会发现，把一个如下所示像 `useAppDispatch` 这样的 hook 导出，是比较方便的一件事情，接着你就可以在任何你调用 `useDispatch` 的地方使用它了。

```typescript {6}
import { configureStore } from '@reduxjs/toolkit'
import { useDispatch } from 'react-redux'
import rootReducer from './rootReducer'

const store = configureStore({
  reducer: rootReducer
})

export type AppDispatch = typeof store.dispatch
export const useAppDispatch = () => useDispatch<AppDispatch>() // 导出一个能被复用以解析类型的hook
```

### 正确的 `Dispatch` 类型定义

`dispatch` 函数的类型会被 `middleware` 选项直接推断出来。因此如果添加了 _被正确地定义了类型_ 的中间件，`dispatch` 也应该被定义好了类型。

由于 TypeScript 经常在使用扩展运算符合并数组的时候，把数组的类型进行扩展，我们建议使用 `getDefaultMiddleware()` 的返回值 `MiddlewareArray` 中的 `.concat(...)` 和 `.prepend(...)` 方法。

此外，我们也建议为 `middleware` 选项里使用回调的形式，以获取一个提前正确定义好的、无需再指定任何泛型参数的 `getDefaultMiddleware`。

```ts {10-20}
import { configureStore } from '@reduxjs/toolkit'
import additionalMiddleware from 'additional-middleware'
import logger from 'redux-logger'
// @ts-ignore
import untypedMiddleware from 'untyped-middleware'
import rootReducer from './rootReducer'

type RootState = ReturnType<typeof rootReducer>
const store = configureStore({
  reducer: rootReducer,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware()
      .prepend(
        // 被正确定义过的中间可以直接使用
        additionalMiddleware,
        // 你也可以手动定义中间件类型
        untypedMiddleware as Middleware<
          (action: Action<'specialAction'>) => number,
          RootState
        >
      )
      // prepend 和 concat 可以被链式调用
      .concat(logger)
})

type AppDispatch = typeof store.dispatch
```

#### 不带 `getDefaultMiddleware` 使用 `MiddlewareArray`

如果你想完全跳过使用 `getDefaultMiddleware`， 你依然可以为了你的 `middleware` 数组具有类型安全的拼接，而使用 `MiddlewareArray` 。这个类继承了 JavasScript 内置的 `Array` 构造函数类型，唯一的变化是仅仅只是修改了 `concat(...)` 和那个额外的`.prepend(...)` 方法的类型。

通常来说，这些操作都不是必须的，因为你不一定会遇到数组类型扩展的问题，只要你使用了 `as const` 断言并且不使用扩展运算符。

所以如下的两个函数调用是完全一样的：

```ts
import { configureStore, MiddlewareArray } from '@reduxjs/toolkit'

configureStore({
  reducer: rootReducer,
  middleware: new MiddlewareArray().concat(additionalMiddleware, logger)
})

configureStore({
  reducer: rootReducer,
  middleware: [additionalMiddleware, logger] as const
})
```

### 在 React-Redux 使用被提取的 `Dispatch` 类型

默认情况下，React-Redux 的 `useDispatch` hook 并不包含任何考虑到中间件的类型。如果你需要为 `dispatch` 函数在派发 action 时指定更具体的类型，你可以指定 `dispatch` 函数的返回值类型，或者创建一个自定义类型版本的 `useSelector`。具体详情请参考 [the React-Redux documentation](https://react-redux.js.org/using-react-redux/static-typing#typing-the-usedispatch-hook)

## `createAction`

对于大部分的用例而言，`action.type` 并不需要一个字面量定义，因此如下所示是被允许的：

```typescript
createAction<number>('test')
```

这样被创建出来的 action 会具有 `PayloadActionCreator<number, string>` 这个类型。

然而在某些设置中，你却会需要一个 `action.type` 字面量类型。遗憾的是，TypeScript 类型定义并不允许手动定义和经过类型推断的参数混合使用，因此你必须同时在泛型和实际的 JavaScript 代码中指定 `type`：

```typescript
createAction<number, 'test'>('test')
```

如果你正在寻找另外一种能避免重复的编写方式，你可以使用 prepare回调函数，这样两种类型参数都可以被推断出来，而无需指定具体的 action type 了。

```typescript
function withPayloadType<T>() {
  return (t: T) => ({ payload: t })
}
createAction('test', withPayloadType<string>())
```

### 字面量 `action.type` 的替代方案

如果你在可辨识联合类型中，把 `action.type` 作为可辨识符来使用，比如在 `case` 语句中去正确地定义你的 payload，你可能会对这种方案感兴趣：

被创建的 action creators 有一个被用作 [类型谓词](https://www.typescriptlang.org/docs/handbook/advanced-types.html#using-type-predicates) 的 `match` 方法：

```typescript
const increment = createAction<number>('increment')
function test(action: Action) {
  if (increment.match(action)) {
    // action.payload 被正确地推断
    action.payload
  }
}
```

`match` 方法在与 `redux-observable` 和 RxJS 的 `filter` 方法结合使用时，也非常有用。

## `createReducer`

默认 `createReducer` 调用方法是与 “查找表“/”映射对象“ 配合使用的，如下所示：

```typescript
createReducer(0, {
  increment: (state, action: PayloadAction<number>) => state + action.payload
})
```

遗憾的是，由于对象的键 key 是唯一的字符串，使用这个 API 的话 TypeScript 并不能为你作出类型推断，也不能验证 action types 的合法性：

```typescript
{
  const increment = createAction<number, 'increment'>('increment')
  const decrement = createAction<number, 'decrement'>('decrement')
  createReducer(0, {
    [increment.type]: (state, action) => {
      // action 是 any 类型
    },
    [decrement.type]: (state, action: PayloadAction<string>) => {
      // 即使 action 应该被定义为 PayloadAction<number> 类型， TypeScript 无法检测到，也无法给出警告。
    }
  })
}
```

RTK 包含了一个类型安全的 reducer builder API 作为一个替代方案。

### 构建类型安全的 Reducer 实参对象

你可以使用一个接收 `ActionReducerMapBuilder` 参数的回调函数，去替代那个 `createReducer` 简单对象实参：

```typescript {3-10}
const increment = createAction<number, 'increment'>('increment')
const decrement = createAction<number, 'decrement'>('decrement')
createReducer(0, builder =>
  builder
    .addCase(increment, (state, action) => {
      // action 被正确地推断
    })
    .addCase(decrement, (state, action: PayloadAction<string>) => {
      // 这样产生错误
    })
)
```

在定义 reducer 的实参对象时，如果更严格的类型安全是必要的话，我们推荐使用这个 API。

#### 定义 `builder.addMatcher` 的类型 

应该使用一个 [类型谓词](https://www.typescriptlang.org/docs/handbook/advanced-types.html#using-type-predicates) 函数，作为 `builder.addMatcher` 的第一个 `matcher` 参数。这样，`reducer` 的第二个参数 `action` 的类型就可以被 TypeScript 推断出来：

```ts
function isNumberValueAction(action: AnyAction): action is PayloadAction<{ value: number }> {
  return typeof action.payload.value === 'number'
}

createReducer({ value: 0 }, builder =>
   builder.addMatcher(isNumberValueAction, (state, action) => {
      state.value += action.payload.value
   })
})
```

## `createSlice`

由于 `createSlice` 为你同时创建了 actions 和 reducer，你无需担心类型安全。Action types 仅需要通过内联的方式提供：

```typescript
{
  const slice = createSlice({
    name: 'test',
    initialState: 0,
    reducers: {
      increment: (state, action: PayloadAction<number>) =>
        state + action.payload
    }
  })
  // 现在可以使用了:
  slice.actions.increment(2)
  // 也可以在此使用:
  slice.caseReducers.increment(0, { type: 'increment', payload: 5 })
}
```

如果你有太多的 reducers 而且内联式的定义会显得太凌乱的话，你也可以在 `createSlice` 的调用之外定义它们，并且把它们作为 `CaseReducer` 来进行定义：

```typescript
type State = number
const increment: CaseReducer<State, PayloadAction<number>> = (state, action) =>
  state + action.payload

createSlice({
  name: 'test',
  initialState: 0,
  reducers: {
    increment
  }
})
```

### 定义初始 State 类型 

你可能注意到了，把 `SliceState` 作为一个泛型传入 `createSlice` 并不是一个好主意。这是因为在大部分情况下，`createSlice` 的后续泛型参数需要被推断出来，而 TypeScript 无法在同一个 “泛型块” 中，混合使用泛型类型的显式声明和推断。

标准的做法是，为你的 state 定义一个接口或者类型，创建一个使用该类型的初始值，并把这个初始值传到 `createSlice`。你也可以使用 `initialState: myInitialState as SliceState` 这种语法。

```ts {1,4,8,15}
type SliceState = { state: 'loading' } | { state: 'finished'; data: string }

// 第一种方法: 使用此类型定义 state 初始值
const initialState: SliceState = { state: 'loading' }

createSlice({
  name: 'test1',
  initialState, // 该切片的 state 类型被推断成 SliceState 类型
  reducers: {}
})

// 或者, 对 state 的初始值类型进行必要断言
createSlice({
  name: 'test2',
  initialState: { state: 'loading' } as SliceState,
  reducers: {}
})
```

这样会得到一个 `Slice<SliceState, ...>` 类型。

### 配合 `prepare` 回调函数定义 Action 内容

如果你想为你的 action 添加一个 `meta` 或者 `error` 属性，或者自定义 action 的 `payload`，你必须使用 `prepare` 表示法。

在TypeScript 里，这种表示长这样:

```ts {5-16}
const blogSlice = createSlice({
  name: 'blogData',
  initialState,
  reducers: {
    receivedAll: {
      reducer(
        state,
        action: PayloadAction<Page[], string, { currentPage: number }>
      ) {
        state.all = action.payload
        state.meta = action.meta
      },
      prepare(payload: Page[], currentPage: number) {
        return { payload, meta: { currentPage } }
      }
    }
  }
})
```

### 被创建出来的切片 Action Types

由于 TS 无法把两种字符串字面量 (`slice.name` 和 `actionMap` 的键) 合并成一个新的字面量，所以由 `createSlice` 创建的 action creators 都是 'string' 类型。这通常来说都不是一个问题，因为这些类型很少被当作字面量来使用。

在大部分 `type` 会被要求作为字面量使用的场景中，`slice.action.myAction.match` [类型谓词](https://www.typescriptlang.org/docs/handbook/advanced-types.html#using-type-predicates) 应该是一个可行的替代方案：

```ts {10}
const slice = createSlice({
  name: 'test',
  initialState: 0,
  reducers: {
    increment: (state, action: PayloadAction<number>) => state + action.payload
  }
})

function myCustomMiddleware(action: Action) {
  if (slice.actions.increment.match(action)) {
    // `action` 被收缩成 `PayloadAction<number>` 类型.
  }
}
```

如果你真的 _需要_ 这个类型，很遗憾除了手动转换之外别无他法。

### `extraReducers` 的类型安全

想要完整正确地定义出那些映射 action `type` 到 reducer 函数的 Reducer 查找表格的类型，并不是一件容易的事。这会影响到 `createSlice` 当中的 `createReducer` 和 `extraReducers` 的类型。因此，像跟 `createReducer` 一样，[你可以使用 "builder回调函数" 方法](#building-type-safe-reducer-argument-objects)，去定义 reducer 的对象参数。

当一个切片 reducer 需要处理由其他切片，或者 `createAction` (例如由 [`createAsyncThunk`](../api/createAsyncThunk.mdx)生成的 actions) 的具体调用而生成的 action types 时，这个方法特别有用。

```ts {27-30}
const fetchUserById = createAsyncThunk(
  'users/fetchById',
  // 如果你在这里定义参数的类型
  async (userId: number) => {
    const response = await fetch(`https://reqres.in/api/users/${userId}`)
    return (await response.json()) as Returned
  }
)

interface UsersState {
  entities: []
  loading: 'idle' | 'pending' | 'succeeded' | 'failed'
}

const initialState: UsersState = {
  entities: [],
  loading: 'idle'
}

const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    // 在这里填入主要的逻辑
  },
  extraReducers: builder => {
    builder.addCase(fetchUserById.pending, (state, action) => {
      // 根据切片的 state 以及 `pending` 的 action creator
      // `state` 和 `action` 现在都被正确地定义了类型
    })
  }
})
```

像在 `createReducer` 的 `builder` 一样，这个 `builder` 也接受 `addMatcher` (查阅 [定义 `builder.matcher`](#typing-builderaddmatcher)) 和 `addDefaultCase`

### 封装 `createSlice`

如果你需要复用 reducer 的逻辑，比较常用的做法是，编写带有额外常见行为、用于封装 reducer 函数的 ["高阶 reducers"](https://redux.js.org/recipes/structuring-reducers/reusing-reducer-logic#customizing-behavior-with-higher-order-reducers)。`createSlice` 也能用这种方法，但是鉴于 `createSlice` 类型定义的复杂度，你必须以非常具体的的方式去使用 `SliceCaseReducers` 和 `ValidateSliceCaseReducers` 这两个类型。

这里有一个这样的 “被泛型化” 封装起来的 `createSlice` 调用示例：

```ts
interface GenericState<T> {
  data?: T
  status: 'loading' | 'finished' | 'error'
}

const createGenericSlice = <
  T,
  Reducers extends SliceCaseReducers<GenericState<T>>
>({
  name = '',
  initialState,
  reducers
}: {
  name: string
  initialState: GenericState<T>
  reducers: ValidateSliceCaseReducers<GenericState<T>, Reducers>
}) => {
  return createSlice({
    name,
    initialState,
    reducers: {
      start(state) {
        state.status = 'loading'
      },
      /**
       * 如果你想对依赖于泛型的 state 写入一些值的话（在这个案例中：`state.data`，其为 T），
       * 你可能需要手动的具体指明 State 的类型，因为它的默认类型是 `Draft<GenericState<T>>`，
       * 对于某些还没确定好类型的泛型来说，有时候这种做法会有点问题。
       * 这在使用 Immer 中的 Draft 类型和泛型的时候，是一个很普遍的问题。
       */
      success(state: GenericState<T>, action: PayloadAction<T>) {
        state.data = action.payload
        state.status = 'finished'
      },
      ...reducers
    }
  })
}

const wrappedSlice = createGenericSlice({
  name: 'test',
  initialState: { status: 'loading' } as GenericState<string>,
  reducers: {
    magic(state) {
      state.status = 'finished'
      state.data = 'hocus pocus'
    }
  }
})
```

## `createAsyncThunk`

在大部分常见的使用案例中，你不应该为 `createAsyncThunk` 的调用本身显式地指定任何类型。

像对待其他的函数一样，仅需要为 `createAsyncThunk` 的 `payloadCreator` 参数，提供其第一个参数的类型，这样生成的 thunk 会接受到相同的入参类型。

`payloadCreator` 的返回值类型也会被反映到所有生成的 action types 当中。

```ts {8,11,18}
interface MyData {
  // ...
}

const fetchUserById = createAsyncThunk(
  'users/fetchById',
  // 在这里声明函数参数的类型:
  async (userId: number) => {
    const response = await fetch(`https://reqres.in/api/users/${userId}`)
    // 被推断的返回值类型: Promise<MyData>
    return (await response.json()) as MyData
  }
)

// `fetchUserById` 的参数被自动推断成`number` 类型
// 并且派发由此产生的 thunkAction，会返回一个 action 的 Promise
// 其类型被正确定义为 "fulfilled" 或者 "rejected"  
const lastReturnedAction = await store.dispatch(fetchUserById(3))
```

`payloadCreator` 的第二个参数，`thunkApi` ，是一个包含有对 `dispatch` 、`getState`、thunk 中间件的 `extra` 参数以及一个工具函数 `rejectWithValue`的引用的对象。如果你想在 `payloadCreator` 中使用这些引用，你需要定义一些泛型参数，因为这些参数的类型无法被推断。此外，由于TS 不能混合使用显式和推断的泛型参数，从这里开始你也需要为 `Returned` 和 `ThunkArg` 这两个泛型参数进行定义。

要为这些参数进行类型定义，你需要把一个对象作为第三个泛型参数，其对某些或者全部的字段的类型声明如：`{dispatch?, state?, extra?, rejectValue?}`

```ts
const fetchUserById = createAsyncThunk<
  // payload creator 的返回值类型
  MyData,
  // payload creator 的第一个参数
  number,
  {
    dispatch: AppDispatch
    state: State
    extra: {
      jwt: string
    }
  }
>('users/fetchById', async (userId, thunkApi) => {
  const response = await fetch(`https://reqres.in/api/users/${userId}`, {
    headers: {
      Authorization: `Bearer ${thunkApi.extra.jwt}`
    }
  })
  return (await response.json()) as MyData
})
```
 
如果你知道你的请求会成功或者有一个预期的错误格式，你可以在 action creator 中传入 `rejectValue` 和 `return rejectWithValue(knownPayload)` 的类型。这样在派发完 `createAsyncThunk` action 之后，你就能够在 reducer 和组件中引用该错误的 payload。

```ts
interface MyKnownError {
  errorMessage: string
  // ...
}
interface UserAttributes {
  id: string
  first_name: string
  last_name: string
  email: string
}

const updateUser = createAsyncThunk<
  // payload creator 返回值类型
  MyData,
  // payload creator 的第一个参数
  UserAttributes,
  // ThunkAPI 的类型
  {
    extra: {
      jwt: string
    }
    rejectValue: MyKnownError
  }
>('users/update', async (user, thunkApi) => {
  const { id, ...userData } = user
  const response = await fetch(`https://reqres.in/api/users/${id}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${thunkApi.extra.jwt}`
    },
    body: JSON.stringify(userData)
  })
  if (response.status === 400) {
    // 为后续处理返回已知错误
    return thunkApi.rejectWithValue((await response.json()) as MyKnownError)
  }
  return (await response.json()) as MyData
})
```

尽管这种 `state`, `dispatch`, `extra` 和 `rejectValue` 的表示法可能一开始显得很陌生，但是它可以让你只需提供那些你需要的类型 - 比如说，如果你并不在 `payloadCreator` 中读取 `getState`, 你并不需要为 `state` 提供一个类型。`rejectValue` 也是同样的情况 - 如果你需要读取任何可能发生的错误 payload，你可以忽略它。

除此之外，当你需要在被定义好的类型上读取已知的属性，你可以借助对 `action.payload` 和由 `createAction` 提供的作为一个类型守卫的 `match` 的类型检查。示例：

- 在一个 reducer 中

```ts
const usersSlice = createSlice({
  name: 'users',
  initialState: {
    entities: {},
    error: null
  },
  reducers: {},
  extraReducers: builder => {
    builder.addCase(updateUser.fulfilled, (state, { payload }) => {
      state.entities[payload.id] = payload
    })
    builder.addCase(updateUser.rejected, (state, action) => {
      if (action.payload) {
        // 由于我们在 `updateUser` 中，给 `rejectType` 传入 `MyKnownError`，类型信息能在此获取
        state.error = action.payload.errorMessage
      } else {
        state.error = action.error
      }
    })
  }
})
```

- 在一个组件中

```ts
const handleUpdateUser = async userData => {
  const resultAction = await dispatch(updateUser(userData))
  if (updateUser.fulfilled.match(resultAction)) {
    const user = unwrapResult(resultAction)
    showToast('success', `Updated ${user.name}`)
  } else {
    if (resultAction.payload) {
      // 由于我们在 `updateUser` 中，给 `rejectType` 传入 `MyKnownError`，类型信息能在此获取
      // 注意：这里也是处理任何依赖于 `rejectedWithValue` payload 的好地方，比如设置字段错误
      showToast('error', `Update failed: ${resultAction.payload.errorMessage}`)
    } else {
      showToast('error', `Update failed: ${resultAction.error.message}`)
    }
  }
}
```

## `createEntityAdapter`

给 `createEntityAdapter` 进行类型定义只需你指定一个作为单一泛型参数的的 entity 类型。

`createEntityAdapter` 文档中的示例，在 TypeScript 中长这样：

```ts {7}
interface Book {
  bookId: number
  title: string
  // ...
}

const booksAdapter = createEntityAdapter<Book>({
  selectId: book => book.bookId,
  sortComparer: (a, b) => a.title.localeCompare(b.title)
})

const booksSlice = createSlice({
  name: 'books',
  initialState: booksAdapter.getInitialState(),
  reducers: {
    bookAdded: booksAdapter.addOne,
    booksReceived(state, action: PayloadAction<{ books: Book[] }>) {
      booksAdapter.setAll(state, action.payload.books)
    }
  }
})
```

### 配合 `normalizr` 使用 `createEntityAdapter`

当你使用像 [`normalizr`](https://github.com/paularmstrong/normalizr/) 这样的库时，被范式化的数据类似于这种形状：

```js
{
  result: 1,
  entities: {
    1: { id: 1, other: 'property' },
    2: { id: 2, other: 'property' }
  }
}
```

`addMany`, `upsertMany`, 和 `setAll` 这些方法都可以允许在把 `entities` 部分传入而且不需要额外的转化步骤。然而，`normalizr` 的 TS 类型定义并不能正确地反应出多数据类型可能会被包含到结果中国呢，因此你需要为这种数据结构自行定义。

这里有一个长这样的示例:

```ts
type Author = { id: number; name: string }
type Article = { id: number; title: string }
type Comment = { id: number; commenter: number }

export const fetchArticle = createAsyncThunk(
  'articles/fetchArticle',
  async (id: number) => {
    const data = await fakeAPI.articles.show(id)
    // 把数据范式化，以此 reducers 可以对可预测的 payload 进行响应。
    // 注意：截止至本文写作时间，normalizr 不会对结果自动进行类型推断，
    // 因此，我们需要显式地声明出被范式化后的数据形状，以此作为一个泛型参数

    const normalized = normalize<
      any,
      {
        articles: { [key: string]: Article }
        users: { [key: string]: Author }
        comments: { [key: string]: Comment }
      }
    >(data, articleEntity)
    return normalized.entities
  }
)

export const slice = createSlice({
  name: 'articles',
  initialState: articlesAdapter.getInitialState(),
  reducers: {},
  extraReducers: builder => {
    builder.addCase(fetchArticle.fulfilled, (state, action) => {
      // action.payload 的类型签名于我们为 `normalize` 传入的泛型相吻合，如果我们愿意的话，我们就可以在 `payload.articles` 读取具体的属性
      articlesAdapter.upsertMany(state, action.payload.articles)
    })
  }
})
```
