import { clientTypes } from '@features/fa-admin-pages/components/telemetry';
import { useState } from 'react';
import { EditOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Form, Input, Select, Switch } from 'antd';
import { type CommonModalProps, DragModal, FaHref, FaUtils, useApiLoading } from '@fa/ui';
import { telemetryAppApi as api } from '@features/fa-admin-pages/services';
import type { Admin } from '@/types';

type AppValues = Pick<Admin.TelemetryApp, 'appKey' | 'appCode' | 'appName' | 'clientType' | 'enabled' | 'remark'>;

export default function TelemetryAppModal({ children, title, record, fetchFinish, addBtn, editBtn, ...props }: CommonModalProps<Admin.TelemetryApp>) {
  const [form] = Form.useForm<AppValues>();
  const [open, setOpen] = useState(false);
  const loading = useApiLoading([api.getUrl('save'), api.getUrl('update')]);

  function showModal() {
    form.resetFields();
    form.setFieldsValue(record ? { ...record } : { clientType: 'WEB', enabled: true });
    setOpen(true);
  }

  function onFinish(values: AppValues) {
    const params = { ...values, appKey: values.appKey.trim(), appCode: values.appCode.trim(), appName: values.appName.trim() };
    const request = record ? api.update(record.id, { ...record, ...params }) : api.save(params);
    request.then(res => {
      FaUtils.showResponse(res, record ? '更新应用' : '新增应用');
      setOpen(false);
      fetchFinish?.();
    });
  }

  return <span>
    <span onClick={showModal}>
      {children}
      {addBtn && <Button type="primary" icon={<PlusOutlined />}>新增</Button>}
      {editBtn && <FaHref icon={<EditOutlined />} text="编辑" />}
    </span>
    <DragModal {...props} title={title} open={open} onOk={() => form.submit()} confirmLoading={loading} onCancel={() => setOpen(false)} width={600}>
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item name="appName" label="应用名称" rules={[{ required: true, whitespace: true }, { max: 128 }]}><Input maxLength={128} /></Form.Item>
        <Form.Item name="appCode" label="应用编码" rules={[{ required: true, whitespace: true }, { max: 64 }]} extra="应用编码需唯一，例如 fa-admin。"><Input maxLength={64} /></Form.Item>
        <Form.Item name="appKey" label="AppKey" rules={[{ required: true, whitespace: true }, { max: 64 }]} extra="需与客户端 VITE_APP_TELEMETRY_APP_KEY 一致且唯一；修改后需同步客户端配置。"><Input maxLength={64} /></Form.Item>
        <Form.Item name="clientType" label="客户端类型" rules={[{ required: true }]}><Select options={clientTypes} /></Form.Item>
        <Form.Item name="enabled" label="允许上报" valuePropName="checked" extra="停用后，该应用的事件和异常上报将被拒绝。"><Switch checkedChildren="启用" unCheckedChildren="停用" /></Form.Item>
        <Form.Item name="remark" label="备注" rules={[{ max: 500 }]}><Input.TextArea rows={3} maxLength={500} showCount /></Form.Item>
      </Form>
    </DragModal>
  </span>;
}
