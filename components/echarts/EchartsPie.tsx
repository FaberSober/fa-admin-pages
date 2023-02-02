import React, { CSSProperties, useEffect, useRef, useState } from 'react';
import {v4 as uuidv4} from 'uuid'
import * as echarts from 'echarts';
import { ECharts, PieSeriesOption } from 'echarts';
import { Fa } from '@fa/ui'


export interface EchartsPieProps {
  title?: string,
  subTitle?: string,
  data: Fa.ChartArrayData[];
  dataTitle?: string,
  style?: CSSProperties;
  pieSeriesOption?: PieSeriesOption,
}

/**
 * @author xu.pengfei
 * @date 2023/2/2 09:52
 */
export default function EchartsPie({title, subTitle, data, dataTitle, style, pieSeriesOption}: EchartsPieProps) {

  const chartRef = useRef<ECharts>()
  const [id] = useState(uuidv4())
  const [ready, setReady] = useState(false)

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
      series: [
        {
          name: dataTitle,
          type: 'pie',
          radius: '50%',
          data,
          // data: [
          //   { value: 1048, name: 'Search Engine' },
          //   { value: 735, name: 'Direct' },
          //   { value: 580, name: 'Email' },
          //   { value: 484, name: 'Union Ads' },
          //   { value: 300, name: 'Video Ads' }
          // ],
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          },
          ...pieSeriesOption,
        }
      ],
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
    <div style={{ position: 'relative', height: '100%', width: '100%', ...style }}>
      <div id={id} style={{ height: '100%', width: '100%' }} />
    </div>
  )
}
