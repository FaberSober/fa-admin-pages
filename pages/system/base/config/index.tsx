import React, { useState } from 'react';
import { Segmented } from 'antd';
import ConfigSystem from '@fa-admin-pages/pages/system/base/config/cube/ConfigSystem';
import ConfigStorage from '@fa-admin-pages/pages/system/base/config/cube/storage/ConfigStorage';
import { DatabaseOutlined, SettingOutlined } from '@ant-design/icons';

/**
 * 系统配置
 * @author xu.pengfei
 * @date 2022/12/11 22:42
 */
export default function index() {
  const [tab, setTab] = useState('system');

  return (
    <div className="fa-full-content-p12">
      <Segmented
        value={tab}
        onChange={(v: any) => setTab(v)}
        options={[
          {
            label: '系统配置',
            value: 'system',
            icon: <SettingOutlined />,
          },
          {
            label: '文件配置',
            value: 'file',
            icon: <DatabaseOutlined />,
          },
        ]}
      />

      <div className="fa-mt12 fa-bg-white">
        {tab === 'system' && <ConfigSystem />}
        {tab === 'file' && <ConfigStorage />}
      </div>
    </div>
  );
}
