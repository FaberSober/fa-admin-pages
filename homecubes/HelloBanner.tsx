import React, { useContext, useState } from 'react';
import { UserLayoutContext } from "@features/fa-admin-pages/layout";
import { FaUtils } from "@fa/ui";
import { useInterval } from "ahooks";


export interface HelloBannerProps {
}

export function HelloBanner() {
  const {user} = useContext(UserLayoutContext)
  const [time, setTime] = useState(FaUtils.getCurDateTime())

  useInterval(() => {
    setTime(FaUtils.getCurDateTime())
  }, 1000)

  return (
    <div style={{ padding: 12 }}>
      <div style={{fontSize: '18px', fontWeight: 600}} className="fa-mb12">Hello, {user.name}.</div>
      <div>{time}</div>
    </div>
  );
}

HelloBanner.displayName = "HelloBanner";
HelloBanner.title = "欢迎组件";
HelloBanner.description = "欢迎组件";
HelloBanner.showTitle = false; // 是否展示Card的Title
HelloBanner.permission = ""; // 需要的权限
HelloBanner.w = 16; // 宽度
HelloBanner.h = 3; // 高度
