import { KeyOutlined } from '@ant-design/icons';
import { DragModal, Fa, type DragModalProps, FaUtils, useApiLoading } from '@fa/ui';
import * as FaSecurityUtils from '@features/fa-admin-pages/components/utils/FaSecurityUtils';
import { ConfigLayoutContext } from '@features/fa-admin-pages/layout';
import { userApi } from '@features/fa-admin-pages/services';
import { Alert, Button, Form, Input, Modal, message } from 'antd';
import { useContext, useState } from 'react';

interface UsersChangePwdModalProps extends DragModalProps {
  userIds: string[];
  fetchFinish?: () => void;
}

/**
 * 批量修改密码
 */
export default function UsersChangePwdModal({ children, userIds, fetchFinish, ...props }: UsersChangePwdModalProps) {
  const { systemConfig } = useContext(ConfigLayoutContext);

  const [form] = Form.useForm();
  const [open, setOpen] = useState(false);

  /** 提交表单 */
  function onFinish(fieldsValue: any) {
    Modal.confirm({
      title: '确认批量修改密码？',
      content: `将立即重置 ${userIds.length} 位用户的登录密码，是否继续？`,
      okText: '确认重置',
      okType: 'danger',
      cancelText: '取消',
      onOk: () =>
        userApi
          .updateBatchPwd({ userIds, newPwd: fieldsValue.newPwd, passwordCheck: fieldsValue.passwordCheck })
          .then((res) => {
            if (res?.status !== Fa.RES_CODE.OK) {
              message.error(res?.message || '批量修改密码失败');
              return;
            }
            FaUtils.showResponse(res, '批量修改密码');
            form.resetFields();
            setOpen(false);
            fetchFinish?.();
          })
          .catch(() => message.error('批量修改密码失败，请重试')),
    });
  }

  function validateNewPwd(_rule: any, value: any) {
    form.setFieldsValue({ newPwdConfirm: undefined });
    const oldPwd = form.getFieldValue('oldPwd');
    if (oldPwd === value) {
      return Promise.reject('新旧密码不能一样');
    }

    return FaSecurityUtils.validatePasswordSafeRule(value, systemConfig);
  }

  function validateNewPwdConfirm(_rule: any, value: any) {
    const newPwd = form.getFieldValue('newPwd');
    if (newPwd !== value) {
      throw new Error('两次输入密码不一致');
    }
    return Promise.resolve();
  }

  function showModal() {
    form.resetFields();
    setOpen(true);
  }

  function handleCancel() {
    form.resetFields();
    setOpen(false);
  }

  const loading = useApiLoading([userApi.getUrl('updateBatchPwd')]);
  return (
    <>
      <Button danger icon={<KeyOutlined />} onClick={showModal}>
        修改密码
      </Button>
      <DragModal title={`批量修改密码（${userIds.length}人）`} open={open} onOk={() => form.submit()} confirmLoading={loading} onCancel={handleCancel} width={700} {...props}>
        <Alert
          type="warning"
          showIcon
          message={`将重置 ${userIds.length} 位用户的登录密码，操作成功后立即生效。`}
          style={{ marginBottom: 16 }}
        />
        <Form form={form} onFinish={onFinish}>
          <Form.Item name="passwordCheck" label="本账户密码" rules={[{ required: true }]} {...FaUtils.formItemFullLayout}>
            <Input.Password placeholder="请输入本账户密码，即自己的登录密码" />
          </Form.Item>
          <Form.Item name="newPwd" label="新密码" rules={[{ required: true }, { validator: validateNewPwd }]} {...FaUtils.formItemFullLayout}>
            <Input.Password placeholder="请输入新密码" />
          </Form.Item>
          <Form.Item name="newPwdConfirm" label="新密码确认" rules={[{ required: true }, { validator: validateNewPwdConfirm }]} {...FaUtils.formItemFullLayout}>
            <Input.Password placeholder="请再次输入新密码" />
          </Form.Item>
        </Form>
      </DragModal>
    </>
  );
}
