import React, {CSSProperties, useContext, useEffect, useRef, useState} from 'react';
import {v4 as uuidv4} from 'uuid'
import * as echarts from 'echarts';
import {ECharts} from 'echarts';
import {useSize} from "ahooks";
import {LangContext} from "@features/fa-admin-pages/layout";


export interface EchartsGaugeStepProps {
  min: number;
  max: number;
  value: number;
  unit?: string;
  restOption?: any;
  style?: CSSProperties;
}

/**
 * @author xu.pengfei
 * @date 2023/6/7 11:22
 */
export default function EchartsGaugeStep({min, max, value, unit, restOption, style}: EchartsGaugeStepProps) {
  const {themeDark} = useContext(LangContext)

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
    if (chartRef.current) chartRef.current.dispose();

    // 基于准备好的dom，初始化echarts实例
    const theme = themeDark ? 'dark' : 'light'
    // @ts-ignore
    chartRef.current = echarts.init(document.getElementById(id), theme);

    // @ts-ignore
    chartRef.current.setOption({
      backgroundColor: 'transparent',
      series: [
        {
          type: 'gauge',
          center: ['50%', '60%'],
          radius: '90%',
          startAngle: 200,
          endAngle: -20,
          min: min,
          max: max,
          splitNumber: 10,
          axisLine: {
            lineStyle: {
              width: 6,
              color: [
                [0.25, '#FF6E76'],
                [0.5, '#FDDD60'],
                [0.75, '#58D9F9'],
                [1, '#7CFFB2']
              ]
            }
          },
          pointer: {
            icon: 'path://M12.8,0.7l12,40.1H0.7L12.8,0.7z',
            length: '12%',
            width: 14,
            offsetCenter: [0, '-60%'],
            itemStyle: {
              color: '#999'
            }
          },
          axisTick: {
            length: 12,
            lineStyle: {
              color: '#999',
              width: 1
            }
          },
          splitLine: {
            length: 20,
            lineStyle: {
              color: '#999',
              width: 3
            }
          },
          axisLabel: {
            show: false,
          },
          title: {
            offsetCenter: [0, '-15%'],
            fontSize: 20
          },
          detail: {
            fontSize: 30,
            offsetCenter: [0, '-15%'],
            valueAnimation: true,
            formatter: `{value} ${unit}`,
            color: 'inherit'
          },
          data: [
            {
              value: value
            }
          ]
        }
      ],
      ...restOption
    });
    setReady(true)
  }, [themeDark])

  useEffect(() => {
    if (!ready) return;

    // @ts-ignore
    chartRef.current.setOption({
      series: [
        {
          data: [
            {
              value
            }
          ]
        },
        {
          data: [
            {
              value
            }
          ]
        }
      ]
    })
  }, [value])

  return (
    <div ref={domRef} style={{ position: 'relative', height: '100%', width: '100%', ...style }}>
      <div id={id} style={{ height: '100%', width: '100%' }} />
    </div>
  )
}
