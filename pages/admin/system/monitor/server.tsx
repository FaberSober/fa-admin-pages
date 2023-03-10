import React, { useContext, useEffect, useState } from 'react';
import { Button, Card, Col, Descriptions, Row, Space } from 'antd';
import { Admin } from '@/types';
import { ApiEffectLayoutContext, FaUtils } from '@fa/ui';
import { ReloadOutlined } from '@ant-design/icons';
import { systemApi } from '@/services';


/**
 * @author xu.pengfei
 * @date 2022/10/17
 */
export default function Server() {
  const { loadingEffect } = useContext(ApiEffectLayoutContext);
  const [data, setData] = useState<Admin.ServerInfo>();

  useEffect(() => {
    fetchData();
  }, []);

  function fetchData() {
    systemApi.server().then((res) => setData(res.data));
  }


  const loading = loadingEffect[systemApi.getUrl('server')];
  return (
    <div className="fa-full-content fa-p12">
      <Space className="fa-mb12">
        <Button onClick={fetchData} loading={loading} icon={<ReloadOutlined />}>
          刷新
        </Button>
      </Space>
      {data !== undefined && (
        <Row gutter={12}>
          <Col md={12}>
            <Card title="CPU">
              <Descriptions column={1}>
                <Descriptions.Item label="核心数">{data.cpuInfo.cpuNum}</Descriptions.Item>
                <Descriptions.Item label="使用率">{data.cpuInfo.used}%</Descriptions.Item>
                <Descriptions.Item label="空闲率">{data.cpuInfo.free}%</Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>

          <Col md={12}>
            <Card title="内存">
              <Descriptions column={1}>
                <Descriptions.Item label="核心数">{FaUtils.sizeToHuman(data.memory.total)}</Descriptions.Item>
                <Descriptions.Item label="使用数">{FaUtils.sizeToHuman(data.memory.total - data.memory.available)}</Descriptions.Item>
                <Descriptions.Item label="空闲数">{FaUtils.sizeToHuman(data.memory.available)}</Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>
        </Row>
      )}
    </div>
  );
}
