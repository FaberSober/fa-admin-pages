interface RouteLocation { pathname: string; search: string; hash: string }
interface CachedTab { key: string; path: string; type?: string }
const routeKey = (location: RouteLocation) => location.pathname + location.search + location.hash;

/** Match the same cache ownership rules used by MenuLayout and TabContentCache. */
export function routeLeaveKeys(current: RouteLocation, next: RouteLocation, tabs: CachedTab[], activeKey: string, registeredKeys: string[], cachedRoutes: ReadonlyMap<string, string> = new Map()): string[] {
  if (routeKey(current) === routeKey(next)) return [];
  if (next.pathname !== '/admin' && !next.pathname.startsWith('/admin/')) return registeredKeys;
  const keys = tabs.some(tab => tab.key === activeKey) ? [] : [activeKey];
  const target = tabs.find(tab => tab.type !== 'iframe' && tab.path === routeKey(next))
    ?? tabs.find(tab => tab.type !== 'iframe' && tab.path === next.pathname);
  if (target && (target.key === activeKey || (cachedRoutes.has(target.key) && cachedRoutes.get(target.key) !== routeKey(next)))) {
    keys.push(target.key);
  }
  return keys;
}
