import { EditOutlined, PlusOutlined } from '@ant-design/icons';
import { type CommonModalProps, DictEnumApiRadio, DictEnumApiSelector, Fa, FaFullContentModal, FaHref, FaUtils, UploadImgLocal, useApiLoading } from '@fa/ui';
import DepartmentCascade from '@features/fa-admin-pages/components/helper/DepartmentCascade';
import RbacRoleSelect from '@features/fa-admin-pages/components/helper/RbacRoleSelect';
import ConfigLayoutContext from '@features/fa-admin-pages/layout/config/context/ConfigLayoutContext';
import UserLayoutContext from '@features/fa-admin-pages/layout/user/context/UserLayoutContext';
import { userApi as api, rbacUserRoleApi } from '@features/fa-admin-pages/services';
import { Alert, Button, Form, Input, message, Switch } from 'antd';
import { get } from 'lodash';
import { useContext, useRef, useState } from 'react';
import useBus from 'use-bus';
import type { Admin } from '@/types';
import './UserModal.css';

const serviceName = '';

interface UserModalProps extends CommonModalProps<Admin.User> {
  defaultDepartmentId?: string;
}

/**
 * 用户实体新增、编辑弹框
 */
export default function UserModal({ children, title, record, fetchFinish, addBtn, editBtn, defaultDepartmentId }: UserModalProps) {
  const [form] = Form.useForm();
  const [open, setOpen] = useState(false);
  const [rolesLoading, setRolesLoading] = useState(false);
  const roleRequestId = useRef(0);
  const { systemConfig } = useContext(ConfigLayoutContext);
  const { user, selectedTenant } = useContext(UserLayoutContext);

  function getInitialValues(initialDepartmentId = defaultDepartmentId) {
    const isSuperAdmin = get(record, 'superAdmin', false) === true;

    return {
      name: get(record, 'name'),
      username: get(record, 'username'),
      tel: get(record, 'tel'),
      email: get(record, 'email'),
      password: get(record, 'password'),
      departmentId: get(record, 'departmentId', initialDepartmentId),
      sex: get(record, 'sex'),
      status: isSuperAdmin ? true : get(record, 'status', true),
      adminEnabled: get(record, 'adminEnabled', false),
      description: get(record, 'description'),
      post: get(record, 'post'),
      img: get(record, 'img'),
      workStatus: get(record, 'workStatus'),
      roleIds: [],
    };
  }

  function prepareForm(initialDepartmentId = defaultDepartmentId) {
    const requestId = roleRequestId.current + 1;
    roleRequestId.current = requestId;
    form.resetFields();
    form.setFieldsValue(getInitialValues(initialDepartmentId));
    setRolesLoading(record !== undefined);
    if (record === undefined) {
      return;
    }

    rbacUserRoleApi.getUserRoles(record.id)
      .then((res) => {
        if (roleRequestId.current !== requestId) {
          return;
        }
        const roleIds = res.data
          .filter((role) => !systemConfig.tenantEnabled || user.superAdmin || (role.type === 3 && role.tenantId === selectedTenant?.tenantId))
          .map((role) => role.id);
        form.setFieldsValue({ roleIds });
      })
      .catch(() => {
        if (roleRequestId.current === requestId) {
          message.error('加载用户角色失败，请重试');
        }
      })
      .finally(() => {
        if (roleRequestId.current === requestId) {
          setRolesLoading(false);
        }
      });
  }

  useBus(
    ['@@UserModal/SHOW_ADD'],
    ({ payload }) => {
      if (record === undefined) {
        prepareForm(payload.departmentId);
        setOpen(true);
      }
    },
    [record, defaultDepartmentId, selectedTenant?.tenantId, systemConfig.tenantEnabled, user.superAdmin],
  );

  /** 新增Item */
  function invokeInsertTask(params: any) {
    api.save(params).then((res) => {
      FaUtils.showResponse(res, `新增${serviceName}`);
      if (res?.status !== Fa.RES_CODE.OK) {
        message.error(res?.message || '新增用户失败');
        return;
      }
      form.resetFields();
      setOpen(false);
      fetchFinish?.();
    }).catch(() => message.error('新增用户失败，请重试'));
  }

  /** 更新Item */
  function invokeUpdateTask(params: any) {
    api.update(params.id, params).then((res) => {
      FaUtils.showResponse(res, `更新${serviceName}`);
      if (res?.status !== Fa.RES_CODE.OK) {
        message.error(res?.message || '更新用户失败');
        return;
      }
      form.resetFields();
      setOpen(false);
      fetchFinish?.();
    }).catch(() => message.error('更新用户失败，请重试'));
  }

  /** 提交表单 */
  function onFinish(fieldsValue: any) {
    if (rolesLoading) {
      message.info('角色权限加载完成后才能提交');
      return;
    }
    const values = {
      ...fieldsValue,
    };
    if (record) {
      invokeUpdateTask({ ...record, ...values });
    } else {
      invokeInsertTask({ ...values });
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      roleRequestId.current += 1;
      setRolesLoading(false);
    }
    setOpen(nextOpen);
    if (nextOpen) {
      prepareForm();
    } else {
      form.resetFields();
    }
  }

  const loading = useApiLoading([api.getUrl('save'), api.getUrl('update')]);
  const triggerDom = (
    <span>
      {children}
      {addBtn && (
        <Button icon={<PlusOutlined />} type="primary">
          新增用户
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
      okText={record ? '保存修改' : '创建用户'}
      confirmLoading={loading || rolesLoading}
      onOk={() => {
        if (!loading && !rolesLoading) form.submit();
      }}
      onCancel={() => form.resetFields()}
    >
      <Form form={form} onFinish={onFinish} className="user-form" {...FaUtils.formItemFullLayout}>
        <div className="user-form-shell">
          <section className="user-form-section fa-card">
            <div className="user-form-section-header">
              <div>
                <div className="fa-h3">基础资料</div>
                <div className="user-form-section-hint">用于标识用户及其所属组织，带 * 的字段为必填项</div>
              </div>
            </div>

            <div className="user-form-grid">
              <Form.Item name="departmentId" label="部门" rules={[{ required: true }]} {...FaUtils.formItemHalfLayout}>
                <DepartmentCascade />
              </Form.Item>
              <Form.Item name="name" label="姓名" rules={[{ required: true }]} {...FaUtils.formItemHalfLayout}>
                <Input placeholder="请输入姓名" />
              </Form.Item>
              <Form.Item name="tel" label="手机号" rules={[{ required: true }]} {...FaUtils.formItemHalfLayout}>
                <Input placeholder="请输入手机号，手机号不可重复" />
              </Form.Item>
              <Form.Item name="workStatus" label="工作状态" rules={[{ required: true }]} {...FaUtils.formItemHalfLayout}>
                <DictEnumApiSelector enumName="UserWorkStatusEnum" />
              </Form.Item>
            </div>
          </section>

          <section className="user-form-section fa-card">
            <div className="user-form-section-header">
              <div>
                <div className="fa-h3">账号与权限</div>
                <div className="user-form-section-hint">控制登录账号、角色和后台访问能力</div>
              </div>
            </div>

            {rolesLoading && <Alert className="user-form-loading-hint" type="info" showIcon message="正在加载角色权限，完成后才能提交表单" />}

            <div className="user-form-grid">
              <Form.Item name="username" label="账户" rules={[{ required: true }]} {...FaUtils.formItemHalfLayout}>
                <Input placeholder="请输入账户，账户不可重复" />
              </Form.Item>
              {record === undefined && (
                <Form.Item name="password" label="密码" rules={[{ required: true }]} {...FaUtils.formItemHalfLayout}>
                  <Input.Password placeholder="请输入密码" />
                </Form.Item>
              )}
              <Form.Item name="roleIds" label="角色" rules={[{ required: true }]} {...FaUtils.formItemHalfLayout}>
                <RbacRoleSelect mode="multiple" />
              </Form.Item>
              <Form.Item name="status" label="账户有效" rules={[{ required: true }]} {...FaUtils.formItemHalfLayout} valuePropName="checked">
                <Switch
                  checkedChildren="有效"
                  unCheckedChildren="禁止"
                  disabled={record?.superAdmin === true}
                  title={record?.superAdmin === true ? '超级管理员账户必须保持有效' : undefined}
                />
              </Form.Item>
              <Form.Item name="adminEnabled" label="后台访问" rules={[{ required: true }]} {...FaUtils.formItemHalfLayout} valuePropName="checked">
                <Switch checkedChildren="允许" unCheckedChildren="禁止" />
              </Form.Item>
            </div>
          </section>

          <section className="user-form-section fa-card">
            <div className="user-form-section-header">
              <div>
                <div className="fa-h3">补充资料</div>
                <div className="user-form-section-hint">完善联系和展示信息，可按需填写</div>
              </div>
            </div>

            <div className="user-form-grid">
              <Form.Item name="email" label="邮箱" {...FaUtils.formItemHalfLayout}>
                <Input placeholder="请输入邮箱" />
              </Form.Item>
              <Form.Item name="sex" label="性别" {...FaUtils.formItemHalfLayout}>
                <DictEnumApiRadio enumName="SexEnum" />
              </Form.Item>
              <Form.Item name="post" label="职务" {...FaUtils.formItemHalfLayout}>
                <Input placeholder="请输入职务" />
              </Form.Item>
              <Form.Item name="img" label="头像" {...FaUtils.formItemHalfLayout}>
                <UploadImgLocal />
              </Form.Item>
            </div>

            <Form.Item name="description" label="备注" {...FaUtils.formItemFullLayout}>
              <Input.TextArea autoSize />
            </Form.Item>
          </section>
        </div>
      </Form>
    </FaFullContentModal>
  );
}
