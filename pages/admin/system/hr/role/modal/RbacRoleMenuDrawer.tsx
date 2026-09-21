import { type Fa, FaUtils, useApiLoading } from '@fa/ui';
import { PermissionPanel } from '@features/fa-admin-pages/components';
import { rbacMenuApi, rbacRoleMenuApi, tenantPermissionApi } from '@features/fa-admin-pages/services';
import { Button, Drawer, type DrawerProps } from 'antd';
import { cloneElement, isValidElement, type Key, type ReactElement, useState } from 'react';
import type { Rbac } from '@/types';

export interface RbacRoleMenuDrawerProps extends DrawerProps {
  record: Rbac.RbacRole;
  success?: () => void;
}

function filterMenuTree(tree: Fa.TreeNode<Rbac.RbacMenu>[], allowedMenuIds: Set<string>): Fa.TreeNode<Rbac.RbacMenu>[] {
  return tree.flatMap((node) => {
    const children = node.children ? filterMenuTree(node.children, allowedMenuIds) : [];
    if (!allowedMenuIds.has(String(node.id)) && children.length === 0) return [];
    return [{ ...node, children: children.length > 0 ? children : undefined }];
  });
}

/**
 * BASE-角色表实体新增、编辑弹框
 */
export default function RbacRoleMenuDrawer({ children, record, ...props }: RbacRoleMenuDrawerProps) {
  const [tree, setTree] = useState<Fa.TreeNode<Rbac.RbacMenu>[]>([]);
  const [checkedMenuIds, setCheckedMenuIds] = useState<number[]>([]); // 选中的菜单ID

  const [open, setOpen] = useState(false);

  async function refreshData() {
    const isTenantRole = record.type === 3 || Boolean(record.tenantId);
    const [menuRes, roleMenuRes, tenantPermissionRes] = await Promise.all([
      rbacMenuApi.getTree({ query: { status: true }, sorter: 'scope ASC' }),
      rbacRoleMenuApi.getRoleMenu(record.id),
      isTenantRole && record.tenantId ? tenantPermissionApi.getMenuIds(record.tenantId) : Promise.resolve(null),
    ]);
    const allowedMenuIds = tenantPermissionRes?.data ? new Set(tenantPermissionRes.data.map(String)) : undefined;
    setTree(allowedMenuIds ? filterMenuTree(menuRes.data || [], allowedMenuIds) : menuRes.data || []);
    const roleMenuIds = roleMenuRes.data?.checkedMenuIds || [];
    setCheckedMenuIds(allowedMenuIds ? roleMenuIds.filter((id) => allowedMenuIds.has(String(id))) : roleMenuIds);
  }

  function handleSave() {
    rbacRoleMenuApi
      .updateRoleMenu({
        roleId: record.id,
        checkedMenuIds,
      })
      .then((res) => {
        FaUtils.showResponse(res, '更新角色权限');
        setOpen(false);
      });
  }

  async function showModal() {
    setOpen(true);
    await refreshData();
  }

  const triggerDom = isValidElement(children) ? (
    cloneElement(children as ReactElement<{ onClick?: () => void }>, { onClick: () => void showModal() })
  ) : (
    <Button type="link" onClick={() => void showModal()}>
      {children}
    </Button>
  );

  const loadingKeys = [rbacRoleMenuApi.getUrl('updateRoleMenu'), rbacRoleMenuApi.getUrl(`getRoleMenu/${record.id}`)];
  loadingKeys.push(rbacMenuApi.getUrl('getTree'));
  if ((record.type === 3 || record.tenantId) && record.tenantId) {
    loadingKeys.push(tenantPermissionApi.getUrl(`getMenuIds/${record.tenantId}`));
  }
  const loading = useApiLoading(loadingKeys);
  return (
    <span>
      {triggerDom}
      <Drawer
        title="角色权限设置"
        open={open}
        onClose={() => setOpen(false)}
        defaultSize={1200}
        resizable
        extra={
          <Button size="small" type="primary" onClick={handleSave} loading={loading}>
            更新
          </Button>
        }
        {...props}
      >
        <PermissionPanel
          tree={tree}
          requiredMenuIds={[]}
          checkedMenuIds={checkedMenuIds}
          loading={loading}
          onCheckedMenuIdsChange={(keys: Key[]) => setCheckedMenuIds(keys.map(Number))}
        />
      </Drawer>
    </span>
  );
}
