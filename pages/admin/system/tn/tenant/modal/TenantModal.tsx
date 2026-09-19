import { EditOutlined, PlusOutlined } from '@ant-design/icons';
import { BaseBoolRadio, type CommonModalProps, Fa, FaFullContentModal, FaHref, FaUtils, treeUtils, useApiLoading } from '@fa/ui';
import ConfigLayoutContext from '@features/fa-admin-pages/layout/config/context/ConfigLayoutContext';
import { tenantApi as api, rbacMenuApi } from '@features/fa-admin-pages/services';
import { Button, DatePicker, Divider, Form, Input, InputNumber, message, Tree } from 'antd';
import { get } from 'lodash';
import React, { useContext, useEffect, useState } from 'react';
import type { Rbac, Tn } from '@/types';

const serviceName = '租户';

export default function TenantModal({ children, title, record, fetchFinish, addBtn, editBtn }: CommonModalProps<Tn.Tenant>) {
  const [form] = Form.useForm();
  const [open, setOpen] = useState(false);
  const [menuTree, setMenuTree] = useState<Fa.TreeNode<Rbac.RbacMenu>[]>([]);
  const [checkedMenuIds, setCheckedMenuIds] = useState<React.Key[]>([]);
  const [checkedKeys, setCheckedKeys] = useState<React.Key[]>([]);
  const { systemConfig } = useContext(ConfigLayoutContext);

  useEffect(() => {
    setCheckedKeys(treeUtils.calCheckedKey(menuTree, checkedMenuIds));
  }, [menuTree, checkedMenuIds]);

  async function loadMenuTree() {
    const res = await rbacMenuApi.getTree({ query: { status: true }, sorter: 'scope ASC' });
    setMenuTree(res.data || []);
  }

  function getInitialValues() {
    return {
      code: get(record, 'code'),
      name: get(record, 'name'),
      shortName: get(record, 'shortName'),
      status: get(record, 'status', true),
      expireTime: FaUtils.getInitialKeyTimeValue(record, 'expireTime'),
      contactName: get(record, 'contactName'),
      contactPhone: get(record, 'contactPhone'),
      contactEmail: get(record, 'contactEmail'),
      sort: get(record, 'sort', 0),
      description: get(record, 'description'),
    };
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) return;

    form.setFieldsValue(getInitialValues());
    setCheckedMenuIds([]);
    if (!record && systemConfig.tenantEnabled) {
      void loadMenuTree();
    }
  }

  function invokeInsertTask(params: Tn.TenantCreateReq) {
    api.createWithPermissions(params).then((res) => {
      FaUtils.showResponse(res, `新增${serviceName}`);
      if (res?.status === Fa.RES_CODE.OK) {
        setOpen(false);
        fetchFinish?.();
      }
    });
  }

  function invokeUpdateTask(params: Tn.Tenant) {
    api.update(params.id, params).then((res) => {
      FaUtils.showResponse(res, `更新${serviceName}`);
      if (res?.status === Fa.RES_CODE.OK) {
        setOpen(false);
        fetchFinish?.();
      }
    });
  }

  function onFinish(fieldsValue: any) {
    const tenant = {
      ...fieldsValue,
      expireTime: fieldsValue.expireTime ? FaUtils.getDateFullStr(fieldsValue.expireTime) : undefined,
    } as Tn.Tenant;

    if (record) {
      invokeUpdateTask({ ...record, ...tenant });
      return;
    }

    if (systemConfig.tenantEnabled && checkedMenuIds.length === 0) {
      message.error('请至少选择一个租户权限点');
      return;
    }
    invokeInsertTask({
      tenant,
      menuIds: checkedMenuIds.map((id) => Number(id)),
    });
  }

  const loading = useApiLoading([api.getUrl('createWithPermissions'), api.getUrl('update'), rbacMenuApi.getUrl('getTree')]);
  const triggerDom = (
    <span>
      {children}
      {addBtn && (
        <Button icon={<PlusOutlined />} type="primary">
          新增
        </Button>
      )}
      {editBtn && <FaHref icon={<EditOutlined />} text="编辑" />}
    </span>
  );

  return (
    <FaFullContentModal
      title={title}
      triggerDom={triggerDom}
      open={open}
      onOpenChange={handleOpenChange}
      onOk={() => {
        if (!loading) form.submit();
      }}
      onCancel={() => setOpen(false)}
    >
      <Form form={form} onFinish={onFinish} {...FaUtils.formItemFullLayout}>
        <Divider orientation="left">租户基础信息</Divider>
        <Form.Item name="code" label="租户编码" rules={[{ required: true }]}>
          <Input placeholder="请输入租户编码" maxLength={64} />
        </Form.Item>
        <Form.Item name="name" label="租户名称" rules={[{ required: true }]}>
          <Input placeholder="请输入租户名称" maxLength={255} />
        </Form.Item>
        <Form.Item name="shortName" label="租户简称">
          <Input placeholder="请输入租户简称" maxLength={255} />
        </Form.Item>
        <Form.Item name="status" label="状态" rules={[{ required: true }]}>
          <BaseBoolRadio />
        </Form.Item>
        <Form.Item name="expireTime" label="到期时间">
          <DatePicker showTime format="YYYY-MM-DD HH:mm:ss" style={{ width: '100%' }} placeholder="请选择到期时间" />
        </Form.Item>
        <Form.Item name="contactName" label="联系人">
          <Input placeholder="请输入联系人" maxLength={255} />
        </Form.Item>
        <Form.Item name="contactPhone" label="联系电话">
          <Input placeholder="请输入联系电话" maxLength={32} />
        </Form.Item>
        <Form.Item name="contactEmail" label="联系邮箱">
          <Input placeholder="请输入联系邮箱" maxLength={255} />
        </Form.Item>
        <Form.Item name="sort" label="排序">
          <InputNumber min={0} precision={0} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="description" label="描述">
          <Input.TextArea autoSize={{ minRows: 3, maxRows: 6 }} placeholder="请输入描述" />
        </Form.Item>

        {!record && systemConfig.tenantEnabled && (
          <>
            <Divider orientation="left">租户权限范围</Divider>
            <div className="fa-card fa-p12" style={{ minHeight: 320 }}>
              <Tree
                checkable
                treeData={menuTree}
                fieldNames={{ title: 'name', key: 'id' }}
                checkedKeys={checkedKeys}
                onCheck={(checked: any, info: any) => {
                  setCheckedMenuIds([...(checked || []), ...(info.halfCheckedKeys || [])]);
                }}
                titleRender={(node) => <span>{node.name}</span>}
              />
            </div>
          </>
        )}
      </Form>
    </FaFullContentModal>
  );
}
