# Redux工具包（Redux Toolkit） 中文文档

[![build status](https://img.shields.io/travis/reduxjs/redux-toolkit/master.svg?style=flat-square)](https://travis-ci.org/reduxjs/redux-toolkit)
[![npm version](https://img.shields.io/npm/v/@reduxjs/toolkit.svg?style=flat-square)](https://www.npmjs.com/package/@reduxjs/toolkit)
[![npm downloads](https://img.shields.io/npm/dm/@reduxjs/toolkit.svg?style=flat-square&label=RTK+downloads)](https://www.npmjs.com/package/@reduxjs/toolkit)

**一个官方提供用于Redux高效开发的、有想法的、功能齐全的工具包**

(前身为 "Redux快速入门包[Redux Starter Kit]")

## 安装

### 使用 Create React App

推荐用 React 和 Redux工具包 创建新应用的方式是，使用基于集成了React Redux 和 React 组件[Create React App](https://github.com/facebook/create-react-app)的[官方 Redux+JS 模板](https://github.com/reduxjs/cra-template-redux)

```sh
npx create-react-app my-app --template redux
```

### 一个现有的应用

Redux工具包 如今可作为一个NPM包打包进一个模块或一个Node应用：

```bash
# NPM
npm install @reduxjs/toolkit

# Yarn
yarn add @reduxjs/toolkit
```

同时它也可以作为一个定义为`window.RTK`全局变量的预编译UMD包。
UMD包可被直接用作一个[`<script>` 标签](https://unpkg.com/@reduxjs/toolkit/dist/redux-toolkit.umd.js)

## 目的

**Redux工具包** 致力于成为编写 Redux 逻辑的标准方式。它最初是为了帮助解决有关 Redux 的三个常见问题而创建的：

- "配置一个 Redux store 过于复杂"
- "做任何 Redux 的事情我都需要添加很多包"
- "Redux 需要太多的样板代码"

我们不能解决每个用户案例，但本着 [`create-react-app`](https://github.com/facebook/create-react-app) 和 [`apollo-boost`](https://dev-blog.apollodata.com/zero-config-graphql-state-management-27b1f1b3c2c3) 的精神，我们能够尝试提供一些抽象出安装过程及处理最常见用户案例的工具，同时也包含一些会让用户简化他们代码的有用的组件

因此，该程序包的 scope 特意做了限制。它确实 _没_ 处理比如 “可重用的封装Redux模块”，数据缓存，文件夹或文件结构，管理存储中的实体关系等概念。

## 包含内容

Redux工具包 包含了如下API:

- `configureStore()`: 包装 `createStore` 以提供简化的配置选项和良好的默认预设。它可以自动组合你的切片 reducers，添加您提供的任何 Redux 中间件，默认情况下包含 `redux-thunk` ，并允许使用 Redux DevTools 扩展。
- `createReducer()`: 为 case reducer 函数提供 action 类型的查找表，而不是编写switch语句。此外，它会自动使用[`immer` 库](https://github.com/mweststrate/immer)来让您使用普通的可变代码编写更简单的 immutable 更新，例如 `state.todos [3] .completed = true `。
- `createAction()`: 为给定的 action type string 生成一个 action creator 函数。函数本身定义了 `toString()`，因此它可以用来代替 type 常量。
- `createSlice()`: 接受一个 reducer 函数的对象、切片名称和初始状态值，并且自动生成具有相应 action creators 和 action 类型的切片reducer。
- `createAsyncThunk`: 接受一个 action type string 和一个返回 promise 的函数，并生成一个发起基于该 promise 的`pending/fulfilled/rejected` action 类型的 thunk。
- `createEntityAdapter`: 生成一组可重用的 reducers 和 selectors，以管理存储中的规范化数据
- `createSelector` 组件 来自 [Reselect](https://github.com/reduxjs/reselect) 库，为了易用再导出。

## 文档

查看 Redux工具包 中文文档 可访问 **https://redux-toolkit-cn.netlify.app**.

## 翻译人员

- [Matthew Lee](https://github.com/mathxlee)
- [shenjoel](https://github.com/shenjoel)
- [Aubrey](https://github.com/AubreyDDun)
