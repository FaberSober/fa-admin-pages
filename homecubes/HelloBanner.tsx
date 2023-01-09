import React from 'react';


export interface HelloBannerProps {
}

export function HelloBanner() {
  return <div>HelloBanner</div>;
}

HelloBanner.displayName = "HelloBanner";
HelloBanner.title = "组件HelloBanner";
HelloBanner.showTitle = false; // 是否展示Card的Title
HelloBanner.permission = ""; // 需要的权限
HelloBanner.w = 16; // 宽度
HelloBanner.h = 3; // 高度
