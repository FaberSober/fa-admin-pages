import React, { useMemo, useState } from 'react';
import { isNil } from 'lodash';
import { Empty, Input, Segmented } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import './FaCubeGrid.scss';

export interface FaCubeGridItem {
  i: string;  // 组件唯一key
}

export interface FaCubeGridProps {
  /** 所有可用组件列表 */
  allLayout: FaCubeGridItem[];
  /** cubes 模块，key 对应 FaCubeGridItem.i */
  cubes: Record<string, any>;
  /** 已选中的组件 key 列表 */
  selectedIds: string[];
  /** 点击添加 */
  onAdd: (id: string) => void;
  /** 点击移除 */
  onRemove: (id: string) => void;
}

type CubeFilter = 'all' | 'added' | 'available';

/**
 * 工作台组件选择网格
 * @author xu.pengfei
 * @date 2026-03-03
 */
export default function FaCubeGrid({ allLayout, cubes, selectedIds, onAdd, onRemove }: FaCubeGridProps) {
  const [keyword, setKeyword] = useState('');
  const [filter, setFilter] = useState<CubeFilter>('all');

  const selectedCount = allLayout.filter((item) => selectedIds.includes(item.i)).length;
  const filteredLayout = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();

    return allLayout.filter((item) => {
      const Component = cubes[item.i];
      if (isNil(Component)) return false;

      const selected = selectedIds.includes(item.i);
      if (filter === 'added' && !selected) return false;
      if (filter === 'available' && selected) return false;

      if (!normalizedKeyword) return true;
      return [Component.title, Component.description]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedKeyword));
    });
  }, [allLayout, cubes, filter, keyword, selectedIds]);

  return (
    <>
      <div className="fa-cube-grid-toolbar">
        <Input
          allowClear
          prefix={<SearchOutlined />}
          placeholder="搜索组件名称或说明"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
        />
        <Segmented
          block
          value={filter}
          options={[
            { label: `全部 ${allLayout.length}`, value: 'all' },
            { label: `未添加 ${allLayout.length - selectedCount}`, value: 'available' },
            { label: `已添加 ${selectedCount}`, value: 'added' },
          ]}
          onChange={(value) => setFilter(value as CubeFilter)}
        />
        <div className="fa-cube-grid-summary">已添加 {selectedCount} / {allLayout.length} 个组件</div>
      </div>

      {filteredLayout.length > 0 ? (
        <div className="fa-cube-grid">
          {filteredLayout.map((item) => {
            const Component = cubes[item.i];
            if (isNil(Component)) return null;
            const sel = selectedIds.indexOf(item.i) > -1;
            return (
              <div
                key={item.i}
                className={`fa-cube-grid-item${sel ? ' selected' : ''}`}
                onClick={() => {
                  if (sel) {
                    onRemove(item.i);
                  } else {
                    onAdd(item.i);
                  }
                }}
              >
                {sel && <span className="fa-cube-grid-item-check">✓</span>}
                <div className={`fa-cube-grid-item-title${sel ? ' has-check' : ''}`}>
                  {Component.title}
                </div>
                {Component.description && (
                  <div className="fa-cube-grid-item-desc">
                    {Component.description}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <Empty className="fa-cube-grid-empty" image={Empty.PRESENTED_IMAGE_SIMPLE} description={keyword ? '没有找到匹配的组件' : '暂无可用组件'} />
      )}
    </>
  );
}
