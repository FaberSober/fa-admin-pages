import React, {useEffect, useState} from 'react';
import {useInterval} from "ahooks";
import {EchartsGaugeStep} from "@/components";
import {Admin} from "@/types";
import {systemApi} from "@/services";


export interface SystemMemoryProps {
}

export function SystemMemory() {
  const [data, setData] = useState<Admin.ServerInfo>();

  useEffect(() => {
    fetchData();
  }, []);

  useInterval(fetchData, 5000);

  function fetchData() {
    systemApi.server().then((res) => setData(res.data));
  }

  let value:any = 0;
  if (data && data.memory && data.memory.total > 0) {
    const used = data.memory.total - data.memory.available;
    value = (used / data.memory.total * 100).toFixed(0);
  }

  return (
    <div className="fa-full">
      <EchartsGaugeStep
        min={0}
        max={100}
        value={value}
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
