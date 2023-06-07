import React from 'react';
import {EchartsGaugeStep} from "@/components";


export interface SystemMemoryProps {
}

export function SystemMemory() {

  return (
    <div className="fa-full">
      <EchartsGaugeStep
        min={0}
        max={100}
        value={60}
        unit="%"
        // style={{width: 500, height: 300}}
      />
    </div>
  );
}

SystemMemory.displayName = "SystemMemory"; // 必须与方法名称一致
SystemMemory.title = "内存";
SystemMemory.description = "内存运行状态指标图";
SystemMemory.showTitle = true; // 是否展示Card的Title
SystemMemory.permission = ""; // 需要的权限
SystemMemory.w = 4; // 宽度-max=16
SystemMemory.h = 12; // 高度
