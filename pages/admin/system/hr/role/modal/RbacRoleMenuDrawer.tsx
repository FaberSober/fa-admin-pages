import React, { useContext, useEffect, useState } from 'react';
import { Button, Drawer, DrawerProps, Tree } from 'antd';
import { ApiEffectLayoutContext, Fa, FaUtils, treeUtils } from '@fa/ui';
import { Rbac } from '@/types';
import { rbacMenuApi, rbacRoleMenuApi } from '@features/fa-admin-pages/services';


export interface RbacRoleMenuDrawerProps extends DrawerProps {
  record: Rbac.RbacRole;
  success?: () => void;
}

/**
 * BASE-角色表实体新增、编辑弹框
 */
export default function RbacRoleMenuDrawer({ children, record, ...props }: RbacRoleMenuDrawerProps) {
  const { loadingEffect } = useContext(ApiEffectLayoutContext);
  const [tree, setTree] = useState<Fa.TreeNode<Rbac.RbacMenu>[]>([]);
  const [checkedMenuIds, setCheckedMenuIds] = useState<number[]>([]); // 选中的菜单ID
  const [checkedKeys, setCheckedKeys] = useState<React.Key[]>([]); // 根据选中的菜单ID，计算出的展示全选中的Tree节点ID（过滤掉半选中的节点ID）

  const [open, setOpen] = useState(false);

  useEffect(() => {
    const cks = treeUtils.calCheckedKey(tree, checkedMenuIds)
    // const diffIds = difference(checkedKeys, cks)
    // console.log('tree', tree, 'checkedMenuIds', checkedMenuIds, 'cks', cks, 'diffIds', diffIds)
    setCheckedKeys(cks)
  }, [tree, checkedMenuIds])

  async function refreshData() {
    const res = await rbacMenuApi.getTree({ query: { status: true } });
    setTree(res.data);

    const res2 = await rbacRoleMenuApi.getRoleMenu(record.id);
    setCheckedMenuIds(res2.data.checkedMenuIds);
  }

  function handleSave() {
    rbacRoleMenuApi.updateRoleMenu({
      roleId: record.id,
      checkedMenuIds,
    }).then((res) => {
      FaUtils.showResponse(res, '更新角色权限');
      setOpen(false);
    });
  }

  async function showModal() {
    setOpen(true);
    await refreshData();
  }

  const loading = loadingEffect[rbacRoleMenuApi.getUrl('updateRoleMenu')];
  return (
    <span>
      <span onClick={showModal}>{children}</span>
      <Drawer
        title="角色权限设置"
        open={open}
        onClose={() => setOpen(false)}
        width={700}
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
            console.log('checked', checked, 'e', e)
            setCheckedMenuIds([ ...(checked||[]), ...(e.halfCheckedKeys || [])]);
          }}
        />
      </Drawer>
    </span>
  );
}
