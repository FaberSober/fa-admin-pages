import React, { useState } from 'react';
import { Descriptions, Drawer, DrawerProps } from 'antd';
import { Admin } from '@/types';
import ReactJson from 'react-json-view';
import { FaUtils } from '@fa/ui';

export interface GateLogDrawerProps extends DrawerProps {
  record: Admin.LogApi;
}

/**
 * BASE-URL请求日志
 实体新增、编辑弹框
 */
export default function LogApiDrawer({ children, record, ...props }: GateLogDrawerProps) {
  const [open, setOpen] = useState(false);

  return (
    <span>
      <span onClick={() => setOpen(true)}>{children}</span>
      <Drawer title="查看请求详情" open={open} onClose={() => setOpen(false)} width={700} {...props}>
        <Descriptions bordered column={1} labelStyle={{ width: 120 }}>
          <Descriptions.Item label="模块">{record.biz}</Descriptions.Item>
          <Descriptions.Item label="操作">{record.opr}</Descriptions.Item>
          <Descriptions.Item label="类型">{record.crud}</Descriptions.Item>
          <Descriptions.Item label="URL">{record.url}</Descriptions.Item>
          <Descriptions.Item label="Method">{record.method}</Descriptions.Item>
          <Descriptions.Item label="User-Agent">{record.agent}</Descriptions.Item>
          <Descriptions.Item label="操作系统">{record.os}</Descriptions.Item>
          <Descriptions.Item label="浏览器">{record.browser}</Descriptions.Item>
          <Descriptions.Item label="浏览器版本">{record.version}</Descriptions.Item>
          <Descriptions.Item label="IP">{record.crtHost}</Descriptions.Item>
          <Descriptions.Item label="请求用户ID">{record.crtUser}</Descriptions.Item>
          <Descriptions.Item label="请求用户">{record.crtName}</Descriptions.Item>
          <Descriptions.Item label="请求时间">{record.crtTime}</Descriptions.Item>
          <Descriptions.Item label="请求花费时间">{record.duration}ms</Descriptions.Item>
          <Descriptions.Item label="省">{record.pro}</Descriptions.Item>
          <Descriptions.Item label="市">{record.city}</Descriptions.Item>
          <Descriptions.Item label="地址">{record.addr}</Descriptions.Item>
          <Descriptions.Item label="客户端来源">{record.faFrom}</Descriptions.Item>
          <Descriptions.Item label="客户端版本号">{record.versionCode}</Descriptions.Item>
          <Descriptions.Item label="客户端版本名">{record.versionName}</Descriptions.Item>
          <Descriptions.Item label="否为移动终端">{record.mobile ? '是' : '否'}</Descriptions.Item>
          <Descriptions.Item label="请求内容">
            {open && FaUtils.isJson(record.request) ? (
              <ReactJson
                src={JSON.parse(record.request)}
                collapsed={2}
                displayDataTypes={false}
                style={{ fontSize: '10px', maxHeight: '90vh', overflow: 'auto' }}
                // theme="monokai"
              />
            ) : (
              record.request
            )}
          </Descriptions.Item>
          <Descriptions.Item label="返回码">{record.retStatus}</Descriptions.Item>
          <Descriptions.Item label="返回内容">
            {open && FaUtils.isJson(record.response) ? (
              <ReactJson
                src={JSON.parse(record.response)}
                collapsed={2}
                displayDataTypes={false}
                style={{ fontSize: '10px', maxHeight: '90vh', overflow: 'auto' }}
                // theme="monokai"
              />
            ) : (
              record.response
            )}
          </Descriptions.Item>
        </Descriptions>
      </Drawer>
    </span>
  );
}
