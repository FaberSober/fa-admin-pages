import {
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  MinusCircleOutlined,
  MoreOutlined,
  PlusCircleOutlined,
  PlusOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  SearchOutlined,
  SettingOutlined,
  SisternodeOutlined,
} from '@ant-design/icons';
import { BaseTree, Fa, FaEnums, FaFlexRestLayout, FaUtils, useApiLoading, useDelete } from '@fa/ui';
import FaIconPro from '@features/fa-admin-pages/components/icons/FaIconPro';
import { rbacMenuApi } from '@features/fa-admin-pages/services';
import { Button, Dropdown, Input, Modal, Segmented, Select, Space, Tag } from 'antd';
import type { CSSProperties } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useCounter } from 'react-use';
import type { Rbac } from '@/types';
import './index.scss';
import MenuStatusSwitch from './MenuStatusSwitch';
import RbacMenuModal from './modal/RbacMenuModal';

type MenuTreeNode = Fa.TreeNode<Rbac.RbacMenu, string>;
type MenuFilterStatus = 'all' | 'enabled' | 'disabled';
type MenuFilterLevel = 'all' | FaEnums.RbacMenuLevelEnum;

interface MenuFilters {
  keyword: string;
  status: MenuFilterStatus;
  level: MenuFilterLevel;
}

interface MenuViewTreeNode {
  key: string;
  id: string;
  parentId: string;
  name: string;
  label: string;
  value: string;
  level: number;
  isLeaf: boolean;
  children?: MenuViewTreeNode[];
  sourceData: Rbac.RbacMenu;
}

const INITIAL_MENU_FILTERS: MenuFilters = {
  keyword: '',
  status: 'all',
  level: 'all',
};

const MENU_STATUS_OPTIONS = [
  { label: '全部状态', value: 'all' },
  { label: '启用', value: 'enabled' },
  { label: '禁用', value: 'disabled' },
];

const MENU_LEVEL_OPTIONS = [
  { label: '全部类型', value: 'all' },
  { label: FaEnums.RbacMenuLevelEnumMap[FaEnums.RbacMenuLevelEnum.APP], value: FaEnums.RbacMenuLevelEnum.APP },
  { label: FaEnums.RbacMenuLevelEnumMap[FaEnums.RbacMenuLevelEnum.MENU], value: FaEnums.RbacMenuLevelEnum.MENU },
  { label: FaEnums.RbacMenuLevelEnumMap[FaEnums.RbacMenuLevelEnum.BUTTON], value: FaEnums.RbacMenuLevelEnum.BUTTON },
];

function hasActiveMenuFilters(filters: MenuFilters): boolean {
  return Boolean(filters.keyword.trim()) || filters.status !== 'all' || filters.level !== 'all';
}

function matchesMenuNode(node: MenuTreeNode, filters: MenuFilters): boolean {
  const keyword = filters.keyword.trim().toLowerCase();
  const searchableText = [node.name, node.id, node.sourceData.linkUrl].filter(Boolean).join(' ').toLowerCase();

  if (keyword && !searchableText.includes(keyword)) return false;
  if (filters.status !== 'all' && Boolean(node.sourceData.status) !== (filters.status === 'enabled')) return false;
  if (filters.level !== 'all' && node.sourceData.level !== filters.level) return false;
  return true;
}

function filterMenuTree(nodes: MenuTreeNode[], filters: MenuFilters): MenuTreeNode[] {
  return nodes.flatMap((node) => {
    const children = filterMenuTree(node.children || [], filters);
    if (!matchesMenuNode(node, filters) && children.length === 0) return [];

    return [
      {
        ...node,
        children: children.length > 0 ? children : undefined,
        hasChildren: children.length > 0,
      },
    ];
  });
}

function collectMatchingMenuKeys(nodes: MenuTreeNode[], filters: MenuFilters): string[] {
  return nodes.flatMap((node) => [...(matchesMenuNode(node, filters) ? [String(node.id)] : []), ...collectMatchingMenuKeys(node.children || [], filters)]);
}

function countMenuNodes(nodes: MenuTreeNode[] | undefined): number {
  if (!nodes) return 0;
  return nodes.reduce((total, node) => total + 1 + countMenuNodes(node.children), 0);
}

function countMatchingMenuNodes(nodes: MenuTreeNode[] | undefined, filters: MenuFilters): number {
  if (!nodes) return 0;
  return nodes.reduce((total, node) => total + (matchesMenuNode(node, filters) ? 1 : 0) + countMatchingMenuNodes(node.children, filters), 0);
}

function updateMenuNodeStatus(nodes: MenuTreeNode[], id: string, status: boolean): MenuTreeNode[] {
  return nodes.map((node) => {
    if (String(node.id) === id) {
      return { ...node, sourceData: { ...node.sourceData, status } };
    }
    if (!node.children?.length) return node;
    return { ...node, children: updateMenuNodeStatus(node.children, id, status) };
  });
}

function toMenuViewTree(nodes: MenuTreeNode[]): MenuViewTreeNode[] {
  return nodes.map((node) => {
    const children = node.children ? toMenuViewTree(node.children) : undefined;
    return {
      key: String(node.id),
      id: String(node.id),
      parentId: String(node.parentId),
      name: node.name,
      label: node.name,
      value: String(node.id),
      level: node.level,
      isLeaf: !children?.length,
      children,
      sourceData: node.sourceData,
    };
  });
}

function getMenuLevelClassName(level: FaEnums.RbacMenuLevelEnum): string {
  if (level === FaEnums.RbacMenuLevelEnum.APP) return 'fa-menu-item--module';
  if (level === FaEnums.RbacMenuLevelEnum.BUTTON) return 'fa-menu-item--button';
  return 'fa-menu-item--menu';
}

interface MenuDropNode {
  key?: string | number;
  parentId?: string | number;
  sourceData?: Rbac.RbacMenu;
}

function findMenuNodeById(nodes: MenuTreeNode[] | undefined, id: string): MenuTreeNode | undefined {
  if (!nodes) return undefined;
  for (const node of nodes) {
    if (String(node.id) === id) return node;
    const found = findMenuNodeById(node.children, id);
    if (found) return found;
  }
  return undefined;
}

function containsMenuNode(node: MenuTreeNode | undefined, id: string): boolean {
  return Boolean(node?.children?.some((child) => String(child.id) === id || containsMenuNode(child, id)));
}

function canMenuNodeBeChild(level: FaEnums.RbacMenuLevelEnum, parentLevel: FaEnums.RbacMenuLevelEnum | undefined): boolean {
  if (level === FaEnums.RbacMenuLevelEnum.APP) return parentLevel === undefined;
  if (level === FaEnums.RbacMenuLevelEnum.MENU) {
    return parentLevel === FaEnums.RbacMenuLevelEnum.APP || parentLevel === FaEnums.RbacMenuLevelEnum.MENU;
  }
  return level === FaEnums.RbacMenuLevelEnum.BUTTON && parentLevel === FaEnums.RbacMenuLevelEnum.MENU;
}

function isMenuDropAllowed(
  sourceTree: MenuTreeNode[] | undefined,
  scope: FaEnums.RbacMenuScopeEnum,
  dragNode: MenuDropNode,
  dropNode: MenuDropNode,
  dropPosition: number,
): boolean {
  const dragData = dragNode.sourceData;
  const dropData = dropNode.sourceData;
  if (!dragData || !dropData || dragData.scope !== scope || dropData.scope !== scope) return false;

  const dragId = String(dragNode.key ?? dragData.id);
  const parentId = dropPosition === 0 ? String(dropNode.key ?? dropData.id) : dropNode.parentId == null ? undefined : String(dropNode.parentId);
  if (parentId && parentId !== '0' && (parentId === dragId || containsMenuNode(findMenuNodeById(sourceTree, dragId), parentId))) return false;

  const parentLevel = parentId === undefined || parentId === '0' ? undefined : findMenuNodeById(sourceTree, parentId)?.sourceData.level;
  return canMenuNodeBeChild(dragData.level, parentLevel);
}

interface MenuRowActionsProps {
  item: MenuTreeNode;
  scope: FaEnums.RbacMenuScopeEnum;
  onRefresh: () => void;
  onDelete: (id: string) => void;
}

function MenuRowActions({ item, scope, onRefresh, onDelete }: MenuRowActionsProps) {
  const [action, setAction] = useState<'add-child' | 'edit'>();
  const canAddChild = item.sourceData.level !== FaEnums.RbacMenuLevelEnum.BUTTON;

  function handleMenuClick({ key }: { key: string }) {
    if (key === 'add-child' || key === 'edit') {
      setAction(key);
      return;
    }
    if (key === 'copy-name') {
      FaUtils.copyToClipboard(item.name);
      return;
    }
    if (key === 'copy-id') {
      FaUtils.copyToClipboard(item.sourceData.id);
      return;
    }
    if (key === 'copy-link') {
      FaUtils.copyToClipboard(item.sourceData.linkUrl);
      return;
    }
    if (key === 'delete') {
      Modal.confirm({
        title: '删除菜单',
        content: `确认删除菜单【${item.name}】？`,
        okText: '删除',
        okButtonProps: { danger: true },
        onOk: () => onDelete(item.id),
        cancelText: '取消',
      });
    }
  }

  return (
    <>
      <Space className="fa-menu-inline-actions" size={2}>
        {canAddChild && (
          <Button type="link" size="small" icon={<SisternodeOutlined />} onClick={() => setAction('add-child')}>
            新增子节点
          </Button>
        )}
        <Button type="link" size="small" icon={<EditOutlined />} onClick={() => setAction('edit')}>
          编辑菜单
        </Button>
        <Dropdown
          trigger={['click']}
          placement="bottomRight"
          menu={{
            items: [
              { key: 'copy-name', icon: <CopyOutlined />, label: '复制菜单名称' },
              { key: 'copy-id', icon: <CopyOutlined />, label: '复制菜单 ID' },
              {
                key: 'copy-link',
                icon: <CopyOutlined />,
                label: '复制路由 / 权限标识',
                disabled: !item.sourceData.linkUrl,
              },
              { type: 'divider' },
              { key: 'delete', danger: true, icon: <DeleteOutlined />, label: '删除菜单' },
            ],
            onClick: handleMenuClick,
          }}
        >
          <Button className="fa-menu-action-trigger" type="text" size="small" icon={<MoreOutlined />} aria-label="更多操作" title="更多操作">
            更多操作
          </Button>
        </Dropdown>
      </Space>
      <RbacMenuModal
        title={action === 'edit' ? '编辑菜单' : '新增菜单'}
        record={action === 'edit' ? item.sourceData : undefined}
        scope={scope}
        parentId={action === 'add-child' ? item.id : undefined}
        open={Boolean(action)}
        onCancel={() => setAction(undefined)}
        fetchFinish={() => {
          setAction(undefined);
          onRefresh();
        }}
      />
    </>
  );
}

/**
 * RBAC Menu Manage
 * @author xu.pengfei
 * @date 2022/12/15 15:57
 */
export default function Menu() {
  const [current, { inc }] = useCounter(0);
  const [scope, setScope] = useState<FaEnums.RbacMenuScopeEnum>(FaEnums.RbacMenuScopeEnum.WEB);
  const [filters, setFilters] = useState<MenuFilters>(INITIAL_MENU_FILTERS);
  const [sourceTree, setSourceTree] = useState<MenuTreeNode[]>();
  const [sortFeedback, setSortFeedback] = useState<'idle' | 'success' | 'error'>('idle');
  const treeRef = useRef<{ expandKeys: (key: string) => void; collapseAll: () => void; expandAll: () => void }>(null);

  useEffect(() => {
    refreshData();
  }, [scope]);

  function refreshData() {
    setSourceTree(undefined);
    setSortFeedback('idle');
    inc();
  }

  const hasFilters = hasActiveMenuFilters(filters);
  const filteredTree = useMemo(() => {
    if (!sourceTree) return undefined;
    return filterMenuTree(sourceTree, filters);
  }, [filters, sourceTree]);
  const filteredTreeData = useMemo(() => {
    if (!filteredTree) return undefined;
    return toMenuViewTree(filteredTree);
  }, [filteredTree]);
  const matchingKeys = useMemo(() => {
    if (!sourceTree || !hasFilters) return [];
    return collectMatchingMenuKeys(sourceTree, filters);
  }, [filters, hasFilters, sourceTree]);
  const totalCount = countMenuNodes(sourceTree);
  const matchingCount = countMatchingMenuNodes(sourceTree, filters);

  function handleStatusChange(id: string, status: boolean) {
    setSourceTree((tree) => (tree ? updateMenuNodeStatus(tree, id, status) : tree));
  }

  useEffect(() => {
    if (!hasFilters) return;
    matchingKeys.forEach((key) => {
      treeRef.current?.expandKeys(key);
    });
  }, [hasFilters, matchingKeys]);

  const [handleDelete] = useDelete<string>(rbacMenuApi.remove, refreshData, '菜单');

  const loadingTree = useApiLoading([rbacMenuApi.getUrl('allTree')]);
  const sortingLoading = useApiLoading([rbacMenuApi.getUrl('changePos')]);

  function handleChangePos(changeItems: Fa.TreePosChangeVo[]): Promise<Fa.Ret> {
    if (changeItems.length === 0) {
      return Promise.resolve({ status: Fa.RES_CODE.OK, message: '', data: null });
    }

    setSortFeedback('idle');
    return rbacMenuApi
      .changePos(changeItems)
      .then((res) => {
        if (res.status === Fa.RES_CODE.OK) {
          setSortFeedback('success');
        } else {
          setSortFeedback('error');
        }
        return res;
      })
      .catch(() => {
        setSortFeedback('error');
        return { status: 500, message: '菜单排序失败', data: null };
      });
  }

  return (
    <div className="fa-full-content fa-flex-column fa-menu-div">
      <div className="fa-m12 fa-menu-toolbar">
        <div className="fa-menu-toolbar__filters">
          <Segmented
            value={scope}
            onChange={(value) => setScope(value as FaEnums.RbacMenuScopeEnum)}
            options={[
              {
                label: '网页',
                value: FaEnums.RbacMenuScopeEnum.WEB,
                icon: <SettingOutlined />,
              },
              {
                label: 'APP',
                value: FaEnums.RbacMenuScopeEnum.APP,
                icon: <SafetyCertificateOutlined />,
              },
            ]}
          />
          <Space className="fa-menu-toolbar__filter-controls" size={8} wrap>
            <Input
              className="fa-menu-toolbar__keyword"
              prefix={<SearchOutlined />}
              placeholder="搜索名称 / ID / 路由或权限标识"
              allowClear
              value={filters.keyword}
              onChange={(event) => setFilters((currentFilters) => ({ ...currentFilters, keyword: event.target.value }))}
            />
            <Select
              value={filters.status}
              options={MENU_STATUS_OPTIONS}
              onChange={(value: MenuFilterStatus) => setFilters((currentFilters) => ({ ...currentFilters, status: value }))}
            />
            <Select
              value={filters.level}
              options={MENU_LEVEL_OPTIONS}
              onChange={(value: MenuFilterLevel) => setFilters((currentFilters) => ({ ...currentFilters, level: value }))}
            />
            {sourceTree && <span className="fa-menu-toolbar__summary">{hasFilters ? `命中 ${matchingCount} 项` : `共 ${totalCount} 项`}</span>}
            {sortingLoading && (
              <output className="fa-menu-toolbar__sort-status fa-menu-toolbar__sort-status--saving" aria-live="polite">
                正在保存排序...
              </output>
            )}
            {!sortingLoading && sortFeedback === 'success' && (
              <output className="fa-menu-toolbar__sort-status fa-menu-toolbar__sort-status--success" aria-live="polite">
                排序已保存
              </output>
            )}
            {!sortingLoading && sortFeedback === 'error' && (
              <output className="fa-menu-toolbar__sort-status fa-menu-toolbar__sort-status--error" aria-live="polite">
                排序失败，已恢复原顺序
              </output>
            )}
          </Space>
        </div>
        <Space className="fa-menu-toolbar__actions">
          <Button icon={<ReloadOutlined />} onClick={refreshData} loading={loadingTree} disabled={sortingLoading}>
            刷新
          </Button>
          <Button icon={<MinusCircleOutlined />} onClick={() => treeRef.current?.collapseAll()} disabled={loadingTree || sortingLoading}>
            折叠
          </Button>
          <Button icon={<PlusCircleOutlined />} onClick={() => treeRef.current?.expandAll()} disabled={loadingTree || sortingLoading}>
            展开
          </Button>
          <RbacMenuModal title="新增菜单" scope={scope} fetchFinish={refreshData}>
            <Button type="primary" icon={<PlusOutlined />} loading={loadingTree} disabled={sortingLoading}>
              新增菜单
            </Button>
          </RbacMenuModal>
        </Space>
      </div>

      <FaFlexRestLayout className="fa-full-content-p12 fa-card fa-p0">
        <div className="fa-menu-table">
          <div className="fa-menu-table-head">
            <span>菜单名称</span>
            <span>类型</span>
            <span>图标</span>
            <span>菜单 ID</span>
            <span>路由 / 权限标识</span>
            <span>状态</span>
            <span>操作</span>
          </div>
          <BaseTree
            ref={treeRef}
            className="fa-menu-tree"
            // showRoot
            // onSelect={(keys) => console.log('onSelect', keys)}
            onAfterDelItem={() => {}}
            // 自定义配置
            serviceName="Tree"
            ServiceModal={RbacMenuModal}
            serviceApi={{
              ...rbacMenuApi,
              allTree: () => rbacMenuApi.getTree({ query: { scope } }),
              changePos: handleChangePos,
            }}
            treeData={filteredTreeData as any}
            onGetTree={(tree) => setSourceTree(tree as MenuTreeNode[])}
            bodyStyle={{ width: '100%', height: '100%', minHeight: 0 }}
            showTips={false}
            showTopBtn={false}
            allowDrop={({ dragNode, dropNode, dropPosition }) =>
              !sortingLoading && isMenuDropAllowed(sourceTree, scope, dragNode as MenuDropNode, dropNode as MenuDropNode, dropPosition)
            }
            // @ts-expect-error
            titleRender={(item: Fa.TreeNode<Rbac.RbacMenu, string> & { updating: boolean }) => (
              <div
                className={`fa-menu-item ${getMenuLevelClassName(item.sourceData.level)}`}
                style={{ '--fa-menu-depth': Math.max(0, item.level - 1) } as CSSProperties}
              >
                <div className="fa-menu-item__name-cell">
                  <span className="fa-menu-item__level-marker" aria-hidden="true" />
                  <span className="fa-menu-item__name" title={item.name}>
                    {item.name}
                  </span>
                </div>
                <div className="fa-menu-item__type">
                  {item.sourceData.level === FaEnums.RbacMenuLevelEnum.APP && (
                    <Tag className="fa-menu-tag fa-menu-tag--module">{FaEnums.RbacMenuLevelEnumMap[item.sourceData.level]}</Tag>
                  )}
                  {item.sourceData.level === FaEnums.RbacMenuLevelEnum.MENU && (
                    <Tag className="fa-menu-tag fa-menu-tag--menu">{FaEnums.RbacMenuLevelEnumMap[item.sourceData.level]}</Tag>
                  )}
                  {item.sourceData.level === FaEnums.RbacMenuLevelEnum.BUTTON && (
                    <Tag className="fa-menu-tag fa-menu-tag--button">{FaEnums.RbacMenuLevelEnumMap[item.sourceData.level]}</Tag>
                  )}
                </div>
                <div className="fa-menu-item__icon fa-flex-center">
                  {item.sourceData.icon ? <FaIconPro icon={item.sourceData.icon} /> : <span className="fa-menu-item__placeholder">—</span>}
                </div>
                <span className="fa-menu-item__id" title={item.sourceData.id}>
                  {item.sourceData.id}
                </span>
                {item.sourceData.linkUrl ? (
                  <span className="fa-menu-item__link" title={item.sourceData.linkUrl}>
                    {item.sourceData.linkUrl}
                  </span>
                ) : (
                  <span className="fa-menu-item__link fa-menu-item__placeholder">—</span>
                )}
                <div className="fa-menu-item__status">
                  <MenuStatusSwitch item={item.sourceData} onChange={(status) => handleStatusChange(item.id, status)} />
                </div>
                <div className="fa-menu-item__actions">
                  <MenuRowActions item={item} scope={scope} onRefresh={refreshData} onDelete={handleDelete} />
                </div>
              </div>
            )}
            showOprBtn={false}
            showLine={{ showLeafIcon: false }}
            draggable={hasFilters || sortingLoading ? false : { icon: false }}
            extraEffectArgs={[current]}
          />
        </div>
      </FaFlexRestLayout>
    </div>
  );
}
