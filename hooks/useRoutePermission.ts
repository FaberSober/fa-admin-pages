import { find, findIndex } from 'lodash';
import * as FaRouteUtils from '@features/fa-admin-pages/components/utils/FaRouteUtils';
import type { Rbac } from '@/types';
import useRoutesList from './useRoutesList';
import { useMemo } from 'react';
import type { OpenTabsItem } from '../layout/menu/context/MenuLayoutContext';

/**
 * 判断当前路径是否有访问权限
 * @author xu.pengfei
 * @date 2023/7/26 17:30
 */
export default function useRoutePermission(menuList: Rbac.RbacMenu[], openTabs: OpenTabsItem[] = []): [hasPermission: boolean] {
  const routesList = useRoutesList();

  const hasPermission = useMemo(() => {
    const matchRoute = FaRouteUtils.matchRoute(location.pathname, routesList);

    const index = findIndex(menuList, (menu) => {
      return menu.linkUrl === location.pathname || menu.linkUrl === matchRoute;
    });

    if (index > -1) return true;

    const nearestMenu = FaRouteUtils.matchNearestPathMenu(location.pathname, menuList);
    if (nearestMenu) return true;

    const openTab = find(openTabs, (tab) => tab.path === location.pathname || tab.path === matchRoute || tab.key === location.pathname);
    if (!openTab?.linkMenuId) return false;

    return findIndex(menuList, (menu) => menu.id === openTab.linkMenuId) > -1;
  }, [location.pathname, menuList, openTabs, routesList]);

  return [hasPermission];
}
