import { DeleteOutlined, EditOutlined, MinusCircleOutlined, PlusCircleOutlined, PlusOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { Fa, FaHref, ShiroPermissionContainer, UserSearchSelect, useApiLoading, useDelete } from '@fa/ui';
import { departmentApi } from '@features/fa-admin-pages/services';
import type { TableProps } from 'antd';
import { Button, Empty, Input, Popconfirm, Select, Space, Table, Tag } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import type { Admin } from '@/types';
import DepartmentModal from './modal/DepartmentModal';
import './index.scss';

const serviceName = '部门';

type DepartmentRow = Admin.DepartmentVo & {
  hasChildren: boolean;
  level: number;
  children?: DepartmentRow[];
};

type DepartmentDropPosition = 'before' | 'after';

const departmentTypeMap: Record<string, { text: string; color: string }> = {
  CORP: { text: '公司', color: 'blue' },
  DEPT: { text: '部门', color: 'green' },
  TEAM: { text: '小组', color: 'orange' },
};

const departmentTypeOptions = Object.entries(departmentTypeMap).map(([value, type]) => ({
  label: type.text,
  value,
}));

function parseRows(nodes: Fa.TreeNode<Admin.DepartmentVo, string>[] = []): DepartmentRow[] {
  return nodes.map((node) => {
    const children = node.hasChildren ? parseRows(node.children || []) : undefined;
    return {
      ...node.sourceData,
      id: node.sourceData?.id || node.id,
      parentId: node.sourceData?.parentId || node.parentId,
      name: node.sourceData?.name || node.name,
      hasChildren: node.hasChildren,
      level: node.level,
      children,
    };
  });
}

function collectKeys(rows: DepartmentRow[]): React.Key[] {
  return rows.reduce<React.Key[]>((keys, row) => {
    keys.push(row.id);
    if (row.children && row.children.length > 0) {
      keys.push(...collectKeys(row.children));
    }
    return keys;
  }, []);
}

function countRows(rows: DepartmentRow[]): number {
  return rows.reduce((count, row) => count + 1 + (row.children ? countRows(row.children) : 0), 0);
}

function hasDepartmentFilters(query: Record<string, any>): boolean {
  return Boolean(String(query.name || '').trim() || query.type || query.managerId);
}

function matchesDepartment(row: DepartmentRow, query: Record<string, any>): boolean {
  const name = String(query.name || '')
    .trim()
    .toLowerCase();
  if (
    name &&
    !String(row.name || '')
      .toLowerCase()
      .includes(name)
  )
    return false;
  if (query.type && row.type !== query.type) return false;
  if (query.managerId && row.managerId !== query.managerId) return false;
  return true;
}

function filterDepartmentTree(rows: DepartmentRow[], query: Record<string, any>): DepartmentRow[] {
  if (!hasDepartmentFilters(query)) return rows;

  return rows.flatMap((row) => {
    const children = filterDepartmentTree(row.children || [], query);
    if (!matchesDepartment(row, query) && children.length === 0) return [];

    return [
      {
        ...row,
        children: children.length > 0 ? children : undefined,
        hasChildren: children.length > 0,
      },
    ];
  });
}

function countMatchingRows(rows: DepartmentRow[], query: Record<string, any>): number {
  return rows.reduce((count, row) => count + (matchesDepartment(row, query) ? 1 : 0) + countMatchingRows(row.children || [], query), 0);
}

function findDepartmentRow(rows: DepartmentRow[], id: string): DepartmentRow | undefined {
  for (const row of rows) {
    if (String(row.id) === id) return row;
    const found = findDepartmentRow(row.children || [], id);
    if (found) return found;
  }
  return undefined;
}

function moveDepartmentRow(rows: DepartmentRow[], dragId: string, dropId: string, position: DepartmentDropPosition): DepartmentRow[] {
  let draggedRow: DepartmentRow | undefined;

  function removeDraggedRow(nodes: DepartmentRow[]): DepartmentRow[] {
    return nodes.flatMap((row) => {
      if (String(row.id) === dragId) {
        draggedRow = row;
        return [];
      }
      if (!row.children?.length) return [row];
      return [{ ...row, children: removeDraggedRow(row.children) }];
    });
  }

  function insertDraggedRow(nodes: DepartmentRow[]): DepartmentRow[] {
    return nodes.flatMap((row) => {
      if (String(row.id) === dropId && draggedRow) {
        return position === 'before' ? [draggedRow, row] : [row, draggedRow];
      }
      if (!row.children?.length) return [row];
      return [{ ...row, children: insertDraggedRow(row.children) }];
    });
  }

  const treeWithoutDraggedRow = removeDraggedRow(rows);
  return draggedRow ? insertDraggedRow(treeWithoutDraggedRow) : rows;
}

function flattenDepartmentPositions(rows: DepartmentRow[], parentId = '0'): Fa.TreePosChangeVo[] {
  return rows.flatMap((row, index) => [{ key: String(row.id), index, pid: parentId }, ...flattenDepartmentPositions(row.children || [], String(row.id))]);
}

function getChangedDepartmentPositions(before: DepartmentRow[], after: DepartmentRow[]): Fa.TreePosChangeVo[] {
  const oldPositions = new Map(flattenDepartmentPositions(before).map((item) => [String(item.key), item]));
  return flattenDepartmentPositions(after).filter((item) => {
    const oldItem = oldPositions.get(String(item.key));
    return !oldItem || oldItem.index !== item.index || String(oldItem.pid) !== String(item.pid);
  });
}

/**
 * 部门管理
 * @author xu.pengfei
 * @date 2026-04-28 11:36:29
 */
export default function DepartmentManage() {
  const [query, setQuery] = useState<Record<string, any>>({});
  const [sourceTreeData, setSourceTreeData] = useState<DepartmentRow[]>([]);
  const [expandedRowKeys, setExpandedRowKeys] = useState<React.Key[]>([]);
  const [draggingDepartmentId, setDraggingDepartmentId] = useState<string>();
  const [dragOverDepartment, setDragOverDepartment] = useState<{ id: string; position: DepartmentDropPosition }>();
  const [sortFeedback, setSortFeedback] = useState<'idle' | 'success' | 'error'>('idle');

  const hasFilters = hasDepartmentFilters(query);
  const treeData = useMemo(() => filterDepartmentTree(sourceTreeData, query), [query, sourceTreeData]);
  const matchingCount = hasFilters ? countMatchingRows(sourceTreeData, query) : countRows(sourceTreeData);

  const loading = useApiLoading([departmentApi.getUrl('getTree'), departmentApi.getUrl('remove')]);
  const sortingLoading = useApiLoading([departmentApi.getUrl('changePos')]);

  const [handleDelete] = useDelete<string>(departmentApi.remove, fetchTreeData, serviceName);

  useEffect(() => {
    fetchTreeData();
  }, []);

  function fetchTreeData() {
    departmentApi.getTree().then((res) => {
      const rows = parseRows(res.data || []);
      setSourceTreeData(rows);
      setExpandedRowKeys(collectKeys(rows));
    });
  }

  function updateFilter(name: string, value: any) {
    setQuery((currentQuery) => {
      if (value === undefined || value === null || value === '' || value === 'all') {
        const nextQuery = { ...currentQuery };
        delete nextQuery[name];
        return nextQuery;
      }
      return { ...currentQuery, [name]: value };
    });
  }

  function expandAll() {
    setExpandedRowKeys(collectKeys(treeData));
  }

  function collapseAll() {
    setExpandedRowKeys([]);
  }

  function clearDragState() {
    setDraggingDepartmentId(undefined);
    setDragOverDepartment(undefined);
  }

  function handleDepartmentDragStart(event: React.DragEvent<HTMLTableRowElement>, record: DepartmentRow) {
    if (hasFilters || loading || sortingLoading) {
      event.preventDefault();
      return;
    }
    const id = String(record.id);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', id);
    setDraggingDepartmentId(id);
  }

  function handleDepartmentDragOver(event: React.DragEvent<HTMLTableRowElement>, record: DepartmentRow) {
    const dragId = draggingDepartmentId || event.dataTransfer.getData('text/plain');
    const draggedRow = dragId ? findDepartmentRow(sourceTreeData, dragId) : undefined;
    const sameParent = draggedRow && String(draggedRow.parentId || '0') === String(record.parentId || '0');
    if (!draggedRow || dragId === String(record.id) || !sameParent || hasFilters || loading || sortingLoading) {
      setDragOverDepartment(undefined);
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    const bounds = event.currentTarget.getBoundingClientRect();
    setDragOverDepartment({
      id: String(record.id),
      position: event.clientY < bounds.top + bounds.height / 2 ? 'before' : 'after',
    });
  }

  function handleDepartmentDrop(event: React.DragEvent<HTMLTableRowElement>, record: DepartmentRow) {
    event.preventDefault();
    const dragId = draggingDepartmentId || event.dataTransfer.getData('text/plain');
    const dropPosition = dragOverDepartment?.id === String(record.id) ? dragOverDepartment.position : undefined;
    const draggedRow = dragId ? findDepartmentRow(sourceTreeData, dragId) : undefined;
    const sameParent = draggedRow && String(draggedRow.parentId || '0') === String(record.parentId || '0');

    clearDragState();
    if (!dragId || !dropPosition || !draggedRow || dragId === String(record.id) || !sameParent) return;

    const nextTreeData = moveDepartmentRow(sourceTreeData, dragId, String(record.id), dropPosition);
    const changes = getChangedDepartmentPositions(sourceTreeData, nextTreeData);
    if (changes.length === 0) return;

    setSourceTreeData(nextTreeData);
    setSortFeedback('idle');
    departmentApi
      .changePos(changes)
      .then((res) => {
        if (res.status === Fa.RES_CODE.OK) {
          setSortFeedback('success');
        } else {
          setSortFeedback('error');
        }
        fetchTreeData();
      })
      .catch(() => {
        setSortFeedback('error');
        fetchTreeData();
      });
  }

  function handleRefresh() {
    setSortFeedback('idle');
    fetchTreeData();
  }

  useEffect(() => {
    setExpandedRowKeys(collectKeys(treeData));
  }, [treeData]);

  const columns: TableProps<DepartmentRow>['columns'] = [
    {
      title: '部门名称',
      dataIndex: 'name',
      width: 260,
      render: (value, record) => {
        const name = value || '未命名部门';
        const level = Math.min(Math.max(record.level, 1), 4);
        return (
          <div className={`fa-department-name-cell fa-department-name-cell--level-${level}`} title={name}>
            <span className="fa-department-level-marker" aria-hidden="true" />
            <span className="fa-department-name">{name}</span>
          </div>
        );
      },
    },
    {
      title: '类型',
      dataIndex: 'type',
      width: 100,
      render: (value) => {
        if (!value) return <span className="fa-department-cell-placeholder">—</span>;
        const type = departmentTypeMap[value] || { text: value, color: 'default' };
        return <Tag color={type.color}>{type.text}</Tag>;
      },
    },
    {
      title: '负责人',
      dataIndex: ['manager', 'name'],
      width: 140,
      render: (_, record) => {
        const manager = record.manager?.name || record.managerId;
        return manager ? <span title={manager}>{manager}</span> : <span className="fa-department-cell-placeholder">—</span>;
      },
    },
    {
      title: '排序',
      dataIndex: 'sort',
      width: 90,
      render: (value) => value ?? '—',
    },
    {
      title: '描述',
      dataIndex: 'description',
      ellipsis: true,
      render: (value) => (value ? <span title={value}>{value}</span> : <span className="fa-department-cell-placeholder">—</span>),
    },
    {
      title: '创建时间',
      dataIndex: 'crtTime',
      width: 170,
      render: (value) => value || '—',
    },
    {
      title: '更新时间',
      dataIndex: 'updTime',
      width: 170,
      render: (value) => value || '—',
    },
    {
      title: '操作',
      dataIndex: 'opr',
      width: 240,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <DepartmentModal title="新增子部门" parentId={record.id} fetchFinish={fetchTreeData}>
            <FaHref icon={<PlusOutlined />} text="新增子部门" />
          </DepartmentModal>
          <DepartmentModal title="编辑部门" record={record} fetchFinish={fetchTreeData}>
            <FaHref icon={<EditOutlined />} text="编辑" />
          </DepartmentModal>
          {record.hasChildren ? (
            <ShiroPermissionContainer>
              <FaHref text="删除" disabled tooltip="该部门包含子部门，无法删除，请先处理子部门" />
            </ShiroPermissionContainer>
          ) : (
            <ShiroPermissionContainer>
              <Popconfirm title={`确认删除部门“${record.name}”？`} onConfirm={() => handleDelete(record.id)} placement="topRight">
                <FaHref icon={<DeleteOutlined />} text="删除" color="red" />
              </Popconfirm>
            </ShiroPermissionContainer>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="fa-full-content-p12 fa-flex-column fa-content fa-pl12 fa-pr12 fa-department-page">
      <div className="fa-department-toolbar">
        <div className="fa-department-toolbar__filters">
          <Space className="fa-department-toolbar__filter-controls" size={8} wrap>
            <Input
              className="fa-department-toolbar__keyword"
              prefix={<SearchOutlined />}
              placeholder="搜索部门名称"
              allowClear
              value={query.name || ''}
              onChange={(event) => updateFilter('name', event.target.value)}
            />
            <Select
              className="fa-department-toolbar__type"
              value={query.type || 'all'}
              options={[{ label: '全部类型', value: 'all' }, ...departmentTypeOptions]}
              onChange={(value) => updateFilter('type', value)}
            />
            <div className="fa-department-toolbar__manager">
              <UserSearchSelect
                value={query.managerId}
                placeholder="搜索负责人"
                bodyStyle={{ width: '100%' }}
                style={{ width: '100%' }}
                onChange={(value) => updateFilter('managerId', value)}
              />
            </div>
            <span className="fa-department-toolbar__summary" aria-live="polite">
              {hasFilters ? `命中 ${matchingCount} 项` : `共 ${matchingCount} 项`}
            </span>
            {sortingLoading && (
              <output className="fa-department-toolbar__sort-status fa-department-toolbar__sort-status--saving" aria-live="polite">
                正在保存排序...
              </output>
            )}
            {!sortingLoading && sortFeedback === 'success' && (
              <output className="fa-department-toolbar__sort-status fa-department-toolbar__sort-status--success" aria-live="polite">
                排序已保存
              </output>
            )}
            {!sortingLoading && sortFeedback === 'error' && (
              <output className="fa-department-toolbar__sort-status fa-department-toolbar__sort-status--error" aria-live="polite">
                排序失败，已恢复原顺序
              </output>
            )}
          </Space>
        </div>
        <Space className="fa-department-toolbar__actions">
          <Button icon={<ReloadOutlined />} loading={loading} disabled={sortingLoading} onClick={handleRefresh}>
            刷新
          </Button>
          <Button icon={<MinusCircleOutlined />} disabled={loading || sortingLoading || treeData.length === 0} onClick={collapseAll}>
            折叠
          </Button>
          <Button icon={<PlusCircleOutlined />} disabled={loading || sortingLoading || treeData.length === 0} onClick={expandAll}>
            展开
          </Button>
          <DepartmentModal title="新增部门" parentId={0} fetchFinish={fetchTreeData}>
            <Button type="primary" icon={<PlusOutlined />} disabled={sortingLoading}>
              新增部门
            </Button>
          </DepartmentModal>
        </Space>
      </div>

      <Table<DepartmentRow>
        rowKey="id"
        className="fa-department-table fa-mt12"
        columns={columns}
        dataSource={treeData}
        loading={loading}
        pagination={false}
        size="middle"
        sticky={{ offsetHeader: 56 }}
        tableLayout="fixed"
        scroll={{ x: 1280 }}
        locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无部门数据" /> }}
        rowClassName={(record) => {
          const rowId = String(record.id);
          const classNames = ['fa-department-row'];
          if (draggingDepartmentId === rowId) classNames.push('fa-department-row--dragging');
          if (dragOverDepartment?.id === rowId) classNames.push(`fa-department-row--drop-${dragOverDepartment.position}`);
          return classNames.join(' ');
        }}
        onRow={(record) => ({
          draggable: !hasFilters && !loading && !sortingLoading,
          onDragStart: (event) => handleDepartmentDragStart(event, record),
          onDragOver: (event) => handleDepartmentDragOver(event, record),
          onDrop: (event) => handleDepartmentDrop(event, record),
          onDragEnd: clearDragState,
        })}
        expandable={{
          expandedRowKeys,
          rowExpandable: (record) => record.hasChildren,
          onExpandedRowsChange: (keys) => setExpandedRowKeys([...keys]),
        }}
      />
    </div>
  );
}
