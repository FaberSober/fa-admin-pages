import React, { CSSProperties, useEffect, useRef, useState } from 'react';
import {v4 as uuidv4} from 'uuid'
import * as echarts from 'echarts';
import { ECharts, BarSeriesOption } from 'echarts';
import { Fa } from '@fa/ui'
import { useSize } from "ahooks";


export interface EchartsBarProps {
  title?: string,
  subTitle?: string,
  data: Fa.ChartArrayData[];
  dataTitle?: string,
  style?: CSSProperties;
  barSeriesOption?: BarSeriesOption;
}

/**
 * @author xu.pengfei
 * @date 2023/2/2 09:52
 */
export default function EchartsBar({title, subTitle, data, dataTitle, style, barSeriesOption}: EchartsBarProps) {

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
    chartRef.current.setOption({
      title: {
        text: title,
        subtext: subTitle,
        left: 'center'
      },
      tooltip: {
        trigger: 'item'
      },
      legend: {
        orient: 'vertical',
        left: 'left'
      },
      xAxis: {
        data: data.map(i => i.name),
        // data: ['衬衫', '羊毛衫', '雪纺衫', '裤子', '高跟鞋', '袜子']
      },
      yAxis: {},
      series: [
        {
          name: dataTitle,
          type: 'bar',
          // data: [5, 20, 36, 10, 10, 20]
          data: data.map(i => i.value),
          ...barSeriesOption,
        }
      ]
    });
    setReady(true)
  }, [])

  useEffect(() => {
    if (!ready) return;

    // @ts-ignore
    chartRef.current.setOption({
      series: [
        { data }
      ]
    })
  }, [data])

  return (
    <div ref={domRef} style={{ position: 'relative', height: '100%', width: '100%', ...style }}>
      <div id={id} style={{ height: '100%', width: '100%' }} />
    </div>
  )
}
