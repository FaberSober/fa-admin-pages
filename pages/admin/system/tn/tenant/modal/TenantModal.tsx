import { EditOutlined, PlusOutlined } from '@ant-design/icons';
import { BaseBoolRadio, type CommonModalProps, Fa, FaFullContentModal, FaHref, FaUtils, useApiLoading } from '@fa/ui';
import ConfigLayoutContext from '@features/fa-admin-pages/layout/config/context/ConfigLayoutContext';
import { tenantApi as api, rbacMenuApi, tenantPermissionApi } from '@features/fa-admin-pages/services';
import { Button, DatePicker, Form, Input, InputNumber, message } from 'antd';
import { get } from 'lodash';
import type { Key } from 'react';
import { useContext, useState } from 'react';
import type { Rbac, Tn } from '@/types';
import './TenantModal.css';
import TenantPermissionPanel from './TenantPermissionPanel';

const serviceName = '租户';

export default function TenantModal({ children, title, record, fetchFinish, addBtn, editBtn }: CommonModalProps<Tn.Tenant>) {
  const [form] = Form.useForm();
  const [open, setOpen] = useState(false);
  const [menuTree, setMenuTree] = useState<Fa.TreeNode<Rbac.RbacMenu>[]>([]);
  const [checkedMenuIds, setCheckedMenuIds] = useState<Key[]>([]);
  const { systemConfig } = useContext(ConfigLayoutContext);

  async function loadMenuTree() {
    const res = await rbacMenuApi.getTree({ query: { status: true }, sorter: 'scope ASC' });
    const tree = res.data || [];
    setMenuTree(tree);
  }

  async function loadTenantPermissions(tenantId: string) {
    const res = await tenantPermissionApi.getMenuIds(tenantId);
    setCheckedMenuIds(res.data || []);
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

    form.resetFields();
    form.setFieldsValue(getInitialValues());
    setCheckedMenuIds([]);
    if (systemConfig.tenantEnabled) {
      setMenuTree([]);
      void loadMenuTree();
      if (record?.id) {
        void loadTenantPermissions(record.id);
      }
    }
  }

  function invokeInsertTask(params: Tn.TenantWithPermissionsReq) {
    api.createWithPermissions(params).then((res) => {
      FaUtils.showResponse(res, `新增${serviceName}`);
      if (res?.status === Fa.RES_CODE.OK) {
        setOpen(false);
        fetchFinish?.();
      }
    });
  }

  function invokeUpdateTask(params: Tn.TenantWithPermissionsReq) {
    api.updateWithPermissions(params).then((res) => {
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
      invokeUpdateTask({
        tenant: { ...record, ...tenant },
        menuIds: checkedMenuIds.map((id) => Number(id)),
      });
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

  const tenantPermissionsUrl = tenantPermissionApi.getUrl(record?.id ? `getMenuIds/${record.id}` : 'getMenuIds');
  const loading = useApiLoading([
    api.getUrl('createWithPermissions'),
    api.getUrl('updateWithPermissions'),
    rbacMenuApi.getUrl('getTree'),
    tenantPermissionsUrl,
  ]);
  const menuLoading = useApiLoading([rbacMenuApi.getUrl('getTree'), tenantPermissionsUrl]);
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
      okText={record ? '保存修改' : '创建租户'}
      onOk={() => {
        if (!loading) form.submit();
      }}
      onCancel={() => setOpen(false)}
    >
      <Form form={form} onFinish={onFinish} className="tenant-form" {...FaUtils.formItemFullLayout}>
        <div className="tenant-form-shell">
          <section className="tenant-form-section fa-card">
            <div className="tenant-form-section-header">
              <div>
                <div className="fa-h3">租户基础信息</div>
                <div className="tenant-form-section-hint">用于标识和联系该租户，带 * 的字段为必填项</div>
              </div>
            </div>

            <div className="tenant-form-grid">
              <Form.Item name="code" label="租户编码" rules={[{ required: true, whitespace: true }]} {...FaUtils.formItemHalfLayout}>
                <Input placeholder="请输入租户编码" maxLength={64} />
              </Form.Item>
              <Form.Item name="name" label="租户名称" rules={[{ required: true, whitespace: true }]} {...FaUtils.formItemHalfLayout}>
                <Input placeholder="请输入租户名称" maxLength={255} />
              </Form.Item>
              <Form.Item name="shortName" label="租户简称" {...FaUtils.formItemHalfLayout}>
                <Input placeholder="请输入租户简称" maxLength={255} />
              </Form.Item>
              <Form.Item name="status" label="状态" rules={[{ required: true }]} {...FaUtils.formItemHalfLayout}>
                <BaseBoolRadio />
              </Form.Item>
              <Form.Item name="expireTime" label="到期时间" {...FaUtils.formItemHalfLayout}>
                <DatePicker showTime format="YYYY-MM-DD HH:mm:ss" style={{ width: '100%' }} placeholder="请选择到期时间" />
              </Form.Item>
              <Form.Item name="contactName" label="联系人" {...FaUtils.formItemHalfLayout}>
                <Input placeholder="请输入联系人" maxLength={255} />
              </Form.Item>
              <Form.Item name="contactPhone" label="联系电话" {...FaUtils.formItemHalfLayout}>
                <Input placeholder="请输入联系电话" maxLength={32} />
              </Form.Item>
              <Form.Item name="contactEmail" label="联系邮箱" {...FaUtils.formItemHalfLayout}>
                <Input placeholder="请输入联系邮箱" maxLength={255} />
              </Form.Item>
              <Form.Item name="sort" label="排序" {...FaUtils.formItemHalfLayout}>
                <InputNumber min={0} precision={0} style={{ width: '100%' }} />
              </Form.Item>
            </div>

            <Form.Item name="description" label="描述" {...FaUtils.formItemFullLayout}>
              <Input.TextArea autoSize={{ minRows: 3, maxRows: 6 }} placeholder="请输入租户描述" />
            </Form.Item>
          </section>

          {systemConfig.tenantEnabled && (
            <section className="tenant-form-section fa-card">
              <div className="tenant-form-section-header">
                <div>
                  <div className="fa-h3">租户权限范围</div>
                  <div className="tenant-form-section-hint">
                    {record ? '修改后将同步该租户管理员的权限范围' : '所选权限将作为该租户管理员的初始权限范围，创建后仍可继续调整'}
                  </div>
                </div>
              </div>

              <TenantPermissionPanel tree={menuTree} checkedMenuIds={checkedMenuIds} loading={menuLoading} onCheckedMenuIdsChange={setCheckedMenuIds} />
            </section>
          )}
        </div>
      </Form>
    </FaFullContentModal>
  );
}
