import { AppstoreOutlined, GlobalOutlined, LockOutlined, MobileOutlined, SearchOutlined } from '@ant-design/icons';
import { type Fa, FaEnums } from '@fa/ui';
import { Button, Checkbox, Empty, Input, Spin, Tag } from 'antd';
import clsx from 'clsx';
import type { Key as ReactKey, ReactNode } from 'react';
import { Fragment, useEffect, useMemo, useState } from 'react';
import type { Rbac } from '@/types';
import './TenantPermissionPanel.css';

type MenuNode = Fa.TreeNode<Rbac.RbacMenu>;
type MenuKey = string;

interface ScopeGroup {
  key: string;
  label: string;
  icon: ReactNode;
  modules: MenuNode[];
}

interface CheckState {
  checked: boolean;
  indeterminate: boolean;
}

export interface TenantPermissionPanelProps {
  tree: MenuNode[];
  requiredMenuIds: ReactKey[];
  checkedMenuIds: ReactKey[];
  loading?: boolean;
  onCheckedMenuIdsChange: (keys: ReactKey[]) => void;
}

function getNodeKey(node: MenuNode): MenuKey {
  return String(node.id);
}

function getChildren(node: MenuNode): MenuNode[] {
  return node.children || [];
}

function getMenuChildren(node: MenuNode): MenuNode[] {
  return getChildren(node).filter((child) => child.sourceData.level !== FaEnums.RbacMenuLevelEnum.BUTTON);
}

function getButtonChildren(node: MenuNode): MenuNode[] {
  return getChildren(node).filter((child) => child.sourceData.level === FaEnums.RbacMenuLevelEnum.BUTTON);
}

function getAllNodes(node: MenuNode): MenuNode[] {
  return [node, ...getChildren(node).flatMap(getAllNodes)];
}

function getAllKeys(node: MenuNode): MenuKey[] {
  return getAllNodes(node).map(getNodeKey);
}

function getNodesKeys(nodes: MenuNode[]): MenuKey[] {
  return nodes.flatMap(getAllKeys);
}

function getCheckState(node: MenuNode, selectedKeys: Set<MenuKey>): CheckState {
  const allKeys = getAllKeys(node);
  const childKeys = allKeys.slice(1);

  if (childKeys.length === 0) {
    return {
      checked: selectedKeys.has(getNodeKey(node)),
      indeterminate: false,
    };
  }

  const selectedChildCount = childKeys.filter((key) => selectedKeys.has(key)).length;
  const checked = selectedChildCount === childKeys.length;

  return {
    checked,
    indeterminate: !checked && (selectedKeys.has(getNodeKey(node)) || selectedChildCount > 0),
  };
}

function getStats(nodes: MenuNode[], selectedKeys: Set<MenuKey>) {
  const allKeys = getNodesKeys(nodes);
  return {
    total: allKeys.length,
    selected: allKeys.filter((key) => selectedKeys.has(key)).length,
  };
}

function normalizeSelectionKeys(tree: MenuNode[], keys: Set<MenuKey>): Set<MenuKey> {
  const normalized = new Set(keys);

  function normalizeNode(node: MenuNode): boolean {
    const children = getChildren(node);
    if (children.length === 0) return normalized.has(getNodeKey(node));

    const hasSelectedDescendant = children.some(normalizeNode);
    if (hasSelectedDescendant) normalized.add(getNodeKey(node));
    else normalized.delete(getNodeKey(node));
    return hasSelectedDescendant;
  }

  tree.forEach(normalizeNode);
  return normalized;
}

function getScopeLabel(scope: string): string {
  if (scope === String(FaEnums.RbacMenuScopeEnum.WEB)) return '网页';
  if (scope === String(FaEnums.RbacMenuScopeEnum.APP)) return 'APP';
  return `其他终端 ${scope}`;
}

function getScopeIcon(scope: string): ReactNode {
  if (scope === String(FaEnums.RbacMenuScopeEnum.WEB)) return <GlobalOutlined />;
  if (scope === String(FaEnums.RbacMenuScopeEnum.APP)) return <MobileOutlined />;
  return <AppstoreOutlined />;
}

function getScopeOrder(scope: string): number {
  if (scope === String(FaEnums.RbacMenuScopeEnum.WEB)) return 1;
  if (scope === String(FaEnums.RbacMenuScopeEnum.APP)) return 2;
  const numericScope = Number(scope);
  return Number.isFinite(numericScope) ? 99 + numericScope : 999;
}

function buildScopeGroups(tree: MenuNode[]): ScopeGroup[] {
  const groupMap = new Map<string, MenuNode[]>();

  tree.forEach((node) => {
    const scope = String(node.sourceData.scope ?? 'unknown');
    const current = groupMap.get(scope) || [];
    current.push(node);
    groupMap.set(scope, current);
  });

  return [...groupMap.entries()]
    .sort(([left], [right]) => getScopeOrder(left) - getScopeOrder(right))
    .map(([key, modules]) => ({
      key,
      label: getScopeLabel(key),
      icon: getScopeIcon(key),
      modules,
    }));
}

function filterMenuNode(node: MenuNode, keyword: string, selectedOnly: boolean, selectedKeys: Set<MenuKey>): MenuNode | undefined {
  const normalizedKeyword = keyword.trim().toLowerCase();
  const nodeMatches = !normalizedKeyword || node.name.toLowerCase().includes(normalizedKeyword);
  const visibleChildren = getChildren(node)
    .map((child) => filterMenuNode(child, normalizedKeyword, selectedOnly, selectedKeys))
    .filter((child): child is MenuNode => Boolean(child));
  const nodeSelected = selectedKeys.has(getNodeKey(node));

  if (selectedOnly && !nodeSelected && visibleChildren.length === 0) return undefined;
  if (normalizedKeyword && !nodeMatches && visibleChildren.length === 0) return undefined;
  if (!normalizedKeyword && !selectedOnly) return node;
  if (nodeMatches && !selectedOnly) return node;

  return {
    ...node,
    children: visibleChildren.length > 0 ? visibleChildren : undefined,
  };
}

interface PermissionPageCardProps {
  node: MenuNode;
  sourceNode: MenuNode;
  selectedKeys: Set<MenuKey>;
  onToggle: (node: MenuNode) => void;
}

function PermissionPageCard({ node, sourceNode, selectedKeys, onToggle }: PermissionPageCardProps) {
  const state = getCheckState(sourceNode, selectedKeys);
  const required = Boolean(sourceNode.sourceData.tenantRequired);
  const buttonNodes = getButtonChildren(node);
  const sourceButtonNodes = getButtonChildren(sourceNode);
  const sourceButtonMap = new Map(sourceButtonNodes.map((button) => [getNodeKey(button), button]));
  const buttonStats = getStats(sourceButtonNodes, selectedKeys);

  return (
    <article className={clsx('tenant-permission-panel__page-card', buttonNodes.length === 0 && 'is-simple')}>
      <div className="tenant-permission-panel__page-header">
        <Checkbox disabled={required} checked={state.checked} indeterminate={state.indeterminate} onChange={() => onToggle(sourceNode)}>
          <span className="tenant-permission-panel__page-title">{node.name}</span>
          {required && (
            <Tag color="gold" icon={<LockOutlined />}>
              必选
            </Tag>
          )}
        </Checkbox>
        {buttonNodes.length > 0 && (
          <>
            <span className="tenant-permission-panel__page-count">
              按钮 {buttonStats.selected}/{buttonStats.total}
            </span>
            <Button type="link" size="small" onClick={() => onToggle(sourceNode)}>
              {state.checked ? '取消按钮全选' : '全选按钮'}
            </Button>
          </>
        )}
      </div>

      {buttonNodes.length > 0 && (
        <div className="tenant-permission-panel__button-list">
          {buttonNodes.map((button) => {
            const buttonState = getCheckState(button, selectedKeys);
            const sourceButton = sourceButtonMap.get(getNodeKey(button)) || button;
            const buttonRequired = Boolean(sourceButton.sourceData.tenantRequired);
            return (
              <Checkbox
                key={getNodeKey(button)}
                disabled={buttonRequired}
                checked={buttonState.checked}
                onChange={() => onToggle(sourceButton)}
              >
                {button.name}
                {buttonRequired && <LockOutlined aria-label="平台必选权限" className="fa-ml4" />}
              </Checkbox>
            );
          })}
        </div>
      )}
    </article>
  );
}

interface PermissionGroupHeaderProps {
  node: MenuNode;
  selectedKeys: Set<MenuKey>;
  onToggle: (node: MenuNode) => void;
}

function PermissionGroupHeader({ node, selectedKeys, onToggle }: PermissionGroupHeaderProps) {
  const state = getCheckState(node, selectedKeys);
  const required = Boolean(node.sourceData.tenantRequired);
  const stats = getStats([node], selectedKeys);

  return (
    <div className="tenant-permission-panel__group-header">
      <Checkbox disabled={required} checked={state.checked} indeterminate={state.indeterminate} onChange={() => onToggle(node)}>
        <span className="tenant-permission-panel__group-title">{node.name}</span>
        {required && (
          <Tag color="gold" icon={<LockOutlined />}>
            必选
          </Tag>
        )}
      </Checkbox>
      <span className="tenant-permission-panel__group-count">
        已配置 {stats.selected}/{stats.total}
      </span>
      <Button type="link" size="small" onClick={() => onToggle(node)}>
        {state.checked ? '取消全选' : '全选'}
      </Button>
    </div>
  );
}

export default function TenantPermissionPanel({
  tree,
  requiredMenuIds,
  checkedMenuIds,
  loading = false,
  onCheckedMenuIdsChange,
}: TenantPermissionPanelProps) {
  const [activeScopeKey, setActiveScopeKey] = useState('');
  const [activeModuleKey, setActiveModuleKey] = useState('');
  const [searchValue, setSearchValue] = useState('');
  const [selectedOnly, setSelectedOnly] = useState(false);
  const requiredKeys = useMemo(() => new Set(requiredMenuIds.map((key) => String(key))), [requiredMenuIds]);
  const selectedKeys = useMemo(
    () => new Set([...requiredMenuIds, ...checkedMenuIds].map((key) => String(key))),
    [checkedMenuIds, requiredMenuIds],
  );

  const scopeGroups = useMemo(() => buildScopeGroups(tree), [tree]);
  const nodeMap = useMemo(() => {
    const map = new Map<MenuKey, MenuNode>();
    tree.flatMap(getAllNodes).forEach((node) => {
      map.set(getNodeKey(node), node);
    });
    return map;
  }, [tree]);

  useEffect(() => {
    if (scopeGroups.length === 0) {
      setActiveScopeKey('');
      return;
    }
    if (!scopeGroups.some((group) => group.key === activeScopeKey)) {
      setActiveScopeKey(scopeGroups[0].key);
    }
  }, [activeScopeKey, scopeGroups]);

  const activeScope = scopeGroups.find((group) => group.key === activeScopeKey);

  useEffect(() => {
    const firstModuleKey = activeScope?.modules[0] ? getNodeKey(activeScope.modules[0]) : '';
    if (!activeScope || !activeScope.modules.some((module) => getNodeKey(module) === activeModuleKey)) {
      setActiveModuleKey(firstModuleKey);
    }
  }, [activeModuleKey, activeScope]);

  const activeModule = activeScope?.modules.find((module) => getNodeKey(module) === activeModuleKey);
  const visibleModule = activeModule ? filterMenuNode(activeModule, searchValue, selectedOnly, selectedKeys) : undefined;
  const globalStats = getStats(tree, selectedKeys);
  const activeScopeStats = activeScope ? getStats(activeScope.modules, selectedKeys) : { total: 0, selected: 0 };
  const activeModuleStats = activeModule ? getStats([activeModule], selectedKeys) : { total: 0, selected: 0 };
  const activeScopeKeys = activeScope ? getNodesKeys(activeScope.modules) : [];
  const activeModuleKeys = activeModule ? getAllKeys(activeModule) : [];
  const scopeAllSelected = activeScopeKeys.length > 0 && activeScopeKeys.every((key) => selectedKeys.has(key));
  const moduleAllSelected = activeModuleKeys.length > 0 && activeModuleKeys.every((key) => selectedKeys.has(key));

  function updateKeys(keys: MenuKey[], checked: boolean) {
    const nextKeys = new Set(selectedKeys);
    keys.forEach((key) => {
      if (checked) nextKeys.add(key);
      else if (!requiredKeys.has(key)) nextKeys.delete(key);
    });
    onCheckedMenuIdsChange([...normalizeSelectionKeys(tree, nextKeys)].filter((key) => !requiredKeys.has(key)));
  }

  function toggleNode(node: MenuNode) {
    const state = getCheckState(node, selectedKeys);
    updateKeys(getAllKeys(node), !state.checked);
  }

  function toggleScope() {
    updateKeys(activeScopeKeys, !scopeAllSelected);
  }

  function toggleModule() {
    updateKeys(activeModuleKeys, !moduleAllSelected);
  }

  function renderMenuNode(node: MenuNode, isRoot = false): ReactNode {
    const sourceNode = nodeMap.get(getNodeKey(node)) || node;
    const menuChildren = getMenuChildren(node);
    const buttonChildren = getButtonChildren(node);
    const isPage = menuChildren.length === 0 || buttonChildren.length > 0;

    return (
      <Fragment key={getNodeKey(node)}>
        {isPage && <PermissionPageCard node={node} sourceNode={sourceNode} selectedKeys={selectedKeys} onToggle={toggleNode} />}
        {menuChildren.length > 0 && (
          <section className="tenant-permission-panel__group">
            {!isRoot && <PermissionGroupHeader node={sourceNode} selectedKeys={selectedKeys} onToggle={toggleNode} />}
            <div className="tenant-permission-panel__card-grid">{menuChildren.map((child) => renderMenuNode(child))}</div>
          </section>
        )}
      </Fragment>
    );
  }

  return (
    <Spin spinning={loading} className="tenant-permission-panel__spin">
      <div className="tenant-permission-panel">
        <div className="tenant-permission-panel__toolbar">
          <div className="tenant-permission-panel__toolbar-summary">
            <span className="tenant-permission-panel__summary-title">权限配置</span>
            <span className="tenant-permission-panel__summary-count">
              已选 {globalStats.selected} / {globalStats.total} 项
            </span>
          </div>

          <div className="tenant-permission-panel__scope-row">
            <span className="tenant-permission-panel__row-label">平台</span>
            <div className="tenant-permission-panel__scope-list" role="tablist" aria-label="终端类型">
              {scopeGroups.map((group) => {
                const stats = getStats(group.modules, selectedKeys);
                const active = group.key === activeScopeKey;
                return (
                  <button
                    key={group.key}
                    type="button"
                    className={clsx('tenant-permission-panel__scope-tab', active && 'is-active')}
                    role="tab"
                    aria-selected={active}
                    onClick={() => setActiveScopeKey(group.key)}
                  >
                    <span className="tenant-permission-panel__scope-icon">{group.icon}</span>
                    <span>{group.label}</span>
                    <span className="tenant-permission-panel__scope-count">
                      {stats.selected}/{stats.total}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="tenant-permission-panel__module-row">
            <span className="tenant-permission-panel__row-label">模块</span>
            <div className="tenant-permission-panel__module-list" role="tablist" aria-label="菜单模块">
              {activeScope?.modules.map((module) => {
                const active = getNodeKey(module) === activeModuleKey;
                const stats = getStats([module], selectedKeys);
                return (
                  <button
                    key={getNodeKey(module)}
                    type="button"
                    className={clsx('tenant-permission-panel__module-tab', active && 'is-active')}
                    role="tab"
                    aria-selected={active}
                    onClick={() => setActiveModuleKey(getNodeKey(module))}
                  >
                    <span>{module.name}</span>
                    <span className="tenant-permission-panel__module-count">{stats.selected}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="tenant-permission-panel__filter-row">
            <Input
              allowClear
              value={searchValue}
              prefix={<SearchOutlined />}
              placeholder="搜索菜单或权限按钮"
              onChange={(event) => setSearchValue(event.target.value)}
            />
            <Checkbox checked={selectedOnly} onChange={(event) => setSelectedOnly(event.target.checked)}>
              仅看已选
            </Checkbox>
            <div className="tenant-permission-panel__filter-actions">
              <span className="tenant-permission-panel__current-count">
                当前终端已配置 {activeScopeStats.selected}/{activeScopeStats.total}
              </span>
              <Button type="link" size="small" disabled={!activeScope} onClick={toggleScope}>
                {scopeAllSelected ? '取消全选' : '全选当前终端'}
              </Button>
              <Button type="link" danger size="small" disabled={!activeScopeStats.selected} onClick={() => updateKeys(activeScopeKeys, false)}>
                清空当前终端
              </Button>
            </div>
          </div>
        </div>

        <div className="tenant-permission-panel__content">
          {activeModule && visibleModule ? (
            <>
              <div className="tenant-permission-panel__module-header">
                <div>
                  <div className="tenant-permission-panel__module-title">{activeModule.name}</div>
                  <div className="tenant-permission-panel__module-hint">按页面配置访问权限，页面下的按钮权限可单独勾选</div>
                </div>
                <div className="tenant-permission-panel__module-actions">
                  <span>
                    已配置 {activeModuleStats.selected}/{activeModuleStats.total}
                  </span>
                  <Button type="link" size="small" onClick={toggleModule}>
                    {moduleAllSelected ? '取消全选' : '全选模块'}
                  </Button>
                </div>
              </div>
              <div className="tenant-permission-panel__card-grid tenant-permission-panel__card-grid--root">{renderMenuNode(visibleModule, true)}</div>
            </>
          ) : (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={tree.length === 0 ? '暂未配置可用菜单' : '没有匹配的权限'} />
          )}
        </div>
      </div>
    </Spin>
  );
}
