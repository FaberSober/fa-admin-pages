import React from 'react';
import {Tabs} from "antd";
import ConfigStorageLocal from "@fa-admin-pages/pages/admin/system/base/config/cube/storage/ConfigStorageLocal";

/**
 * @author xu.pengfei
 * @date 2022/12/29 15:38
 */
export default function ConfigStorage() {
  return (
    <div>
      <Tabs
        defaultActiveKey="1"
        className="fa-bg-white"
        items={[
          { label: `本地文件`, key: '1', children: <ConfigStorageLocal /> },
          // { label: `邮件配置`, key: '3', children: `TODO` },
          // { label: `短信配置`, key: '4', children: `TODO` },
        ]}
        tabPosition="left"
        destroyInactiveTabPane
      />
    </div>
  )
}
