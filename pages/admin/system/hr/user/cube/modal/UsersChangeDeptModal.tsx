import React, { useContext, useState } from 'react';
import { Button, Form } from 'antd';
import { ApiEffectLayoutContext, DragModal, DragModalProps, FaUtils } from '@fa/ui';
import { DepartmentCascade } from '@/components';
import { userApi } from '@/services';


interface IProps extends DragModalProps {
  userIds: string[];
  fetchFinish?: () => void;
}

/**
 * 批量更新部门
 */
export default function UsersChangeDeptModal({ children, userIds, fetchFinish, ...props }: IProps) {
  const { loadingEffect } = useContext(ApiEffectLayoutContext);
  const [form] = Form.useForm();
  const [open, setOpen] = useState(false);

  /** 提交表单 */
  function onFinish(fieldsValue: any) {
    userApi.updateInfoBatch({userIds, departmentId: fieldsValue.departmentId}).then((res) => {
      FaUtils.showResponse(res, '批量更新部门');
      setOpen(false);
      if (fetchFinish) fetchFinish();
    });
  }

  function showModal() {
    setOpen(true);
  }

  const loading = loadingEffect[userApi.getUrl('save')]
  return (
    <span>
      <span onClick={() => showModal()}><Button>修改部门</Button></span>
      <DragModal
        title="批量修改部门"
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
        </Form>
      </DragModal>
    </span>
  );
}
