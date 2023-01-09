import React, { useState } from 'react';
import * as homecubes from '@/homecubes'
import { FaGridLayout } from "@features/fa-admin-pages";
import { Layout } from "react-grid-layout";
import { each } from "lodash";
import { Card, Space, Switch } from "antd";


console.log('homecubes', homecubes)


const layout: Layout[] = new Array();
each(homecubes, (k) => {
  layout.push({
    i: k.displayName,
    w: k.w,
    h: k.h,
    x: 0,
    y: 0,
  })
})
console.log('layout', layout)

/**
 * @author xu.pengfei
 * @date 2023/1/3 16:13
 */
export default function index() {
  const [editing, setEditing] = useState(false)

  function onLayoutChange(layout: Layout[]) {
    console.log('onLayoutChange', layout)
  }

  return (
    <div className="fa-full-content">
      <FaGridLayout
        layout={layout}
        renderItem={i => {
          if ((homecubes as any)[i.i]) {
            const Component = (homecubes as any)[i.i];
            if (!Component.showTitle) {
              return <Component />
            }
            return (
              <Card title={Component.title} size="small" style={{height: '100%'}}>
                <Component />
              </Card>
            )
          }
          return <span>Component {i.i} Not Found</span>
        }}
        onLayoutChange={onLayoutChange}
        rowHeight={20}
        cols={16}
        isDraggable={editing}
        isResizable={editing}
      />

      <Space style={{ position: 'absolute', top: 12, right: 12 }}>
        <Switch checkedChildren="退出编辑" unCheckedChildren="编辑布局" checked={editing} onChange={(e) => setEditing(e)} />
      </Space>
    </div>
  )
}
