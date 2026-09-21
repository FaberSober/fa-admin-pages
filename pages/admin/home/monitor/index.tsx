import { EditOutlined, PlusOutlined, SaveOutlined } from '@ant-design/icons';
import { BaseDrawer, FaFlashCard, FaUtils } from '@fa/ui';
import FaCubeGrid from '@features/fa-admin-pages/components/cube/FaCubeGrid';
import { FaGridLayout } from '@features/fa-admin-pages/components/grid/FaGridLayout';
import { FaGridLayoutUtils } from '@features/fa-admin-pages/components/utils';
import ExportAndImportBtn from '@features/fa-admin-pages/components/utils/ExportAndImportBtn';
import { Alert, Button, Divider, FloatButton, Space } from 'antd';
import { useState } from 'react';
import * as cubes from '@/cubes/monitorcubes';

const biz = 'MONITOR_LAYOUT';
const type = 'LAYOUT';

/**
 * 监控页
 * @author xu.pengfei
 * @date 2023/1/3 16:13
 */
export default function Monitor() {
  const {
    layout,
    saveError,
    saveStatus,
    retryLayout,
    onLayoutChange,
    handleAdd,
    handleDel,
    handleClearLayout,
    handleSaveCurAsDefault,
    handleClearAllUserConfig,
  } = FaGridLayoutUtils.useGridLayoutConfig(cubes, biz, type, []);

  const { allLayout } = FaGridLayoutUtils.useAllLayout(cubes as any);
  const [editing, setEditing] = useState(false);
  const [open, setOpen] = useState(false);

  const inIds: string[] = layout.map((i) => i.i);

  return (
    <div className="fa-full-content-p12">
      {saveError && !open && (
        <Alert
          type="error"
          showIcon
          title="监控页布局保存失败"
          description="当前调整尚未成功保存，请重试。"
          action={<Button onClick={retryLayout}>重试</Button>}
          style={{ marginBottom: 12 }}
        />
      )}
      <FaGridLayout
        layout={layout}
        renderItem={(i) => {
          const Component = (cubes as any)[i.i];
          if (Component) {
            return (
              <FaFlashCard title={Component.title} titleRender={Component.titleRender} hideTitle={!Component.showTitle}>
                <Component />
              </FaFlashCard>
            );
          }
          return <FaFlashCard>Component {i.i} Not Found</FaFlashCard>;
        }}
        onLayoutChange={onLayoutChange}
        rowHeight={20}
        cols={24}
        isDraggable={editing}
        isResizable={editing}
      />
      <div style={{ height: 12, width: '100%' }} />

      <BaseDrawer open={open} title="添加组件" bodyStyle={{ padding: 0 }} onClose={() => setOpen(false)}>
        <Space direction="vertical" size="small" className="fa-p12">
          <Space wrap>
            <Button onClick={handleClearLayout} danger>
              清空当前布局
            </Button>
            <Button onClick={handleSaveCurAsDefault}>保存当前为默认</Button>
          </Space>
          <Divider orientation="left" plain style={{ margin: '4px 0' }}>
            高级操作
          </Divider>
          <Space wrap>
            <ExportAndImportBtn
              filename="监控页"
              layout={FaUtils.tryFormatJson(JSON.stringify(layout))}
              allowedIds={Object.keys(cubes)}
              onUpload={onLayoutChange}
            />
            <Button onClick={handleClearAllUserConfig} danger>
              清空全部用户缓存
            </Button>
          </Space>
        </Space>
        <FaCubeGrid allLayout={allLayout} cubes={cubes as any} selectedIds={inIds} onAdd={handleAdd} onRemove={handleDel} />
        <div className="fa-p12" aria-live="polite">
          {saveStatus === 'saving' && <Alert type="info" showIcon message="保存中..." />}
          {saveStatus === 'error' && (
            <Alert
              type="error"
              showIcon
              message="保存失败"
              description="当前布局未成功保存，请重试。"
              action={
                <Button size="small" type="link" onClick={retryLayout}>
                  重试
                </Button>
              }
            />
          )}
          {saveStatus === 'saved' && <Alert type="success" showIcon message="已保存" />}
        </div>
      </BaseDrawer>

      <FloatButton.Group shape="square">
        <FloatButton icon={<PlusOutlined />} onClick={() => setOpen(true)} />
        <FloatButton onClick={() => setEditing(!editing)} icon={editing ? <SaveOutlined /> : <EditOutlined />} />
      </FloatButton.Group>
    </div>
  );
}
