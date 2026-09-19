import {
  EditOutlined,
  MinusCircleOutlined,
  PlusCircleOutlined,
  PlusOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  SearchOutlined,
  SettingOutlined,
  SisternodeOutlined,
} from '@ant-design/icons';
import { AuthDelBtn, BaseTree, type Fa, FaEnums, FaFlexRestLayout, FaHref, FaUtils, useApiLoading, useDelete } from '@fa/ui';
import FaIconPro from '@features/fa-admin-pages/components/icons/FaIconPro';
import { rbacMenuApi } from '@features/fa-admin-pages/services';
import { Button, Input, Segmented, Select, Space, Tag } from 'antd';
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
  const treeRef = useRef<{ expandKeys: (key: string) => void; collapseAll: () => void; expandAll: () => void }>(null);

  useEffect(() => {
    refreshData();
  }, [scope]);

  function refreshData() {
    setSourceTree(undefined);
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

  useEffect(() => {
    if (!hasFilters) return;
    matchingKeys.forEach((key) => {
      treeRef.current?.expandKeys(key);
    });
  }, [hasFilters, matchingKeys]);

  const [handleDelete] = useDelete<string>(rbacMenuApi.remove, refreshData, '菜单');

  const loadingTree = useApiLoading([rbacMenuApi.getUrl('allTree')]);
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
          </Space>
        </div>
        <Space className="fa-menu-toolbar__actions">
          <Button icon={<ReloadOutlined />} onClick={refreshData} loading={loadingTree}>
            刷新
          </Button>
          <Button icon={<MinusCircleOutlined />} onClick={() => treeRef.current?.collapseAll()} disabled={loadingTree}>
            折叠
          </Button>
          <Button icon={<PlusCircleOutlined />} onClick={() => treeRef.current?.expandAll()} disabled={loadingTree}>
            展开
          </Button>
          <RbacMenuModal title="新增菜单" scope={scope} fetchFinish={refreshData}>
            <Button type="primary" icon={<PlusOutlined />} loading={loadingTree}>
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
            showOprBtn
            // onSelect={(keys) => console.log('onSelect', keys)}
            onAfterDelItem={() => {}}
            // 自定义配置
            serviceName="Tree"
            ServiceModal={RbacMenuModal}
            serviceApi={{
              ...rbacMenuApi,
              allTree: () => rbacMenuApi.getTree({ query: { scope } }),
            }}
            treeData={filteredTreeData as any}
            onGetTree={(tree) => setSourceTree(tree as MenuTreeNode[])}
            bodyStyle={{ width: '100%', height: '100%', minHeight: 0 }}
            showTips={false}
            showTopBtn={false}
            // @ts-expect-error
            titleRender={(item: Fa.TreeNode<Rbac.RbacMenu, string> & { updating: boolean }) => (
              <div className="fa-menu-item">
                <button
                  type="button"
                  className="fa-menu-item__name fa-menu-item__copy"
                  title="点击复制菜单名称"
                  onClick={() => FaUtils.copyToClipboard(item.name)}
                >
                  {item.name}
                </button>
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
                <button
                  type="button"
                  className="fa-menu-item__id fa-menu-item__copy"
                  title="点击复制菜单 ID"
                  onClick={() => FaUtils.copyToClipboard(item.sourceData.id)}
                >
                  {item.sourceData.id}
                </button>
                {item.sourceData.linkUrl ? (
                  <button
                    type="button"
                    className="fa-menu-item__link fa-menu-item__copy"
                    title="点击复制路由或权限标识"
                    onClick={() => FaUtils.copyToClipboard(item.sourceData.linkUrl)}
                  >
                    {item.sourceData.linkUrl}
                  </button>
                ) : (
                  <span className="fa-menu-item__link fa-menu-item__placeholder">—</span>
                )}
                <div className="fa-menu-item__status">
                  <MenuStatusSwitch item={item.sourceData} />
                </div>
                <Space className="fa-menu-item__actions">
                  <RbacMenuModal title="新增菜单" scope={scope} parentId={item.id} fetchFinish={refreshData}>
                    <FaHref icon={<SisternodeOutlined />} text="新增子节点" />
                  </RbacMenuModal>
                  <RbacMenuModal title="编辑菜单" record={item.sourceData} scope={scope} fetchFinish={refreshData}>
                    <FaHref icon={<EditOutlined />} text="编辑" />
                  </RbacMenuModal>
                  <AuthDelBtn handleDelete={() => handleDelete(item.id)} />
                </Space>
              </div>
            )}
            showLine={false}
            draggable={hasFilters ? false : { icon: false }}
            extraEffectArgs={[current]}
          />
        </div>
      </FaFlexRestLayout>
    </div>
  );
}
