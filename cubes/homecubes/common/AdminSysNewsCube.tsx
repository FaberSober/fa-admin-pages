import React, { useEffect, useState } from 'react';
import { Admin } from "@features/fa-admin-pages/types";
import { fileSaveApi, sysNewsApi } from "@features/fa-admin-pages/services";
import { Carousel } from "antd";
import { useSize } from "ahooks";
import { BaseDrawer } from "@fa/ui";
import SysNewsView from "@features/fa-admin-pages/pages/admin/system/base/sysNews/cube/SysNewsView";


export function AdminSysNewsCube() {
  const size = useSize(document.getElementById('AdminSysNewsCube'));
  const [array, setArray] = useState<Admin.SysNews[]>([])

  useEffect(() => {
    sysNewsApi.list({query:{}, sorter: 'ID DESC'}).then(res => {
      setArray(res.data)
    })
  }, [])

  console.log('size', size)

  return (
    <div id="AdminSysNewsCube" className="fa-full-content">
      <Carousel>
        {array.map(item => (
          <BaseDrawer
            key={item.id}
            triggerDom={(
              <div className="fa-relative fa-link" style={{ width: size?.width, height: size?.height }}>
                <img style={{ width: size?.width, height: size?.height }} src={fileSaveApi.genLocalGetFile(item.cover)} />
                <div className="fa-absolute fa-right fa-bottom fa-bg-dark fa-flex-row-center" style={{ color: '#FFF', padding: '2px 4px' }}>
                  <div>{item.title} / {item.pubTime}</div>
                </div>
              </div>
            )}
          >
            <SysNewsView item={item} />
          </BaseDrawer>
        ))}
      </Carousel>
    </div>
  );
}

AdminSysNewsCube.displayName = "AdminSysNewsCube"; // 必须与方法名称一致
AdminSysNewsCube.title = "新闻";
AdminSysNewsCube.description = "展示系统新闻轮播图片列表";
AdminSysNewsCube.showTitle = false; // 是否展示Card的Title
AdminSysNewsCube.permission = ""; // 需要的权限-对应RbacMenu.linkUrl
AdminSysNewsCube.w = 8; // 宽度-max=16
AdminSysNewsCube.h = 8; // 高度
