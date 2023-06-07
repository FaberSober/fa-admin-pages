import React from 'react';
import { NumBlock } from '@/components';


export interface SystemApiCountProps {
}

export function ApiCount() {

  return (
    <div className="fa-full">
      <NumBlock
        title="今日API访问数"
        value={9999}
        valueStyle={{color: '#33DE7F'}}
        unitStyle={{color: '#33DE7F'}}
      />
      <NumBlock
        title="今日API异常数"
        value={0}
        valueStyle={{color: '#ED5F62'}}
        unitStyle={{color: '#ED5F62'}}
        style={{marginTop: 12}}
      />
      <NumBlock
        title="定时任务异常数"
        value={0}
        valueStyle={{color: '#ED5F62'}}
        unitStyle={{color: '#ED5F62'}}
        style={{marginTop: 12}}
      />
    </div>
  );
}

ApiCount.displayName = "ApiCount"; // 必须与方法名称一致
ApiCount.title = "API统计";
ApiCount.description = "API访问数量统计";
ApiCount.showTitle = true; // 是否展示Card的Title
ApiCount.permission = ""; // 需要的权限
ApiCount.w = 4; // 宽度-max=16
ApiCount.h = 12; // 高度
