# Redux工具包（Redux Toolkit） 中文文档

[![build status](https://img.shields.io/travis/reduxjs/redux-toolkit/master.svg?style=flat-square)](https://travis-ci.org/reduxjs/redux-toolkit)
[![npm version](https://img.shields.io/npm/v/@reduxjs/toolkit.svg?style=flat-square)](https://www.npmjs.com/package/@reduxjs/toolkit)
[![npm downloads](https://img.shields.io/npm/dm/@reduxjs/toolkit.svg?style=flat-square&label=RTK+downloads)](https://www.npmjs.com/package/@reduxjs/toolkit)

**一个官方提供用于Redux高效开发，有想法的、功能齐全的工具包**

(前身为 "Redux Starter Kit")

## 安装

### 使用 Create React App

The recommended way to start new apps with React and Redux Toolkit is by using the [official Redux+JS template](https://github.com/reduxjs/cra-template-redux) for [Create React App](https://github.com/facebook/create-react-app), which takes advantage of React Redux's integration with React components.

```sh
npx create-react-app my-app --template redux
```

### An Existing App

Redux Toolkit is available as a package on NPM for use with a module bundler or in a Node application:

```bash
# NPM
npm install @reduxjs/toolkit

# Yarn
yarn add @reduxjs/toolkit
```

It is also available as a precompiled UMD package that defines a `window.RTK` global variable.
The UMD package can be used as a [`<script>` tag](https://unpkg.com/@reduxjs/toolkit/dist/redux-toolkit.umd.js) directly.

## 目的

The **Redux工具包** package is intended to be the standard way to write Redux logic. It was originally created to help address three common concerns about Redux:

- "Configuring a Redux store is too complicated"
- "I have to add a lot of packages to get Redux to do anything useful"
- "Redux requires too much boilerplate code"

We can't solve every use case, but in the spirit of [`create-react-app`](https://github.com/facebook/create-react-app) and [`apollo-boost`](https://dev-blog.apollodata.com/zero-config-graphql-state-management-27b1f1b3c2c3), we can try to provide some tools that abstract over the setup process and handle the most common use cases, as well as include some useful utilities that will let the user simplify their application code.

Because of that, this package is deliberately limited in scope. It does _not_ address concepts like "reusable encapsulated Redux modules", data caching, folder or file structures, managing entity relationships in the store, and so on.

## What's Included

Redux工具包包含了如下API:

- `configureStore()`: wraps `createStore` to provide simplified configuration options and good defaults. It can automatically combine your slice reducers, adds whatever Redux middleware you supply, includes `redux-thunk` by default, and enables use of the Redux DevTools Extension.
- `createReducer()`: that lets you supply a lookup table of action types to case reducer functions, rather than writing switch statements. In addition, it automatically uses the [`immer` library](https://github.com/mweststrate/immer) to let you write simpler immutable updates with normal mutative code, like `state.todos[3].completed = true`.
- `createAction()`: generates an action creator function for the given action type string. The function itself has `toString()` defined, so that it can be used in place of the type constant.
- `createSlice()`: accepts an object of reducer functions, a slice name, and an initial state value, and automatically generates a slice reducer with corresponding action creators and action types.
- `createAsyncThunk`: accepts an action type string and a function that returns a promise, and generates a thunk that dispatches `pending/resolved/rejected` action types based on that promise
- `createEntityAdapter`: generates a set of reusable reducers and selectors to manage normalized data in the store
- The `createSelector` utility from the [Reselect](https://github.com/reduxjs/reselect) library, re-exported for ease of use.

## 文档

The Redux Toolkit docs are available at **https://redux-toolkit-cn.netlify.app**.
