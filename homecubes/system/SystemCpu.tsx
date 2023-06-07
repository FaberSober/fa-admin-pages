import React from 'react';
import {EchartsGaugeStep} from "@/components";


export interface SystemCpuProps {
}

export function SystemCpu() {

  return (
    <div className="fa-full">
      <EchartsGaugeStep
        min={0}
        max={100}
        value={20}
        unit="%"
        // style={{width: 500, height: 300}}
      />
    </div>
  );
}

SystemCpu.displayName = "SystemCpu"; // 必须与方法名称一致
SystemCpu.title = "CPU";
SystemCpu.description = "CPU运行状态指标图";
SystemCpu.showTitle = true; // 是否展示Card的Title
SystemCpu.permission = ""; // 需要的权限
SystemCpu.w = 4; // 宽度-max=16
SystemCpu.h = 12; // 高度
