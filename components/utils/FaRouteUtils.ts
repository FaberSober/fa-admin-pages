/**
 * 匹配路径，如：/admin/blog/123，匹配成功后返回：/admin/blog/:id
 * @param pathname 如：/admin/blog/123
 * @param routeList 全部的路径List
 */
export function matchRoute(pathname: string, routeList: string[]) {
  for (let i = 0; i < routeList.length; i += 1) {
    const route = routeList[i];
    if (pathname === route) {
      return route;
    }
    // 如果包含:id格式
    if (route.indexOf(':') > -1) {
      const routePre = route.substring(0, route.indexOf(':'));
      const matchId = pathname.replace(routePre, '');
      // 如果匹配后的 matchId 不包含 / ，则判定为匹配成功
      if (matchId.indexOf('/') === -1) {
        return route;
      }
    }
  }
  return undefined;
}

/**
 * 按路径前缀匹配最近的菜单，如：/admin/ai/agent/edit/1 匹配 /admin/ai/agent。
 * 多个菜单都匹配时，返回 linkUrl 最长的菜单。
 * @param pathname 当前页面路径
 * @param menuList 菜单列表
 */
export function matchNearestPathMenu<T extends { linkUrl?: string }>(pathname: string, menuList: T[]) {
  return menuList
    .filter((menu) => {
      const linkUrl = menu.linkUrl;
      if (!linkUrl || linkUrl === '/') return false;
      return pathname === linkUrl || pathname.startsWith(`${linkUrl}/`);
    })
    .sort((a, b) => (b.linkUrl?.length || 0) - (a.linkUrl?.length || 0))[0];
}
