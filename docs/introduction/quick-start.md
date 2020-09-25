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

That said, **these tools should be beneficial to all Redux users**. Whether you're a brand new Redux user setting up your
first project, or an experienced user who wants to simplify an existing application, **Redux Toolkit** can help
you make your Redux code better.

## What's Included

Redux工具包 包含了如下API:

- [`configureStore()`](../api/configureStore.mdx): wraps `createStore` to provide simplified configuration options and good defaults. It can automatically combine your slice reducers, adds whatever Redux middleware you supply, includes `redux-thunk` by default, and enables use of the Redux DevTools Extension.
- [`createReducer()`](../api/createReducer.mdx): that lets you supply a lookup table of action types to case reducer functions, rather than writing switch statements. In addition, it automatically uses the [`immer` library](https://github.com/mweststrate/immer) to let you write simpler immutable updates with normal mutative code, like `state.todos[3].completed = true`.
- [`createAction()`](../api/createAction.mdx): generates an action creator function for the given action type string. The function itself has `toString()` defined, so that it can be used in place of the type constant.
- [`createSlice()`](../api/createSlice.mdx): accepts an object of reducer functions, a slice name, and an initial state value, and automatically generates a slice reducer with corresponding action creators and action types.
- [`createAsyncThunk`](../api/createAsyncThunk.mdx): accepts an action type string and a function that returns a promise, and generates a thunk that dispatches `pending/fulfilled/rejected` action types based on that promise
- [`createEntityAdapter`](../api/createEntityAdapter.mdx): generates a set of reusable reducers and selectors to manage normalized data in the store
- The [`createSelector` utility](../api/createSelector.mdx) from the [Reselect](https://github.com/reduxjs/reselect) library, re-exported for ease of use.

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

The **[#redux channel](https://discord.gg/0ZcbPKXt5bZ6au5t)** of the **[Reactiflux Discord community](http://www.reactiflux.com)** is our official resource for all questions related to learning and using Redux. Reactiflux is a great place to hang out, ask questions, and learn - come join us!

You can also ask questions on [Stack Overflow](https://stackoverflow.com) using the **[#redux tag](https://stackoverflow.com/questions/tagged/redux)**.
