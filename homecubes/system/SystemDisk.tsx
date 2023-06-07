import React from 'react';
import {EchartsGaugeStep} from "@/components";


export interface SystemDiskProps {
}

export function SystemDisk() {

  return (
    <div className="fa-full">
      <EchartsGaugeStep
        min={0}
        max={100}
        value={50}
        unit="%"
        // style={{width: 500, height: 300}}
      />
    </div>
  );
}

SystemDisk.displayName = "SystemDisk"; // 必须与方法名称一致
SystemDisk.title = "磁盘";
SystemDisk.description = "磁盘运行状态指标图";
SystemDisk.showTitle = true; // 是否展示Card的Title
SystemDisk.permission = ""; // 需要的权限
SystemDisk.w = 4; // 宽度-max=16
SystemDisk.h = 12; // 高度
