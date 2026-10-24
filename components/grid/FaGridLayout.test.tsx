import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FaGridLayout } from './FaGridLayout';

const state = vi.hoisted(() => ({ width: 1440, mounted: true, lastVisibleWidth: 0, gridWidths: [] as number[] }));

// 在 Node 中模拟宽度观测和跨渲染保留的状态，无需浏览器或 DOM 环境。
vi.mock('react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react')>()),
  useState: () => [
    state.lastVisibleWidth,
    (width: number) => {
      state.lastVisibleWidth = width;
    },
  ],
  useLayoutEffect: (effect: () => void) => {
    effect();
  },
}));

vi.mock('react-grid-layout', () => ({
  useContainerWidth: () => ({ width: state.width, mounted: state.mounted, containerRef: { current: null } }),
  verticalCompactor: {},
  ReactGridLayout: ({ width, children }: { width: number; children: import('react').ReactNode }) => {
    state.gridWidths.push(width);
    return <div>{children}</div>;
  },
}));

function renderGrid() {
  return renderToStaticMarkup(<FaGridLayout layout={[{ i: 'card', x: 0, y: 0, w: 6, h: 4 }]} renderItem={() => <div>缓存卡片</div>} />);
}

beforeEach(() => {
  state.width = 1440;
  state.mounted = true;
  state.lastVisibleWidth = 0;
  state.gridWidths = [];
});

describe('缓存 Tab 的网格宽度', () => {
  it('隐藏期间保留最后有效宽度，切回时不会从 0 展开', () => {
    renderGrid();
    state.width = 0;
    expect(renderGrid()).toContain('缓存卡片');
    state.width = 1440;
    renderGrid();

    expect(state.gridWidths).toEqual([1440, 1440, 1440]);
  });

  it('仍会适应有效宽度变化，并在后续隐藏时保留新宽度', () => {
    renderGrid();
    state.width = 1080;
    renderGrid();
    state.width = 0;
    renderGrid();

    expect(state.gridWidths).toEqual([1440, 1080, 1080]);
  });

  it('首次未测量完成或在隐藏状态挂载时，等待有效宽度再渲染网格', () => {
    state.mounted = false;
    renderGrid();
    state.mounted = true;
    state.width = 0;
    renderGrid();
    expect(state.gridWidths).toEqual([]);

    state.width = 1080;
    expect(renderGrid()).toContain('缓存卡片');
    expect(state.gridWidths).toEqual([1080]);
  });
});
