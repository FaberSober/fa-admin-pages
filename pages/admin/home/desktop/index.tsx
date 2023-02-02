import React, { useContext, useEffect, useState } from 'react';
import * as homecubes from '@/homecubes'
import { FaGridLayout } from "@/components";
import { Layout } from "react-grid-layout";
import { each, isNil } from "lodash";
import { Button, Card, List, Space, Spin, Switch } from "antd";
import { configApi } from '@/services'
import { Admin } from '@/types'
import { ApiEffectLayoutContext, BaseDrawer } from "@fa/ui";
import { LoadingOutlined, PlusOutlined } from "@ant-design/icons";


console.log('homecubes', homecubes)

const biz = "HOME_LAYOUT";
const type = "LAYOUT";

const allLayout: Layout[] = new Array();
each(homecubes, (k) => {
  allLayout.push({
    i: k.displayName,
    w: k.w,
    h: k.h,
    x: 0,
    y: 0,
  })
})
console.log('layout', allLayout)

/**
 * @author xu.pengfei
 * @date 2023/1/3 16:13
 */
export default function index() {
  const { loadingEffect } = useContext(ApiEffectLayoutContext);
  const loading = loadingEffect[configApi.getUrl('save')] || loadingEffect[configApi.getUrl('update')];

  const [editing, setEditing] = useState(false)
  const [config, setConfig] = useState<Admin.Config<Layout[]>>();
  const [layout, setLayout] = useState<Layout[]>([])

  useEffect(() => {
    configApi.getOne(biz, type).then(res => {
      if (res.data) {
        setLayout(res.data.data)
        setConfig(res.data)
      } else {
        setConfig(undefined)
        setLayout([])
      }
    })
  }, [])

  function onLayoutChange(layout: Layout[]) {
    console.log('onLayoutChange', layout)
    if (loading) return
    const params = {
      biz,
      type,
      data: layout
    }
    if (config) {
      configApi.update(config.id, { id: config.id, ...params })
    } else {
      configApi.save(params).then(res => {
        setConfig(res.data)
      })
    }
  }

  function handleAdd(id: string) {
    const Component = (homecubes as any)[id];
    setLayout([
      ...layout,
      {
        i: Component.displayName,
        w: Component.w,
        h: Component.h,
        x: 0,
        y: 0,
      }
    ])
  }

  function handleDel(id: string) {
    setLayout(layout.filter(i => i.i !== id))
  }

  const inIds:string[] = layout.map(i => i.i);
  return (
    <div className="fa-full-content">
      <FaGridLayout
        layout={layout}
        renderItem={i => {
          const Component = (homecubes as any)[i.i];
          if (Component) {
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
        {loading && <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />}

        <BaseDrawer
          title="添加组件"
          triggerDom={<Button shape="circle" icon={<PlusOutlined />} size="small" />}
          bodyStyle={{padding: 0}}
        >
          <List
            itemLayout="horizontal"
            dataSource={allLayout}
            size="small"
            renderItem={(item) => {
              const Component = (homecubes as any)[item.i];
              if (isNil(Component)) {
                return null;
              }
              const sel = inIds.indexOf(item.i) > -1
              return (
                <List.Item
                  extra={(
                    <div>
                      {!sel && <a onClick={() => handleAdd(item.i)} key="list-item-add">添加</a>}
                      {sel  && <a onClick={() => handleDel(item.i)} key="list-item-del" style={{ color: '#F00' }}>移除</a>}
                    </div>
                  )}
                >
                  <List.Item.Meta
                    title={<a onClick={() => handleAdd(item.i)}>{Component.title}</a>}
                    description={Component.description}
                  />
                </List.Item>
              )
            }}
          />
        </BaseDrawer>
        <Switch checkedChildren="退出编辑" unCheckedChildren="编辑布局" checked={editing} onChange={(e) => setEditing(e)} />
      </Space>
    </div>
  )
}
