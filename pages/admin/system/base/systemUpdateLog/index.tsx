import { DownloadOutlined, SearchOutlined } from '@ant-design/icons';
import { BaseBizTable, BaseDrawer, BaseTableUtils, clearForm, type FaberTable, useExport, useTableQueryParams } from '@fa/ui';
import { SearchGrid } from '@features/fa-admin-pages/components';
import FaHrefView from '@features/fa-admin-pages/components/icons/FaHrefView';
import SystemUpdateLogView from '@features/fa-admin-pages/pages/admin/system/base/systemUpdateLog/cube/SystemUpdateLogView';
import { systemUpdateLogApi as api } from '@features/fa-admin-pages/services';
import { Button, Form, Input, InputNumber, Select, Space, Tag } from 'antd';
import type { Admin } from '@/types';

const serviceName = '系统版本更新日志';
const biz = 'base_system_update_log';

/**
 * BASE-系统版本更新日志表表格查询
 */
export default function SystemUpdateLogList() {
  const [form] = Form.useForm();

  const { queryParams, setFormValues, handleTableChange, setSceneId, setConditionList, fetchPageList, loading, list, paginationProps } =
    useTableQueryParams<Admin.SystemUpdateLog>(api.page, {}, serviceName);

  const [exporting, fetchExportExcel] = useExport(api.exportExcel, queryParams);

  /** 生成表格字段List */
  function genColumns() {
    const { sorter } = queryParams;
    return [
      BaseTableUtils.genIdColumn('ID', 'id', 70, sorter),
      BaseTableUtils.genSimpleSorterColumn('模块编码', 'no', 100, sorter),
      BaseTableUtils.genSimpleSorterColumn('模块名称', 'name', 100, sorter),
      BaseTableUtils.genSimpleSorterColumn('版本编码', 'verNo', 100, sorter),
      {
        ...BaseTableUtils.genSimpleSorterColumn('状态', 'status', 80, sorter),
        render: (status) => {
          if (status === 1) return <Tag color="success">成功</Tag>;
          if (status === 9) return <Tag color="error">失败</Tag>;
          return <Tag>未记录</Tag>;
        },
      },
      BaseTableUtils.genEllipsisSorterColumn('SQL文件', 'fileName', 200, sorter),
      {
        ...BaseTableUtils.genSimpleSorterColumn('耗时', 'durationMs', 100, sorter),
        render: (durationMs) => (durationMs == null ? '-' : `${durationMs} ms`),
      },
      BaseTableUtils.genEllipsisSorterColumn('备注信息', 'remark', 200, sorter),
      BaseTableUtils.genSimpleSorterColumn('执行时间', 'crtTime', 165, sorter),
      {
        title: '操作',
        dataIndex: 'menu',
        render: (_, r) => (
          <Space>
            <BaseDrawer triggerDom={<FaHrefView />} size={1000}>
              <SystemUpdateLogView record={r} />
            </BaseDrawer>
          </Space>
        ),
        width: 70,
        fixed: 'right',
        tcRequired: true,
        tcType: 'menu',
      },
    ] as FaberTable.ColumnsProp<Admin.SystemUpdateLog>[];
  }

  return (
    <div className="fa-full-content-p12 fa-flex-column fa-content">
      <SearchGrid
        form={form}
        onFinish={setFormValues}
        defaultCount={4}
        className="fa-mtb12"
        btns={
          <>
            <Button type="primary" htmlType="submit" loading={loading} icon={<SearchOutlined />}>
              查询
            </Button>
            <Button onClick={() => clearForm(form)}>重置</Button>
            <Button loading={exporting} icon={<DownloadOutlined />} onClick={fetchExportExcel}>
              导出
            </Button>
          </>
        }
      >
        <Form.Item name="no" label="模块编码">
          <Input placeholder="请输入模块编码" allowClear />
        </Form.Item>
        <Form.Item name="ver" label="版本号">
          <InputNumber placeholder="请输入版本号" min={0} precision={0} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="verNo" label="版本编码">
          <Input placeholder="请输入版本编码" allowClear />
        </Form.Item>
        <Form.Item name="status" label="执行状态">
          <Select
            placeholder="请选择执行状态"
            allowClear
            options={[
              { value: 1, label: '成功' },
              { value: 9, label: '失败' },
            ]}
          />
        </Form.Item>
      </SearchGrid>

      <BaseBizTable
        rowKey="id"
        biz={biz}
        showCheckbox={false}
        showBatchDelBtn={false}
        columns={genColumns()}
        pagination={paginationProps}
        loading={loading}
        dataSource={list}
        onChange={handleTableChange}
        refreshList={() => fetchPageList()}
        onSceneChange={(v) => setSceneId(v)}
        onConditionChange={(cL) => setConditionList(cL)}
      />
    </div>
  );
}
