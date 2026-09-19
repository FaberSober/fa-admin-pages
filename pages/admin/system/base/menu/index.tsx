import {
  EditOutlined,
  MinusCircleOutlined,
  PlusCircleOutlined,
  PlusOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  SettingOutlined,
  SisternodeOutlined,
} from '@ant-design/icons';
import { AuthDelBtn, BaseTree, type Fa, FaEnums, FaFlexRestLayout, FaHref, FaUtils, useApiLoading, useDelete } from '@fa/ui';
import FaIconPro from '@features/fa-admin-pages/components/icons/FaIconPro';
import { rbacMenuApi } from '@features/fa-admin-pages/services';
import { Button, Segmented, Space, Tag } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { useCounter } from 'react-use';
import type { Rbac } from '@/types';
import './index.scss';
import MenuStatusSwitch from './MenuStatusSwitch';
import RbacMenuModal from './modal/RbacMenuModal';

/**
 * RBAC Menu Manage
 * @author xu.pengfei
 * @date 2022/12/15 15:57
 */
export default function Menu() {
  const [current, { inc }] = useCounter(0);
  const [scope, setScope] = useState<FaEnums.RbacMenuScopeEnum>(FaEnums.RbacMenuScopeEnum.WEB);
  const treeRef = useRef<{ collapseAll: () => void; expandAll: () => void }>(null);

  useEffect(() => {
    refreshData();
  }, [scope]);

  function refreshData() {
    inc();
  }

  const [handleDelete] = useDelete<string>(rbacMenuApi.remove, refreshData, '菜单');

  const loadingTree = useApiLoading([rbacMenuApi.getUrl('allTree')]);
  return (
    <div className="fa-full-content fa-flex-column fa-menu-div">
      <div className="fa-m12 fa-menu-toolbar">
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
            draggable
            extraEffectArgs={[current]}
          />
        </div>
      </FaFlexRestLayout>
    </div>
  );
}
