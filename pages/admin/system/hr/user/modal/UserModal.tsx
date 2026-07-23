import type { Admin } from '@/types';
import { EditOutlined, PlusOutlined } from '@ant-design/icons';
import { type CommonModalProps, DictEnumApiRadio, DictEnumApiSelector, DragModal, FaHref, FaUtils, UploadImgLocal, useApiLoading } from '@fa/ui';
import DepartmentCascade from '@features/fa-admin-pages/components/helper/DepartmentCascade';
import RbacRoleSelect from '@features/fa-admin-pages/components/helper/RbacRoleSelect';
import { userApi as api, rbacUserRoleApi } from '@features/fa-admin-pages/services';
import { Button, Form, Input, Switch } from 'antd';
import { get } from 'lodash';
import { useState } from 'react';
import useBus from 'use-bus';

const serviceName = '';

/**
 * 用户实体新增、编辑弹框
 */
export default function UserModal({ children, title, record, fetchFinish, addBtn, editBtn, ...props }: CommonModalProps<Admin.User>) {
  const [form] = Form.useForm();
  const [open, setOpen] = useState(false);

  useBus(
    ['@@UserModal/SHOW_ADD'],
    ({ payload }) => {
      if (record === undefined) {
        form.setFieldsValue({ departmentId: payload.departmentId });
        setOpen(true);
      }
    },
    [record],
  );

  /** 新增Item */
  function invokeInsertTask(params: any) {
    api.save(params).then((res) => {
      FaUtils.showResponse(res, `新增${serviceName}`);
      setOpen(false);
      if (fetchFinish) fetchFinish();
    });
  }

  /** 更新Item */
  function invokeUpdateTask(params: any) {
    api.update(params.id, params).then((res) => {
      FaUtils.showResponse(res, `更新${serviceName}`);
      setOpen(false);
      if (fetchFinish) fetchFinish();
    });
  }

  /** 提交表单 */
  function onFinish(fieldsValue: any) {
    const values = {
      ...fieldsValue,
    };
    if (record) {
      invokeUpdateTask({ ...record, ...values });
    } else {
      invokeInsertTask({ ...values });
    }
  }

  function getInitialValues() {
    return {
      name: get(record, 'name'),
      username: get(record, 'username'),
      tel: get(record, 'tel'),
      email: get(record, 'email'),
      password: get(record, 'password'),
      departmentId: get(record, 'departmentId'),
      sex: get(record, 'sex'),
      status: get(record, 'status', true),
      adminEnabled: get(record, 'adminEnabled', false),
      description: get(record, 'description'),
      post: get(record, 'post'),
      img: get(record, 'img'),
      workStatus: get(record, 'workStatus'),
      roleIds: [],
    };
  }

  function showModal() {
    setOpen(true);

    form.setFieldsValue(getInitialValues());
    if (record !== undefined) {
      rbacUserRoleApi.getUserRoles(record.id).then((res) => {
        form.setFieldsValue({ roleIds: res.data.map((i) => i.id) });
      });
    }
  }

  const loading = useApiLoading([ api.getUrl('save'), api.getUrl('update')]);
  return (
    <span>
      <span onClick={showModal}>
        {children}
        {addBtn && (
          <Button icon={<PlusOutlined />} type="primary">
            新增
          </Button>
        )}
        {editBtn && <FaHref icon={<EditOutlined />} text="编辑" />}
      </span>
      <DragModal title={title} open={open} onOk={() => form.submit()} confirmLoading={loading} onCancel={() => setOpen(false)} width={700} {...props}>
        <Form form={form} onFinish={onFinish}>
          <Form.Item name="departmentId" label="部门" rules={[{ required: true }]} {...FaUtils.formItemFullLayout}>
            <DepartmentCascade />
          </Form.Item>
          <Form.Item name="name" label="姓名" rules={[{ required: true }]} {...FaUtils.formItemFullLayout}>
            <Input placeholder="请输入姓名" />
          </Form.Item>
          <Form.Item name="username" label="账户" rules={[{ required: true }]} {...FaUtils.formItemFullLayout}>
            <Input placeholder="请输入账户，账户不可重复" />
          </Form.Item>
          <Form.Item name="tel" label="手机号" rules={[{ required: true }]} {...FaUtils.formItemFullLayout}>
            <Input placeholder="请输入手机号，手机号不可重复" />
          </Form.Item>
          {record === undefined && (
            <Form.Item name="password" label="密码" rules={[{ required: true }]} {...FaUtils.formItemFullLayout}>
              <Input.Password placeholder="请输入密码" />
            </Form.Item>
          )}
          <Form.Item name="roleIds" label="角色" rules={[{ required: true }]} {...FaUtils.formItemFullLayout}>
            <RbacRoleSelect mode="multiple" />
          </Form.Item>
          <Form.Item name="status" label="账户有效" rules={[{ required: true }]} {...FaUtils.formItemFullLayout} valuePropName="checked">
            <Switch checkedChildren="有效" unCheckedChildren="禁止" />
          </Form.Item>
          <Form.Item name="adminEnabled" label="后台访问" rules={[{ required: true }]} {...FaUtils.formItemFullLayout} valuePropName="checked">
            <Switch checkedChildren="允许" unCheckedChildren="禁止" />
          </Form.Item>
          <Form.Item name="email" label="邮箱" {...FaUtils.formItemFullLayout}>
            <Input placeholder="请输入邮箱" />
          </Form.Item>
          <Form.Item name="sex" label="性别" {...FaUtils.formItemFullLayout}>
            <DictEnumApiRadio enumName="SexEnum" />
          </Form.Item>
          <Form.Item name="workStatus" label="工作状态" rules={[{ required: true }]} {...FaUtils.formItemFullLayout}>
            <DictEnumApiSelector enumName="UserWorkStatusEnum" />
          </Form.Item>
          <Form.Item name="img" label="头像" {...FaUtils.formItemFullLayout}>
            <UploadImgLocal />
          </Form.Item>
          <Form.Item name="description" label="备注" {...FaUtils.formItemFullLayout}>
            <Input.TextArea autoSize />
          </Form.Item>
        </Form>
      </DragModal>
    </span>
  );
}
