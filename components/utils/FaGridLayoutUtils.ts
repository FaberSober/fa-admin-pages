import { Fa, FaUtils, useApiLoading } from '@fa/ui';
import MenuLayoutContext from '@features/fa-admin-pages/layout/menu/context/MenuLayoutContext';
import { configApi } from '@features/fa-admin-pages/services';
import { Modal } from 'antd';
import { each, isEqual } from 'lodash';
import { useContext, useEffect, useRef, useState } from 'react';
import { collides, type Layout, type LayoutItem } from 'react-grid-layout';
import type { Admin } from '@/types';

/**
 * HelloBanner.displayName = 'HelloBanner'; // 必须与方法名称一致
HelloBanner.title = '欢迎';
HelloBanner.description = '欢迎组件';
HelloBanner.showTitle = false; // 是否展示Card的Title
HelloBanner.permission = ''; // 需要的权限-对应RbacMenu.linkUrl
HelloBanner.w = 24; // 宽度-网格-max=24
HelloBanner.h = 3; // 高度-每个单位20px
 */
export interface CubeItem {
  displayName: string;
  title: string;
  description: string;
  showTitle: boolean;
  permission?: string;
  w: number;
  h: number;
}

/**
 * 解析homecubes类似组件输出全部布局配置
 * @param cubes
 */
export function parseAllLayout(cubes: CubeItem[]) {
  const allLayout: LayoutItem[] = [];
  each(cubes, (k) => {
    allLayout.push({
      i: k.displayName,
      w: k.w,
      h: k.h,
      x: 0,
      y: 0,
    });
  });
  return allLayout;
}

export function useAllLayout(cubes: CubeItem[]): { allLayout: LayoutItem[] } {
  const { menuList } = useContext(MenuLayoutContext);
  const permissions = menuList.map((i) => i.linkUrl);

  const allLayout: LayoutItem[] = [];
  each(cubes, (k) => {
    if (!FaUtils.hasPermission(permissions, k.permission)) {
      return;
    }

    allLayout.push({
      i: k.displayName,
      w: k.w,
      h: k.h,
      x: 0,
      y: 0,
    });
  });

  return { allLayout };
}

export function calAddLayout(cubes: CubeItem[], layout: Layout, addId: string|number): Layout {
  const Component = (cubes as any)[addId];
  if (
    !Component ||
    typeof Component.displayName !== 'string' ||
    !Number.isInteger(Component.w) ||
    !Number.isInteger(Component.h) ||
    Component.w <= 0 ||
    Component.w > 24 ||
    Component.h <= 0
  ) {
    return layout;
  }

  // ponytail: first-fit scan is O(rows * cols * layout.length), sufficient for the small workbench layout.
  for (let y = 0; ; y += 1) {
    for (let x = 0; x + Component.w <= 24; x += 1) {
      const candidate = {
        i: Component.displayName,
        w: Component.w,
        h: Component.h,
        x,
        y,
      };
      if (!layout.some((item) => collides(item, candidate))) {
        return [...layout, Object.assign(candidate, { id: FaUtils.uuid() })];
      }
    }
  }
}

/** 按组件声明的尺寸生成默认布局。 */
export function createDefaultLayout(cubes: CubeItem[], ids: Array<string | number>): Layout {
  return ids.reduce<Layout>((layout, id) => {
    return (cubes as any)[id] ? calAddLayout(cubes, layout, id) : layout;
  }, []);
}

export function useGridLayoutConfig(
  cubes: any,
  biz: string,
  type: string,
  defaultLayout: LayoutItem[],
  normalizeGlobalLayout?: (layout: Layout) => Layout,
) {
  const loading = useApiLoading([ configApi.getUrl('save'), configApi.getUrl('update')]);

  const [config, setConfig] = useState<Admin.Config<LayoutItem[]>>();
  const [layout, setLayout] = useState<Layout>([]);
  const configRef = useRef<Admin.Config<LayoutItem[]>>();
  const initializingRef = useRef(true);
  const skipInitialLayoutChangeRef = useRef(false);
  const controlledLayoutRef = useRef<Layout | undefined>(undefined);
  const savingRef = useRef(false);
  const pendingLayoutRef = useRef<Layout | undefined>(undefined);
  const failedLayoutRef = useRef<Layout | undefined>(undefined);

  function applyLayout(nextLayout: Layout, nextConfig?: Admin.Config<LayoutItem[]>) {
    skipInitialLayoutChangeRef.current = nextLayout.length > 0;
    configRef.current = nextConfig;
    setConfig(nextConfig);
    setLayout(nextLayout);
    initializingRef.current = false;
  }

  useEffect(() => {
    initializingRef.current = true;
    skipInitialLayoutChangeRef.current = false;
    controlledLayoutRef.current = undefined;

    configApi.getOne(biz, type).then((res) => {
      if (res.data) {
        applyLayout(res.data.data, res.data);
        return;
      }

      // 未找到，去查找全局是否有配置
      return configApi.getOneGlobal(biz, type).then((res1) => {
        const globalLayout = res1.data?.data;
        applyLayout(globalLayout ? (normalizeGlobalLayout?.(globalLayout) ?? globalLayout) : defaultLayout);
      });
    }).catch(() => {
      // 请求层负责错误提示；初始化失败后允许用户继续操作布局。
      initializingRef.current = false;
    });
  }, []);

  function submitLayout(nextLayout: Layout) {
    savingRef.current = true;
    const currentConfig = configRef.current;
    const params = {
      biz,
      type,
      data: nextLayout,
    };
    const request = currentConfig
      ? configApi.update(currentConfig.id, { id: currentConfig.id, ...params })
      : configApi.save(params);

    request
      .then((res) => {
        if (!currentConfig && res.data) {
          configRef.current = res.data;
          setConfig(res.data);
        }
        failedLayoutRef.current = undefined;
      })
      .catch(() => {
        failedLayoutRef.current = nextLayout;
      })
      .finally(() => {
        savingRef.current = false;
        const pendingLayout = pendingLayoutRef.current;
        pendingLayoutRef.current = undefined;
        if (pendingLayout !== undefined) {
          submitLayout(pendingLayout);
        }
      });
  }

  function commitLayout(nextLayout: Layout) {
    controlledLayoutRef.current = nextLayout;
    setLayout(nextLayout);
    if (savingRef.current) {
      pendingLayoutRef.current = nextLayout;
      return;
    }
    failedLayoutRef.current = undefined;
    submitLayout(nextLayout);
  }

  function retryLayout() {
    const failedLayout = failedLayoutRef.current;
    if (failedLayout === undefined || savingRef.current) return;

    failedLayoutRef.current = undefined;
    commitLayout(failedLayout);
  }

  function onLayoutChange(nextLayout: Layout) {
    if (initializingRef.current) return;
    if (skipInitialLayoutChangeRef.current) {
      skipInitialLayoutChangeRef.current = false;
      setLayout(nextLayout);
      return;
    }

    if (controlledLayoutRef.current !== undefined) {
      const controlledLayout = controlledLayoutRef.current;
      controlledLayoutRef.current = undefined;
      if (isEqual(controlledLayout, nextLayout)) return;
    }

    commitLayout(nextLayout);
  }

  /**
   * 添加item到布局中
   * @param id
   */
  function handleAdd(id: string|number) {
    const newLayout = calAddLayout(cubes, layout, id);
    setLayout(newLayout);
  }

  function handleDel(id: string) {
    setLayout(layout.filter((i) => i.i !== id));
  }

  function handleSaveCurAsDefault() {
    Modal.confirm({
      title: '确认',
      content: '确认保存当前为默认配置，全局生效？',
      onOk: () => {
        const params = {
          biz,
          type,
          data: layout,
        };
        return configApi.saveGlobal(params).then((res) => FaUtils.showResponse(res, '保存当前为默认配置'));
      },
    });
  }

  function handleClearAllUserConfig() {
    Modal.confirm({
      title: '确认',
      content: '确认清空全部用户缓存？',
      onOk: () => {
        const params = {
          query: { biz, type },
        };
        return configApi.removeByQuery(params).then((res) => {
          FaUtils.showResponse(res, '清空全部用户缓存');
          if (res.status !== Fa.RES_CODE.OK) return;

          initializingRef.current = true;
          skipInitialLayoutChangeRef.current = false;
          controlledLayoutRef.current = undefined;
          pendingLayoutRef.current = undefined;
          failedLayoutRef.current = undefined;
          configRef.current = undefined;
          setConfig(undefined);

          return configApi.getOneGlobal(biz, type).then((globalRes) => {
            const globalLayout = globalRes.data?.data;
            applyLayout(globalLayout ? (normalizeGlobalLayout?.(globalLayout) ?? globalLayout) : defaultLayout);
          }).catch(() => {
            applyLayout(defaultLayout);
          });
        });
      },
    });
  }

  return {
    config,
    layout,
    setLayout,
    loading,
    onLayoutChange,
    retryLayout,
    handleAdd,
    handleDel,
    handleSaveCurAsDefault,
    handleClearAllUserConfig,
  };
}
