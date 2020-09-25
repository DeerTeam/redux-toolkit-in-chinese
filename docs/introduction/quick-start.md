---
id: quick-start
title: 快速开始
sidebar_label: 快速开始
hide_title: true
---

# 快速开始

## 目的

**Redux工具包** 致力于成为编写 Redux 逻辑的标准方式。它最初是为了帮助解决有关 Redux 的三个常见问题而创建的：

- "配置一个 Redux store 过于复杂"
- "做任何 Redux 的事情我都需要添加很多包"
- "Redux 需要太多的样板代码"

我们不能解决每个用户案例，但本着 [`create-react-app`](https://github.com/facebook/create-react-app) 和 [`apollo-boost`](https://dev-blog.apollodata.com/zero-config-graphql-state-management-27b1f1b3c2c3) 的精神，我们能够尝试提供一些抽象出安装过程及处理最常见用户案例的工具，同时也包含一些会让用户简化他们代码的有用的组件

因此，该程序包的 scope 特意做了限制。它确实 _没_ 处理比如 “可重用的封装Redux模块”，数据缓存，文件夹或文件结构，管理存储中的实体关系等概念。

也就是说，**这些工具将会对所有Redux用户都有益**。无论你是要设置自己的第一个项目的全新的 Redux 用户，或是想简化现有应用程序的有经验的用户，**Redux工具包**可以帮助你让你的 Redux 代码更好。

## 包含内容

Redux工具包 包含了如下API:

- [`configureStore()`](../api/configureStore.mdx): 包装 `createStore` 以提供简化的配置选项和良好的默认预设。它可以自动组合你的切片 reducers，添加您提供的任何 Redux 中间件，默认情况下包含 `redux-thunk` ，并允许使用 Redux DevTools 扩展。
- [`createReducer()`](../api/createReducer.mdx): 为 case reducer 函数提供 action types 的查找表，而不是编写switch语句。此外，它会自动使用[`immer` 库](https://github.com/mweststrate/immer)来让您使用普通的可变代码编写更简单的 immutable 更新，例如 `state.todos [3] .completed = true `。
- [`createAction()`](../api/createAction.mdx): 为给定的 action type string 生成一个 action creator 函数。函数本身定义了 `toString()`，因此它可以用来代替 type 常量。
- [`createSlice()`](../api/createSlice.mdx): 接受一个 reducer 函数的对象、分片名称和初始状态值，并且自动生成具有相应 action creators 和 action types 的分片reducer。
- [`createAsyncThunk`](../api/createAsyncThunk.mdx): 接受一个 action type string 和一个返回 promise 的函数，并生成一个发起基于该 promise 的`pending/fulfilled/rejected` action types 的 thunk。
- [`createEntityAdapter`](../api/createEntityAdapter.mdx): 生成一组可重用的 reducers 和 selectors，以管理存储中的规范化数据
- [`createSelector` 组件](../api/createSelector.mdx) 来自 [Reselect](https://github.com/reduxjs/reselect) 库，为了易用再导出。

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

## 帮助和讨论


**[Reactiflux Discord 社区](http://www.reactiflux.com)** 的 **[#redux 频道](https://discord.gg/0ZcbPKXt5bZ6au5t)** 是我们学习和使用 Redux 有关所有问题的官方资源。 Reactiflux是一个聚会，提问和学习的好地方 - 快来加入我们吧！

你也可以使用 **[#redux 标签](https://stackoverflow.com/questions/tagged/redux)** 在 [Stack Overflow](https://stackoverflow.com) 向我们提问。
