import { ApartmentOutlined } from '@ant-design/icons';
import { DragModal, Fa, type DragModalProps, FaUtils, useApiLoading } from '@fa/ui';
import DepartmentCascade from '@features/fa-admin-pages/components/helper/DepartmentCascade';
import { userApi } from '@features/fa-admin-pages/services';
import { Button, Form, Modal, message } from 'antd';
import { useState } from 'react';

interface UsersChangeDeptModalProps extends DragModalProps {
  userIds: string[];
  fetchFinish?: () => void;
}

/**
 * 批量修改部门
 */
export default function UsersChangeDeptModal({ children, userIds, fetchFinish, ...props }: UsersChangeDeptModalProps) {
  const [form] = Form.useForm();
  const [open, setOpen] = useState(false);

  /** 提交表单 */
  function onFinish(fieldsValue: any) {
    Modal.confirm({
      title: '确认批量修改部门？',
      content: `将修改 ${userIds.length} 位用户的所属部门，是否继续？`,
      okText: '确认修改',
      cancelText: '取消',
      onOk: () =>
        userApi
          .updateBatchDept({ userIds, departmentId: fieldsValue.departmentId })
          .then((res) => {
            if (res?.status !== Fa.RES_CODE.OK) {
              message.error(res?.message || '批量修改部门失败');
              return;
            }
            FaUtils.showResponse(res, '批量修改部门');
            form.resetFields();
            setOpen(false);
            fetchFinish?.();
          })
          .catch(() => message.error('批量修改部门失败，请重试')),
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

  const loading = useApiLoading([userApi.getUrl('updateBatchDept')]);
  return (
    <>
      <Button icon={<ApartmentOutlined />} onClick={showModal}>
        修改部门
      </Button>
      <DragModal title={`批量修改部门（${userIds.length}人）`} open={open} onOk={() => form.submit()} confirmLoading={loading} onCancel={handleCancel} width={700} {...props}>
        <Form form={form} onFinish={onFinish}>
          <Form.Item name="departmentId" label="部门" rules={[{ required: true }]} {...FaUtils.formItemFullLayout}>
            <DepartmentCascade />
          </Form.Item>
        </Form>
      </DragModal>
    </>
  );
}
