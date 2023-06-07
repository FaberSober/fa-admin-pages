import React from 'react';
import {EchartsLine} from "@/components";


export interface LoginLineProps {
}

export function LoginLine() {

  return (
    <div className="fa-full">
      <EchartsLine
        dataX={["一", "二", "三", "四", "五", "六", "七"]}
        dataY={[
          {
            name: '指标1',
            data: [4,5,4,5,4,5,6],
          }
        ]}
        restOption={{ toolbox: {show: false} }}
      />
    </div>
  );
}

LoginLine.displayName = "LoginLine"; // 必须与方法名称一致
LoginLine.title = "每日登录统计";
LoginLine.description = "每日登录统计折线图";
LoginLine.showTitle = true; // 是否展示Card的Title
LoginLine.permission = ""; // 需要的权限
LoginLine.w = 11; // 宽度-max=16
LoginLine.h = 12; // 高度
