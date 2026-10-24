import { describe, expect, it } from 'vitest';
import type { OpenTabsItem } from './context/MenuLayoutContext';
import { getCloseableTabKeys, getTabCloseKeys, normalizeOpenTabs, reorderOpenTabs } from './tabPolicy';
import { createTabLeaveGuards } from './tabLeaveGuards';

const home: OpenTabsItem = { key: 'home', path: '/admin/home/desktop', name: '工作台', pinned: true, closeable: false };
const monitor: OpenTabsItem = { key: 'monitor', path: '/admin/home/monitor', name: '监控页' };
const editor: OpenTabsItem = { key: 'editor', path: '/admin/editor', name: '编辑器', closeable: true };
const tabs = [home, monitor, editor];

describe('固定工作台与会话恢复', () => {
  it('空会话也保留工作台，恢复后再次归一化不会触发状态更新', () => {
    const restored = normalizeOpenTabs([], home);
    expect(restored).toEqual([home]);
    expect(normalizeOpenTabs(restored, home)).toBe(restored);
  });

  it('将旧会话中的普通工作台固定到首位，并保留原菜单缓存 key', () => {
    const restored = normalizeOpenTabs([monitor, { ...home, pinned: undefined, closeable: true }, editor], home);
    expect(restored).toEqual(tabs);
    expect(restored[0].key).toBe('home');
    expect(restored[1]).toBe(monitor);
    expect(restored[2]).toBe(editor);
  });

  it('合并同一路径的首页并去重，业务标签保持原有顺序', () => {
    const alias = { ...home, key: 'old-home' };
    expect(normalizeOpenTabs([monitor, alias, editor, monitor], home)).toEqual(tabs);
  });

  it('未提供有权限的首页时，不自行创建首页标签', () => {
    const businessTabs = [monitor, editor];
    expect(normalizeOpenTabs(businessTabs)).toBe(businessTabs);
  });
});

describe('关闭操作保护', () => {
  it('直接关闭和批量关闭都跳过固定、不可关闭及不存在的标签', () => {
    const locked = { ...editor, key: 'locked', closeable: false };
    expect(getCloseableTabKeys([...tabs, locked], ['home', 'monitor', 'editor', 'locked', 'missing'])).toEqual(['monitor', 'editor']);
    expect(getTabCloseKeys(tabs, 'home', 'current')).toEqual([]);
  });

  it('左右及其他关闭操作只返回可关闭的业务标签', () => {
    expect(getTabCloseKeys(tabs, 'monitor', 'left')).toEqual([]);
    expect(getTabCloseKeys(tabs, 'monitor', 'right')).toEqual(['editor']);
    expect(getTabCloseKeys(tabs, 'editor', 'left')).toEqual(['monitor']);
    expect(getTabCloseKeys(tabs, 'monitor', 'others')).toEqual(['editor']);
    expect(getTabCloseKeys(tabs, 'home', 'others')).toEqual(['monitor', 'editor']);
    expect(getTabCloseKeys(tabs, 'missing', 'others')).toEqual([]);
    expect(getTabCloseKeys([home], 'home', 'others')).toEqual([]);
  });

  it('关闭最后一个业务标签后保留原工作台对象，缓存 key 不变', () => {
    const current = [home, monitor];
    const closing = getCloseableTabKeys(current, ['home', 'monitor']);
    const remaining = current.filter((tab) => !closing.includes(tab.key));
    expect(remaining).toEqual([home]);
    expect(remaining[0]).toBe(home);
  });

  it('批量关闭仍由未保存内容守卫确认，取消时不移除任何标签', async () => {
    const guards = createTabLeaveGuards();
    let current = tabs;
    let allowed = false;
    guards.register(editor.key, async () => allowed);
    guards.register(home.key, async () => {
      throw new Error('固定入口不应进入关闭守卫');
    });
    const closing = getCloseableTabKeys(
      current,
      current.map((tab) => tab.key),
    );
    const action = () => {
      current = current.filter((tab) => !closing.includes(tab.key));
    };

    expect(await guards.run(closing, action)).toBe(false);
    expect(current).toBe(tabs);
    allowed = true;
    expect(await guards.run(closing, action)).toBe(true);
    expect(current).toEqual([home]);
  });
});

describe('固定入口与拖动排序', () => {
  it('工作台既不能被拖动，也不能作为业务标签的拖动目标', () => {
    expect(reorderOpenTabs(tabs, 'home', 'editor')).toBe(tabs);
    expect(reorderOpenTabs(tabs, 'editor', 'home')).toBe(tabs);
    expect(reorderOpenTabs(tabs, 'missing', 'editor')).toBe(tabs);
  });

  it('业务标签可以正常交换顺序，工作台保持首位', () => {
    expect(reorderOpenTabs(tabs, 'editor', 'monitor')).toEqual([home, editor, monitor]);
    expect(tabs).toEqual([home, monitor, editor]);
  });
});
