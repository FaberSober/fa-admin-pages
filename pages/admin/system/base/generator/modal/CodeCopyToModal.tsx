import React, {useContext, useState} from 'react';
import {Form, Input} from 'antd';
import {ApiEffectLayoutContext, DragModal, DragModalProps, FaUtils} from '@fa/ui';
import {iotDeviceApi as api} from '@/services';


export interface IotDeviceModalProps extends DragModalProps {
  onSubmit: (path: string) => void;
}

/**
 * HZX-厂商设备实体新增、编辑弹框
 */
export default function IotDeviceModal({ children, onSubmit, ...props }: IotDeviceModalProps) {
  const {loadingEffect} = useContext(ApiEffectLayoutContext)
  const [form] = Form.useForm();

  const [open, setOpen] = useState(false);

  /** 提交表单 */
  function onFinish(fieldsValue: any) {
    if (onSubmit) {
      onSubmit(fieldsValue.path)
    }
  }


  function showModal() {
    setOpen(true)
  }

  const loading = loadingEffect[api.getUrl('save')] || loadingEffect[api.getUrl('update')];
  return (
    <span>
      <span onClick={showModal}>
        {children}
      </span>
      <DragModal
        title="复制当前文件到..."
        open={open}
        onOk={() => form.submit()}
        confirmLoading={loading}
        onCancel={() => setOpen(false)}
        width={700}
        {...props}
      >
        <Form form={form} onFinish={onFinish}>
          <Form.Item name="path" label="复制路径" rules={[{ required: true }]} {...FaUtils.formItemFullLayout}>
            <Input.TextArea placeholder="请填写要复制到的目录的绝对路径" autoSize />
          </Form.Item>
        </Form>
      </DragModal>
    </span>
  )
}
