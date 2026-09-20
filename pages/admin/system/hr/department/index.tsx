import { DeleteOutlined, EditOutlined, MinusCircleOutlined, PlusCircleOutlined, PlusOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { BaseTree, Fa, FaFlexRestLayout, FaHref, ShiroPermissionContainer, UserSearchSelect, useApiLoading, useDelete } from '@fa/ui';
import { departmentApi } from '@features/fa-admin-pages/services';
import { Button, Input, Popconfirm, Select, Space, Tag } from 'antd';
import type { CSSProperties } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useCounter } from 'react-use';
import type { Admin } from '@/types';
import DepartmentModal from './modal/DepartmentModal';
import './index.scss';

const serviceName = '部门';

type DepartmentTreeNode = Fa.TreeNode<Admin.DepartmentVo, string>;
type DepartmentTypeVariant = 'module' | 'menu' | 'button';

const departmentTypeMap: Record<string, { text: string; variant: DepartmentTypeVariant }> = {
  CORP: { text: '公司', variant: 'module' },
  DEPT: { text: '部门', variant: 'menu' },
  TEAM: { text: '小组', variant: 'button' },
};

const departmentTypeOptions = Object.entries(departmentTypeMap).map(([value, type]) => ({
  label: type.text,
  value,
}));

interface DepartmentDropNode {
  key?: string | number;
  parentId?: string | number;
}

function hasDepartmentFilters(query: Record<string, any>): boolean {
  return Boolean(String(query.name || '').trim() || query.type || query.managerId);
}

function matchesDepartment(node: DepartmentTreeNode, query: Record<string, any>): boolean {
  const name = String(query.name || '')
    .trim()
    .toLowerCase();
  const nodeName = String(node.name || node.sourceData?.name || '').toLowerCase();
  if (name && !nodeName.includes(name)) return false;
  if (query.type && node.sourceData?.type !== query.type) return false;
  if (query.managerId && node.sourceData?.managerId !== query.managerId) return false;
  return true;
}

function filterDepartmentTree(nodes: DepartmentTreeNode[], query: Record<string, any>): DepartmentTreeNode[] {
  if (!hasDepartmentFilters(query)) return nodes;

  return nodes.flatMap((node) => {
    const children = filterDepartmentTree(node.children || [], query);
    if (!matchesDepartment(node, query) && children.length === 0) return [];

    return [
      {
        ...node,
        children: children.length > 0 ? children : undefined,
        hasChildren: children.length > 0,
      },
    ];
  });
}

function collectMatchingDepartmentKeys(nodes: DepartmentTreeNode[], query: Record<string, any>): string[] {
  return nodes.flatMap((node) => [...(matchesDepartment(node, query) ? [String(node.id)] : []), ...collectMatchingDepartmentKeys(node.children || [], query)]);
}

function countDepartmentNodes(nodes: DepartmentTreeNode[] | undefined): number {
  if (!nodes) return 0;
  return nodes.reduce((total, node) => total + 1 + countDepartmentNodes(node.children), 0);
}

function countMatchingDepartmentNodes(nodes: DepartmentTreeNode[] | undefined, query: Record<string, any>): number {
  if (!nodes) return 0;
  return nodes.reduce((total, node) => total + (matchesDepartment(node, query) ? 1 : 0) + countMatchingDepartmentNodes(node.children, query), 0);
}

function toDepartmentViewTree(nodes: DepartmentTreeNode[]): DepartmentTreeNode[] {
  return nodes.map((node) => {
    const children = node.children ? toDepartmentViewTree(node.children) : undefined;
    return {
      ...node,
      id: String(node.id),
      parentId: String(node.parentId),
      children,
      hasChildren: Boolean(children?.length),
    };
  });
}

function isDepartmentDropAllowed(dragNode: DepartmentDropNode, dropNode: DepartmentDropNode, dropPosition: number): boolean {
  if (dropPosition === 0) return false;
  return String(dragNode.parentId ?? '0') === String(dropNode.parentId ?? '0');
}

/**
 * 部门管理
 * @author xu.pengfei
 * @date 2026-04-28 11:36:29
 */
export default function DepartmentManage() {
  const [current, { inc }] = useCounter(0);
  const [query, setQuery] = useState<Record<string, any>>({});
  const [sourceTree, setSourceTree] = useState<DepartmentTreeNode[]>();
  const [sortFeedback, setSortFeedback] = useState<'idle' | 'success' | 'error'>('idle');
  const treeRef = useRef<{ expandKeys: (key: string) => void; collapseAll: () => void; expandAll: () => void }>(null);

  const hasFilters = hasDepartmentFilters(query);
  const filteredTree = useMemo(() => {
    if (!sourceTree) return undefined;
    return filterDepartmentTree(sourceTree, query);
  }, [query, sourceTree]);
  const filteredTreeData = useMemo(() => {
    if (!filteredTree) return undefined;
    return toDepartmentViewTree(filteredTree);
  }, [filteredTree]);
  const matchingKeys = useMemo(() => {
    if (!sourceTree || !hasFilters) return [];
    return collectMatchingDepartmentKeys(sourceTree, query);
  }, [hasFilters, query, sourceTree]);
  const totalCount = countDepartmentNodes(sourceTree);
  const matchingCount = countMatchingDepartmentNodes(sourceTree, query);

  const loadingTree = useApiLoading([departmentApi.getUrl('getTree')]);
  const sortingLoading = useApiLoading([departmentApi.getUrl('changePos')]);

  function refreshData() {
    setSourceTree(undefined);
    setSortFeedback('idle');
    inc();
  }

  const [handleDelete] = useDelete<string>(departmentApi.remove, refreshData, serviceName);

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

  function handleChangePos(changeItems: Fa.TreePosChangeVo[]): Promise<Fa.Ret> {
    if (changeItems.length === 0) {
      return Promise.resolve({ status: Fa.RES_CODE.OK, message: '', data: null });
    }

    setSortFeedback('idle');
    return departmentApi
      .changePos(changeItems)
      .then((res) => {
        setSortFeedback(res.status === Fa.RES_CODE.OK ? 'success' : 'error');
        return res;
      })
      .catch(() => {
        setSortFeedback('error');
        return { status: 500, message: '部门排序失败', data: null };
      });
  }

  useEffect(() => {
    if (!hasFilters) return;
    matchingKeys.forEach((key) => {
      treeRef.current?.expandKeys(key);
    });
  }, [hasFilters, matchingKeys]);

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
            {sourceTree && (
              <span className="fa-department-toolbar__summary" aria-live="polite">
                {hasFilters ? `命中 ${matchingCount} 项` : `共 ${totalCount} 项`}
              </span>
            )}
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
          <Button icon={<ReloadOutlined />} onClick={refreshData} loading={loadingTree} disabled={sortingLoading}>
            刷新
          </Button>
          <Button icon={<MinusCircleOutlined />} onClick={() => treeRef.current?.collapseAll()} disabled={loadingTree || sortingLoading || !sourceTree?.length}>
            折叠
          </Button>
          <Button icon={<PlusCircleOutlined />} onClick={() => treeRef.current?.expandAll()} disabled={loadingTree || sortingLoading || !sourceTree?.length}>
            展开
          </Button>
          <DepartmentModal title="新增部门" parentId={0} fetchFinish={refreshData}>
            <Button type="primary" icon={<PlusOutlined />} disabled={sortingLoading}>
              新增部门
            </Button>
          </DepartmentModal>
        </Space>
      </div>

      <FaFlexRestLayout className="fa-full-content fa-card fa-p0" style={{ top: 12, bottom: 12 }}>
        <div className="fa-department-table">
          <div className="fa-department-table-head">
            <span>部门名称</span>
            <span>类型</span>
            <span>负责人</span>
            <span>排序</span>
            <span>描述</span>
            <span>创建时间</span>
            <span>更新时间</span>
            <span>操作</span>
          </div>
          <BaseTree
            ref={treeRef}
            className="fa-department-tree"
            serviceName="Tree"
            ServiceModal={DepartmentModal}
            serviceApi={{
              ...departmentApi,
              allTree: () => departmentApi.getTree(),
              changePos: handleChangePos,
            }}
            treeData={filteredTreeData as any}
            onGetTree={(tree) => setSourceTree(tree as DepartmentTreeNode[])}
            bodyStyle={{ width: '100%', height: '100%', minHeight: 0 }}
            showTips={false}
            showTopBtn={false}
            showOprBtn={false}
            allowDrop={({ dragNode, dropNode, dropPosition }) =>
              !sortingLoading && isDepartmentDropAllowed(dragNode as DepartmentDropNode, dropNode as DepartmentDropNode, dropPosition)
            }
            // @ts-expect-error BaseTree exposes Ant Tree's generic DataNode here.
            titleRender={(item: DepartmentTreeNode) => {
              const typeVariant = departmentTypeMap[item.sourceData.type]?.variant || 'menu';
              const typeText = departmentTypeMap[item.sourceData.type]?.text || item.sourceData.type;
              const manager = item.sourceData.manager?.name || item.sourceData.managerId;

              return (
                <div
                  className={`fa-department-item fa-department-item--${typeVariant}`}
                  style={{ '--fa-department-depth': Math.max(0, item.level - 1) } as CSSProperties}
                >
                  <div className="fa-department-item__name-cell">
                    <span className="fa-department-item__level-marker" aria-hidden="true" />
                    <span className="fa-department-item__name" title={item.name}>
                      {item.name || '未命名部门'}
                    </span>
                  </div>
                  <div className="fa-department-item__type">
                    <Tag className={`fa-department-tag fa-department-tag--${typeVariant}`}>{typeText}</Tag>
                  </div>
                  <span className="fa-department-item__manager" title={manager || undefined}>
                    {manager || <span className="fa-department-item__placeholder">—</span>}
                  </span>
                  <span className="fa-department-item__sort">{item.sourceData.sort ?? '—'}</span>
                  <span className="fa-department-item__description" title={item.sourceData.description || undefined}>
                    {item.sourceData.description || <span className="fa-department-item__placeholder">—</span>}
                  </span>
                  <span className="fa-department-item__time">{item.sourceData.crtTime || '—'}</span>
                  <span className="fa-department-item__time">{item.sourceData.updTime || '—'}</span>
                  <div className="fa-department-item__actions">
                    <Space className="fa-department-inline-actions" size={2}>
                      <DepartmentModal title="新增子部门" parentId={item.id} fetchFinish={refreshData}>
                        <FaHref icon={<PlusOutlined />} text="新增子部门" />
                      </DepartmentModal>
                      <DepartmentModal title="编辑部门" record={item.sourceData} fetchFinish={refreshData}>
                        <FaHref icon={<EditOutlined />} text="编辑" />
                      </DepartmentModal>
                      {item.hasChildren ? (
                        <ShiroPermissionContainer>
                          <FaHref text="删除" disabled tooltip="该部门包含子部门，无法删除，请先处理子部门" />
                        </ShiroPermissionContainer>
                      ) : (
                        <ShiroPermissionContainer>
                          <Popconfirm title={`确认删除部门“${item.name}”？`} onConfirm={() => handleDelete(String(item.id))} placement="topRight">
                            <FaHref icon={<DeleteOutlined />} text="删除" color="red" />
                          </Popconfirm>
                        </ShiroPermissionContainer>
                      )}
                    </Space>
                  </div>
                </div>
              );
            }}
            showLine={{ showLeafIcon: false }}
            draggable={hasFilters || sortingLoading ? false : { icon: false }}
            extraEffectArgs={[current]}
          />
        </div>
      </FaFlexRestLayout>
    </div>
  );
}
