import { Fa } from '@fa/ui';
import React, { CSSProperties } from 'react';

export interface FaApiScrollListProps<T> {
  /** page分页获取接口 */
  apiPage: (params: Fa.BasePageProps) => Promise<Fa.Ret<Fa.Page<T>>>,
  /** 列表项渲染组件 */
  renderItem: (item: T) => React.ReactNode;
  /** 最外层div样式 */
  style?: CSSProperties;
}

/**
 * 基于page分页接口的滚动列表
 * 1. 默认加载第一页，每页20条数据；
 * 2. 滚动到底部自动加载下一页；
 * @author xu.pengfei
 * @date 2025-08-28 21:39:55
 */
export default function FaApiScrollList<T>({}: FaApiScrollListProps<T>) {
  return (
    <InfiniteScroll></InfiniteScroll>
  );
}
