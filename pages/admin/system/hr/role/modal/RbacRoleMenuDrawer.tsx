import { MobileOutlined } from '@ant-design/icons';
import { type Fa, FaUtils, treeUtils, useApiLoading } from '@fa/ui';
import { rbacMenuApi, rbacRoleMenuApi, tenantPermissionApi } from '@features/fa-admin-pages/services';
import { Button, Drawer, type DrawerProps, Tree } from 'antd';
import type React from 'react';
import { useEffect, useState } from 'react';
import { FaEnums, type Rbac } from '@/types';

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
  const [checkedKeys, setCheckedKeys] = useState<React.Key[]>([]); // 根据选中的菜单ID，计算出的展示全选中的Tree节点ID（过滤掉半选中的节点ID）

  const [open, setOpen] = useState(false);

  useEffect(() => {
    const cks = treeUtils.calCheckedKey(tree, checkedMenuIds);
    // const diffIds = difference(checkedKeys, cks)
    // console.log('tree', tree, 'checkedMenuIds', checkedMenuIds, 'cks', cks, 'diffIds', diffIds)
    setCheckedKeys(cks);
  }, [tree, checkedMenuIds]);

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

  const loadingKeys = [rbacRoleMenuApi.getUrl('updateRoleMenu'), rbacRoleMenuApi.getUrl(`getRoleMenu/${record.id}`)];
  if ((record.type === 3 || record.tenantId) && record.tenantId) {
    loadingKeys.push(tenantPermissionApi.getUrl(`getMenuIds/${record.tenantId}`));
  }
  const loading = useApiLoading(loadingKeys);
  return (
    <span>
      <span onClick={showModal}>{children}</span>
      <Drawer
        title="角色权限设置"
        open={open}
        onClose={() => setOpen(false)}
        defaultSize={600}
        resizable
        extra={
          <Button size="small" type="primary" onClick={handleSave} loading={loading}>
            更新
          </Button>
        }
        {...props}
      >
        <Tree
          checkable
          treeData={tree}
          fieldNames={{ title: 'name', key: 'id' }}
          checkedKeys={checkedKeys}
          onCheck={(checked: any, e: any) => {
            // console.log('checked', checked, 'e', e)
            setCheckedMenuIds([...(checked || []), ...(e.halfCheckedKeys || [])]);
          }}
          titleRender={(node) => {
            return (
              <div className="fa-flex-row fa-flex-row-center">
                {node.level === 1 && node.sourceData.scope === FaEnums.RbacMenuScopeEnum.APP && <MobileOutlined />}
                <div>{node.name}</div>
              </div>
            );
          }}
        />
      </Drawer>
    </span>
  );
}
