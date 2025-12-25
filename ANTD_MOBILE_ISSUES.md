# antd-mobile + React 19 Incompatibility Issues

This document summarizes the issues encountered while using `antd-mobile@5.41.1` with `react@19.x` in a Vite-powered environment. These issues led to the decision to migrate to Material-UI.

## 1. Critical Rendering Error: `Element type is invalid: ... undefined`

This was the most persistent and critical bug, causing the application to crash with a "white screen".

- **Symptom:** The app would crash when rendering a modal (`AddProductModal`) that contained `antd-mobile`'s `<Form>` component.
- **Error Message:** `Element type is invalid: expected a string (for built-in components) or a class/function (for composite components) but got: undefined.`
- **Debugging Steps Taken:**
    - Isolated the component with a dedicated Vitest test, which successfully reproduced the error.
    - Ruled out surrounding components like `<Space>` by removing them.
    - Ruled out module resolution issues by switching from bulk imports (`import { X } from 'antd-mobile'`) to direct component imports (`import X from 'antd-mobile/es/components/...'`).
    - The error was finally traced to the **`<Input.TextArea />`** component. The app would render successfully when this specific component was removed, and crash immediately when it was added back.
- **Conclusion:** A fundamental incompatibility exists between certain `antd-mobile` components (especially compound components like `Input.TextArea`) and the React 19 rendering engine in a Vite/Vitest environment.

## 2. Imperative API Crash: `unmountComponentAtNode is not a function`

This error occurred when using `antd-mobile`'s imperative APIs.

- **Symptom:** The application would throw a `TypeError` in a promise when calling APIs like `Dialog.confirm()` or `Toast.show()`. This would sometimes cause subsequent UI interactions to fail.
- **Error Message:** `Uncaught (in promise) TypeError: unmountComponentAtNode is not a function`.
- **Root Cause:** `unmountComponentAtNode` is a legacy `react-dom` API that has been deprecated and removed in React 18+'s `createRoot` API. `antd-mobile`'s imperative components are still using this old API internally to unmount themselves from the DOM, causing a crash in a modern React 19 environment.
- **Workaround:** The issue was resolved by replacing imperative calls (`Dialog.confirm`, `Toast.show`) with their declarative component equivalents (`<Dialog />`) or a native browser API (`window.alert`).

## 3. General Compatibility Warning

The browser console consistently showed a warning from the library itself, confirming the lack of official support.

- **Warning Message:** `Warning: [Compatible] antd-mobile v5 support React is 16 ~ 18. see https://mobile.ant.design/guide/v5-for-19 for compatible.`
