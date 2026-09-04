import type { Admin } from '@/types';
import { SaveOutlined } from '@ant-design/icons';
import { FaUtils, useApiLoading } from '@fa/ui';
import { configSysApi } from '@features/fa-admin-pages/services';
import { Button, Col, Form, InputNumber, Row, Select, Space, Switch } from 'antd';
import { useEffect, useState } from 'react';

/**
 * @author xu.pengfei
 * @date 2025/05/30 11:20
 */
export default function ConfigLog() {
  const [form] = Form.useForm();
  const [configSys, setConfigSys] = useState<Admin.ConfigSys>();

  useEffect(() => {
    configSysApi.getOne().then((res) => {
      setConfigSys(res.data);
      form.setFieldsValue({
        ...res.data.data,
        logArchiveEnabled: res.data.data.logArchiveEnabled ?? false,
        logArchiveRetentionPolicy: res.data.data.logArchiveRetentionPolicy ?? 'FOREVER',
        logArchiveRetentionMonths: res.data.data.logArchiveRetentionMonths ?? 12,
        telemetryErrorEventRetentionDays: res.data.data.telemetryErrorEventRetentionDays ?? 180,
        telemetryStatEventRetentionDays: res.data.data.telemetryStatEventRetentionDays ?? 180,
      });
    });
  }, []);

  function onFinish(v: any) {
    if (configSys === undefined) return;

    const params = {
      id: configSys.id,
      data: { ...configSys.data, ...v },
    };
    configSysApi.update(configSys.id, params).then((res) => FaUtils.showResponse(res, '更新配置'));
  }

  function handleReset() {
    if (configSys === undefined) return;
    form.setFieldsValue({
      ...configSys.data,
    });
  }

  const loading = useApiLoading([configSysApi.getUrl('update')]);
  const archiveEnabled = Form.useWatch('logArchiveEnabled', form);
  const retentionPolicy = Form.useWatch('logArchiveRetentionPolicy', form);

  return (
    <div className="fa-p12">
      <Form form={form} onFinish={onFinish} layout="vertical">
        <Row>
          <Col md={8}>
            <Form.Item name="logSaveLevel" label="日志保存级别" rules={[{ required: true }]}>
              <Select
                options={[
                  { label: '全部', value: 'all' },
                  { label: '记录请求URL(不记录请求内容与返回内容，节省日志空间)', value: 'simple' },
                  { label: '不记录', value: 'no' },
                ]}
              />
            </Form.Item>
          </Col>
        </Row>
        <Row>
          <Col md={8}>
            <Form.Item name="logArchiveEnabled" label="按月归档" valuePropName="checked" help="每月归档上一个自然月的请求日志">
              <Switch />
            </Form.Item>
          </Col>
        </Row>
        {archiveEnabled && (
          <>
            <Row>
              <Col md={8}>
                <Form.Item name="logArchiveRetentionPolicy" label="归档日志保留策略" rules={[{ required: true }]}>
                  <Select
                    options={[
                      { label: '永久保留', value: 'FOREVER' },
                      { label: '保留指定月数', value: 'MONTHS' },
                    ]}
                  />
                </Form.Item>
              </Col>
            </Row>
            {retentionPolicy === 'MONTHS' && (
              <Row>
                <Col md={8}>
                  <Form.Item name="logArchiveRetentionMonths" label="归档日志保留月数" rules={[{ required: true }]}>
                    <InputNumber step={1} min={1} max={1200} addonAfter="个月" />
                  </Form.Item>
                </Col>
              </Row>
            )}
          </>
        )}

        <Row gutter={12}>
          <Col md={8}>
            <Form.Item name="telemetryErrorEventRetentionDays" label="Telemetry 异常明细保留" help="到期后仅清理异常明细，Issue 聚合长期保留" rules={[{ required: true }]}>
              <InputNumber step={1} min={1} max={3650} addonAfter="天" />
            </Form.Item>
          </Col>
          <Col md={8}>
            <Form.Item name="telemetryStatEventRetentionDays" label="Telemetry 统计明细保留" help="到期后仅清理统计明细，每日聚合长期保留" rules={[{ required: true }]}>
              <InputNumber step={1} min={1} max={3650} addonAfter="天" />
            </Form.Item>
          </Col>
        </Row>

        <Space>
          <Button htmlType="submit" icon={<SaveOutlined />} type="primary" loading={loading}>
            保存
          </Button>
          <Button onClick={handleReset}>重置</Button>
        </Space>
      </Form>
    </div>
  );
}
