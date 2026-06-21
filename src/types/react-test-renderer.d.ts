// react-test-renderer ships no bundled types and @types lags React 19.
// Test-only ambient declaration so `npx tsc --noEmit` stays clean; the
// renderer is used by hook tests (e.g. src/sdk/flow/__tests__/useFlow.test.tsx).
declare module 'react-test-renderer';
