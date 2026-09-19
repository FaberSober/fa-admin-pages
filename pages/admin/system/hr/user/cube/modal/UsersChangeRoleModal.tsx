import { TeamOutlined } from '@ant-design/icons';
import { DragModal, Fa, type DragModalProps, FaUtils, useApiLoading } from '@fa/ui';
import RbacRoleSelect from '@features/fa-admin-pages/components/helper/RbacRoleSelect';
import { userApi } from '@features/fa-admin-pages/services';
import { Button, Form, Modal, message } from 'antd';
import { useState } from 'react';

interface UsersChangeRoleModalProps extends DragModalProps {
  userIds: string[];
  fetchFinish?: () => void;
}

/**
 * 批量更新角色
 */
export default function UsersChangeRoleModal({ children, userIds, fetchFinish, ...props }: UsersChangeRoleModalProps) {
  const [form] = Form.useForm();
  const [open, setOpen] = useState(false);

  /** 提交表单 */
  function onFinish(fieldsValue: any) {
    Modal.confirm({
      title: '确认批量修改角色？',
      content: `将覆盖 ${userIds.length} 位用户的角色配置，是否继续？`,
      okText: '确认修改',
      cancelText: '取消',
      onOk: () =>
        userApi
          .updateBatchRole({ userIds, roleIds: fieldsValue.roleIds })
          .then((res) => {
            if (res?.status !== Fa.RES_CODE.OK) {
              message.error(res?.message || '批量修改角色失败');
              return;
            }
            FaUtils.showResponse(res, '批量更新角色');
            form.resetFields();
            setOpen(false);
            fetchFinish?.();
          })
          .catch(() => message.error('批量修改角色失败，请重试')),
    });
  }

  function showModal() {
    form.resetFields();
    setOpen(true);
  }

  function handleCancel() {
    form.resetFields();
    setOpen(false);
  }

  const loading = useApiLoading([userApi.getUrl('updateBatchRole')]);
  return (
    <>
      <Button icon={<TeamOutlined />} onClick={showModal}>
        修改角色
      </Button>
      <DragModal title={`批量修改角色（${userIds.length}人）`} open={open} onOk={() => form.submit()} confirmLoading={loading} onCancel={handleCancel} width={700} {...props}>
        <Form form={form} onFinish={onFinish}>
          <Form.Item name="roleIds" label="角色" rules={[{ required: true }]} {...FaUtils.formItemFullLayout}>
            <RbacRoleSelect mode="multiple" />
          </Form.Item>
        </Form>
      </DragModal>
    </>
  );
}
