import React, {CSSProperties, useEffect, useRef, useState} from 'react';
import {v4 as uuidv4} from 'uuid'
import * as echarts from 'echarts';
import {ECharts, EChartsOption} from 'echarts';
import {useSize} from "ahooks";


export interface EchartsBaseProps {
  option?: EChartsOption,
  style?: CSSProperties;
}

/**
 * @author xu.pengfei
 * @date 2023/2/2 09:52
 */
export default function EchartsBase({option, style}: EchartsBaseProps) {

  const chartRef = useRef<ECharts>()
  const [id] = useState(uuidv4())
  const [ready, setReady] = useState(false)

  const domRef = useRef<any | null>();
  const size = useSize(domRef);

  useEffect(() => {
    // console.log('size', size)
    if (!ready) return;

    chartRef.current!.resize();
  }, [size])

  useEffect(() => {
    // 基于准备好的dom，初始化echarts实例
    // @ts-ignore
    chartRef.current = echarts.init(document.getElementById(id));

    // @ts-ignore
    chartRef.current.setOption(option);
    setReady(true)
  }, [])

  useEffect(() => {
    if (!ready) return;
    if (option === undefined) return;

    chartRef.current!.setOption(option)
  }, [option])

  return (
    <div ref={domRef} style={{ position: 'relative', height: '100%', width: '100%', ...style }}>
      <div id={id} style={{ height: '100%', width: '100%' }} />
    </div>
  )
}
