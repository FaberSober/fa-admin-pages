import { Fa } from '@fa/ui';
import React, { CSSProperties, useEffect, useId, useState } from 'react';
import { Divider, Skeleton } from 'antd';
import InfiniteScroll from './InfiniteScroll';

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
export default function FaApiScrollList<T>({ apiPage, renderItem, style }: FaApiScrollListProps<T>) {
  const id = useId();
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState<Fa.Pagination>();
  const [data, setData] = useState<T[]>([]);
  const [page, setPage] = useState(1);

  function loadMoreData() {
    if (loading) {
      return;
    }
    setLoading(true);
    apiPage({
      query: {},
      current: page,
      pageSize: 20,
      sorter: 'id DESC'
    }).then(res => {
      setData([...data, ...res.data.rows]);
      setPage(page + 1);
      setPagination(res.data.pagination);
      setLoading(false);
    }).catch(() => setLoading(false));
  }

  useEffect(() => {
    loadMoreData();
  }, []);

  const defaultStyle: CSSProperties = {
    height: '100%',
    overflow: 'auto',
    padding: '0 12px',
    // border: '1px solid rgba(140, 140, 140, 0.35)',
  };

  return (
    <div
      id={id}
      style={{ ...defaultStyle, ...style }}
    >
      <InfiniteScroll
        dataLength={data.length}
        next={loadMoreData}
        hasMore={pagination ? pagination.hasNextPage : true}
        loader={<Skeleton avatar paragraph={{ rows: 1 }} active />}
        endMessage={<Divider plain>数据加载完成～</Divider>}
        scrollableTarget={id}
      >
        {data.map((item, index) => (
          <div key={index}>
            {renderItem(item)}
          </div>
        ))}
      </InfiniteScroll>
    </div>
  );
}
