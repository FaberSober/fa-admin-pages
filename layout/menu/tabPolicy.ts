import type { OpenTabsItem } from './context/MenuLayoutContext';

/** 使用有权限的首页菜单作为固定入口，兼容已缓存的普通首页 Tab。 */
export function normalizeOpenTabs(tabs: OpenTabsItem[], homeTab?: OpenTabsItem): OpenTabsItem[] {
  const candidates = homeTab ? [homeTab, ...tabs.filter((tab) => tab.key !== homeTab.key && !(tab.type !== 'iframe' && tab.path === homeTab.path))] : tabs;
  const seen = new Set<string>();
  const unique = candidates.filter((tab) => {
    if (seen.has(tab.key)) return false;
    seen.add(tab.key);
    return true;
  });
  const ordered = [...unique.filter((tab) => tab.pinned), ...unique.filter((tab) => !tab.pinned)];
  return ordered.length === tabs.length && ordered.every((tab, index) => tab === tabs[index]) ? tabs : ordered;
}

export function getCloseableTabKeys(tabs: OpenTabsItem[], keys: string[]): string[] {
  const requested = new Set(keys);
  return tabs.filter((tab) => requested.has(tab.key) && !tab.pinned && tab.closeable !== false).map((tab) => tab.key);
}

export function getTabCloseKeys(tabs: OpenTabsItem[], targetKey: string, scope: 'current' | 'left' | 'right' | 'others'): string[] {
  const targetIndex = tabs.findIndex((tab) => tab.key === targetKey);
  if (targetIndex < 0) return [];
  const candidates = tabs.filter((_, index) => {
    if (scope === 'current') return index === targetIndex;
    if (scope === 'left') return index < targetIndex;
    if (scope === 'right') return index > targetIndex;
    return index !== targetIndex;
  });
  return getCloseableTabKeys(
    candidates,
    candidates.map((tab) => tab.key),
  );
}

export function reorderOpenTabs(tabs: OpenTabsItem[], activeKey: string, overKey: string): OpenTabsItem[] {
  const from = tabs.findIndex((tab) => tab.key === activeKey);
  const to = tabs.findIndex((tab) => tab.key === overKey);
  if (from < 0 || to < 0 || from === to || tabs[from].pinned || tabs[to].pinned) return tabs;
  const next = [...tabs];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}
