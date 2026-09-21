import { EditOutlined, PlusOutlined, SaveOutlined } from '@ant-design/icons';
import { FaFlashCard } from '@fa/ui';
import FaWorkbenchConfigDrawer from '@features/fa-admin-pages/components/cube/FaWorkbenchConfigDrawer';
import { FaGridLayout } from '@features/fa-admin-pages/components/grid/FaGridLayout';
import { FaGridLayoutUtils } from '@features/fa-admin-pages/components/utils';
import { Alert, Button, FloatButton } from 'antd';
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

      <FaWorkbenchConfigDrawer
        open={open}
        onClose={() => setOpen(false)}
        filename="监控页"
        layout={layout}
        allLayout={allLayout}
        cubes={cubes as any}
        selectedIds={inIds}
        onLayoutChange={onLayoutChange}
        onAdd={handleAdd}
        onRemove={handleDel}
        saveStatus={saveStatus}
        retryLayout={retryLayout}
        handleClearLayout={handleClearLayout}
        handleSaveCurAsDefault={handleSaveCurAsDefault}
        handleClearAllUserConfig={handleClearAllUserConfig}
      />

      <FloatButton.Group shape="square">
        <FloatButton icon={<PlusOutlined />} onClick={() => setOpen(true)} />
        <FloatButton onClick={() => setEditing(!editing)} icon={editing ? <SaveOutlined /> : <EditOutlined />} />
      </FloatButton.Group>
    </div>
  );
}
