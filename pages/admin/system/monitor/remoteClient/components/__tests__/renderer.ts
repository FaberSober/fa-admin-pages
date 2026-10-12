import { createRequire } from 'node:module';
import { dirname } from 'node:path';

// 使用项目已有的 React reconciler 在 Node 中运行真实 Hooks，无需 DOM 或浏览器。
const require = createRequire(import.meta.url);
const reconcilerPath = require.resolve('react-reconciler', { paths: [dirname(require.resolve('@react-three/fiber/package.json'))] });
export const renderer = require(reconcilerPath)({
  supportsMutation: true,
  isPrimaryRenderer: true,
  getRootHostContext: () => null,
  getChildHostContext: () => null,
  prepareForCommit: () => null,
  resetAfterCommit: () => {},
  clearContainer: () => {},
  getCurrentEventPriority: () => 16,
  scheduleTimeout: setTimeout,
  cancelTimeout: clearTimeout,
  noTimeout: -1,
});
