import React, { useContext, useEffect, useState } from 'react';
import { ApiEffectLayoutContext, BaseBoolRadio, FaUtils } from '@fa/ui';
import { Button, Col, Form, Row, Space } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import { configSysApi } from '@/services';
import { Admin } from '@/types';


/**
 * @author xu.pengfei
 * @date 2022/12/11 22:48
 */
export default function ConfigSafe() {
  const { loadingEffect } = useContext(ApiEffectLayoutContext);
  const [form] = Form.useForm();
  const [configSys, setConfigSys] = useState<Admin.ConfigSys>();

  useEffect(() => {
    configSysApi.getOne().then((res) => {
      setConfigSys(res.data);
      form.setFieldsValue({
        ...res.data.data,
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

  const loading = loadingEffect[configSysApi.getUrl('update')];
  return (
    <div className="fa-p12">
      <Form form={form} onFinish={onFinish} layout="vertical">
        <Row gutter={12}>
          <Col md={8}>
            <Form.Item name="safeCaptchaOn" label="是否开启验证码" rules={[{ required: true }]}>
              <BaseBoolRadio />
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
