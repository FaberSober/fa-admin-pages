import React, { useContext, useState } from 'react';
import { ApiEffectLayoutContext, AuthDelBtn, BaseTree, BaseTreeContext, Fa, FaEnums, FaHref, FaIcon, rbacMenuApi, useDelete } from '@fa/ui';
import RbacMenuModal from '@fa-admin-pages/pages/admin/system/base/menu/modal/RbacMenuModal';
import { Rbac } from '@/types';
import styles from './index.module.scss';
import { EditOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Space } from 'antd';
import { useCounter } from "react-use";


/**
 * RBAC Menu Manage
 * @author xu.pengfei
 * @date 2022/12/15 15:57
 */
export default function index() {
  const { loadingEffect } = useContext(ApiEffectLayoutContext);
  const [edit, setEdit] = useState<Fa.TreeNode<Rbac.RbacMenu, string>>();
  const [open, setOpen] = useState(false);
  const [current, { inc }] = useCounter(0);

  function refreshData() {
    setOpen(false);
    inc()
  }

  const [handleDelete] = useDelete<string>(rbacMenuApi.remove, refreshData, '菜单');

  function showEditModal(item: Fa.TreeNode<Rbac.RbacMenu, string>) {
    setEdit(item);
    setOpen(true);
  }

  const loadingTree = loadingEffect[rbacMenuApi.getUrl('allTree')];
  return (
    <BaseTreeContext.Provider value={{ renderCount: current, updateRenderCount: inc }}>
      <div className={['fa-full-content', 'fa-flex-column', styles.menuDiv].join(' ')}>
        <Space style={{ margin: 12 }}>
          <Button onClick={refreshData} loading={loadingTree}>
            刷新
          </Button>
          <RbacMenuModal title="新增菜单" fetchFinish={refreshData}>
            <Button type="primary" icon={<PlusOutlined />} loading={loadingTree}>
              新增菜单
            </Button>
          </RbacMenuModal>
        </Space>

        <BaseTree
          // showRoot
          showOprBtn
          // onSelect={(keys) => console.log('onSelect', keys)}
          onAfterDelItem={() => {}}
          // 自定义配置
          serviceName="Tree"
          ServiceModal={RbacMenuModal}
          serviceApi={rbacMenuApi}
          bodyStyle={{ width: '100%', height: '100%' }}
          showTips={false}
          showTopBtn={false}
          // @ts-ignore
          titleRender={(item: Fa.TreeNode<Rbac.RbacMenu, string>) => (
            <div className={styles.item}>
              <div style={{ flex: 1 }}>{item.name}</div>
              <div style={{ width: 100 }}>{item.sourceData.icon ? <FaIcon icon={item.sourceData.icon} /> : null}</div>
              <div style={{ width: 100 }}>{FaEnums.RbacMenuLevelEnumMap[item.sourceData.level]}</div>
              <div style={{ width: 400 }}>{item.sourceData.linkUrl}</div>
              <Space>
                <FaHref icon={<EditOutlined />} text="编辑" onClick={() => showEditModal(item)} />
                <AuthDelBtn handleDelete={() => handleDelete(item.id)} />
              </Space>
            </div>
          )}
          showLine={false}
          draggable
        />

        <RbacMenuModal title="编辑菜单" record={edit?.sourceData} fetchFinish={refreshData} open={open} onCancel={() => setOpen(false)} />
      </div>
    </BaseTreeContext.Provider>
  );
}
