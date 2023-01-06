import React, { useContext, useState } from 'react';
import { get } from 'lodash';
import { Form, Input, Switch } from 'antd';
import { ApiEffectLayoutContext, DictEnumApiRadio, DragModal, DragModalProps, FaUtils, UploadImgLocal } from '@fa/ui';
import DepartmentCascade from '../helper/DepartmentCascade';
import RbacRoleSelect from '@fa-admin-pages/pages/admin/system/hr/role/components/RbacRoleSelect';
import useBus from 'use-bus';
import { Admin } from '@/types';
import { rbacUserRoleApi, userApi } from '@/services';

const serviceName = '用户';

interface IProps extends DragModalProps {
  title?: string;
  record?: Admin.User;
  fetchFinish?: () => void;
}

/**
 * 用户实体新增、编辑弹框
 */
export default function UserModal({ children, title, record, fetchFinish, ...props }: IProps) {
  const { loadingEffect } = useContext(ApiEffectLayoutContext);
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
    userApi.save(params).then((res) => {
      FaUtils.showResponse(res, `新增${serviceName}`);
      setOpen(false);
      if (fetchFinish) fetchFinish();
    });
  }

  /** 更新Item */
  function invokeUpdateTask(params: any) {
    userApi.update(params.id, params).then((res) => {
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
      description: get(record, 'description'),
      post: get(record, 'post'),
      img: get(record, 'img'),
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

  const loading = loadingEffect[userApi.getUrl('save')] || loadingEffect[userApi.getUrl('update')];
  return (
    <span>
      <span onClick={() => showModal()}>{children}</span>
      <DragModal
        title={title}
        open={open}
        onOk={() => form.submit()}
        confirmLoading={loading}
        onCancel={() => setOpen(false)}
        width={700}
        {...props}
      >
        <Form form={form} onFinish={onFinish}>
          <Form.Item name="departmentId" label="部门" rules={[{ required: true }]} {...FaUtils.formItemFullLayout}>
            <DepartmentCascade />
          </Form.Item>
          <Form.Item name="name" label="姓名" rules={[{ required: true }]} {...FaUtils.formItemFullLayout}>
            <Input />
          </Form.Item>
          <Form.Item name="username" label="账户" rules={[{ required: true }]} {...FaUtils.formItemFullLayout}>
            <Input />
          </Form.Item>
          <Form.Item name="tel" label="手机号" rules={[{ required: true }]} {...FaUtils.formItemFullLayout}>
            <Input />
          </Form.Item>
          {record === undefined && (
            <Form.Item name="password" label="密码" rules={[{ required: true }]} {...FaUtils.formItemFullLayout}>
              <Input.Password />
            </Form.Item>
          )}
          <Form.Item name="roleIds" label="角色" rules={[{ required: true }]} {...FaUtils.formItemFullLayout}>
            <RbacRoleSelect mode="multiple" />
          </Form.Item>
          <Form.Item name="status" label="账户有效" rules={[{ required: true }]} {...FaUtils.formItemFullLayout} valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="email" label="邮箱" {...FaUtils.formItemFullLayout}>
            <Input />
          </Form.Item>
          <Form.Item name="sex" label="性别" {...FaUtils.formItemFullLayout}>
            <DictEnumApiRadio enumName="SexEnum" />
          </Form.Item>
          <Form.Item name="img" label="头像" {...FaUtils.formItemFullLayout}>
            <UploadImgLocal />
          </Form.Item>
          <Form.Item name="description" label="备注" {...FaUtils.formItemFullLayout}>
            <Input.TextArea />
          </Form.Item>
        </Form>
      </DragModal>
    </span>
  );
}
