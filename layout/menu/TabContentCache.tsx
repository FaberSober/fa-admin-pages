import { PageLoading } from '@fa/ui';
import { TabErrorBoundary } from '@features/fa-admin-pages/components/exception';
import { type ReactNode, Suspense, useEffect, useMemo, useState } from 'react';
import type { OpenTabsItem } from './context/MenuLayoutContext';

interface TabContentCacheProps {
  activeKey: string;
  currentPathname: string;
  currentRouteKey: string;
  currentOutlet: ReactNode;
  openTabs: OpenTabsItem[];
  reloadKeys: Record<string, number>;
  onReload: (tabKey: string) => void;
}

interface TabCacheEntry {
  routeKey: string;
  outlet: ReactNode;
}

interface IframeTabContentProps {
  src: string;
  title: string;
}

function IframeTabContent({ src, title }: IframeTabContentProps) {
  return (
    <iframe title={title} src={src} sandbox="allow-scripts" className="fa-full-content" style={{ width: '100%', height: '100%', border: 'none', margin: 0 }} />
  );
}

/**
 * 保持已经访问过的 Tab 页面实例，切换 Tab 时只隐藏面板，不卸载页面。
 *
 * currentOutlet 必须是 useOutlet() 返回的已匹配路由节点，不能传入原始 Outlet 组件，
 * 否则所有缓存面板仍会跟随当前 URL 渲染同一个页面。
 */
export default function TabContentCache({ activeKey, currentPathname, currentRouteKey, currentOutlet, openTabs, reloadKeys, onReload }: TabContentCacheProps) {
  const [entries, setEntries] = useState<Map<string, TabCacheEntry>>(() => new Map());

  const tabsByKey = useMemo(() => {
    const result = new Map<string, OpenTabsItem>();
    openTabs.forEach((tab) => {
      result.set(tab.key, tab);
    });
    return result;
  }, [openTabs]);
  const activeTab = tabsByKey.get(activeKey);
  const currentRouteBelongsToActiveTab =
    activeTab === undefined || activeTab.type === 'iframe' || activeTab.path === currentRouteKey || activeTab.path === currentPathname;

  const tabKeys = useMemo(() => {
    const keys = openTabs.map((tab) => tab.key);
    if (!keys.includes(activeKey)) {
      keys.push(activeKey);
    }
    return Array.from(new Set(keys));
  }, [activeKey, openTabs]);

  // 当前 URL 对应的路由出口首次渲染后，保存为当前 Tab 的缓存内容。
  useEffect(() => {
    // 关闭当前 Tab 时，activeKey 可能已经切到下一个 Tab，但 URL 仍是旧 Tab。
    // 此时不能把旧 Tab 的 outlet 覆盖到新 Tab 的缓存中。
    if (activeTab?.type === 'iframe' || !currentRouteBelongsToActiveTab || currentOutlet === undefined || currentOutlet === null) {
      return;
    }

    setEntries((previous) => {
      const existing = previous.get(activeKey);
      if (existing?.routeKey === currentRouteKey) {
        return previous;
      }

      const next = new Map(previous);
      next.set(activeKey, { routeKey: currentRouteKey, outlet: currentOutlet });
      return next;
    });
  }, [activeKey, activeTab?.type, currentOutlet, currentRouteBelongsToActiveTab, currentRouteKey]);

  // 关闭 Tab 后移除对应的 React 节点引用，使页面生命周期正常结束并释放内存。
  useEffect(() => {
    const validKeys = new Set(tabKeys);
    setEntries((previous) => {
      let changed = false;
      const next = new Map(previous);

      next.forEach((_, key) => {
        if (!validKeys.has(key)) {
          next.delete(key);
          changed = true;
        }
      });

      return changed ? next : previous;
    });
  }, [tabKeys]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: 0, overflow: 'hidden' }}>
      {tabKeys.map((tabKey) => {
        const tab = tabsByKey.get(tabKey);
        const isActive = tabKey === activeKey;
        const entry = entries.get(tabKey);
        const outlet = isActive && currentRouteBelongsToActiveTab ? currentOutlet : entry?.outlet;

        // iframe Tab 的原始路由都是 /admin/iframe，必须按 Tab 自己的 path 隔离实例。
        const content = tab?.type === 'iframe' ? <IframeTabContent src={tab.path} title={tab.name} /> : outlet;

        if (content === undefined || content === null) {
          return null;
        }

        return (
          <div
            key={tabKey}
            aria-hidden={!isActive}
            style={{
              position: 'absolute',
              inset: 0,
              display: isActive ? undefined : 'none',
              overflowX: 'hidden',
              overflowY: 'auto',
            }}
          >
            <Suspense fallback={<PageLoading />}>
              <TabErrorBoundary key={`${tabKey}-${reloadKeys[tabKey] ?? 0}`} onReload={() => onReload(tabKey)}>
                {content}
              </TabErrorBoundary>
            </Suspense>
          </div>
        );
      })}
    </div>
  );
}
