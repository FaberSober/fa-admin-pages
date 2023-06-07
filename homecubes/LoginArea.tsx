import React from 'react';
import {EchartsPie} from "@/components";


export interface LoginAreaProps {
}

export function LoginArea() {

  return (
    <div className="fa-full">
      <EchartsPie
        title="Pie"
        subTitle="Pie Chart"
        data={[
          {value: 1048, name: 'Search Engine'},
          {value: 735, name: 'Direct'},
          {value: 580, name: 'Email'},
          {value: 484, name: 'Union Ads'},
          {value: 300, name: 'Video Ads'}
        ]}
        dataTitle="销量"
        // style={{width: 500, height: 300}}
      />
    </div>
  );
}

LoginArea.displayName = "LoginArea"; // 必须与方法名称一致
LoginArea.title = "登录地区统计";
LoginArea.description = "登录地区统计柱状图";
LoginArea.showTitle = true; // 是否展示Card的Title
LoginArea.permission = ""; // 需要的权限
LoginArea.w = 5; // 宽度-max=16
LoginArea.h = 12; // 高度
