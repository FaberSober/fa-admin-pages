import { BookOutlined, DownloadOutlined, ReloadOutlined, SearchOutlined, UploadOutlined } from '@ant-design/icons';
import { Button, Form, Input, Space, Typography } from 'antd';
import { AuthDelBtn, BaseBizTable, BaseTableUtils, clearForm, FaberTable, useDelete, useDeleteByQuery, useExport, useTableQueryParams } from '@fa/ui';
import { CommonExcelUploadModal } from "@/components";
import { dictDataApi as api } from '@/services';
import { Admin } from '@/types';
import DictDataModal from '../modal/DictDataModal';
import DictDataIsDefaultSwitch from "./DictDataIsDefaultSwitch";
import DictDataValidSwitch from "./DictDataValidSwitch";

const serviceName = '字典值';
const biz = 'base_dict_data';

/**
 * BASE-字典值表格查询
 */
export default function DictDataList() {
  const [form] = Form.useForm();

  const { queryParams, setFormValues, handleTableChange, setSceneId, setConditionList, fetchPageList, loading, list, paginationProps } =
    useTableQueryParams<Admin.DictData>(api.page, {  }, serviceName)

  const [handleDelete] = useDelete<number>(api.remove, fetchPageList, serviceName)
  const [exporting, fetchExportExcel] = useExport(api.exportExcel, queryParams)
  const [_, deleteByQuery] = useDeleteByQuery(api.removeByQuery, queryParams, fetchPageList);

  /** 生成表格字段List */
  function genColumns() {
    const { sorter } = queryParams;
    return [
      BaseTableUtils.genIdColumn('ID', 'id', 70, sorter),
      // BaseTableUtils.genSimpleSorterColumn('上级节点', 'parentId', 100, sorter),
      {
        ...BaseTableUtils.genSimpleSorterColumn('字典分类', 'dictId', 200, sorter),
        render: (_, r) => r.dictName,
      },
      BaseTableUtils.genSimpleSorterColumn('字典键', 'label', 100, sorter),
      BaseTableUtils.genSimpleSorterColumn('字典值', 'value', 100, sorter),
      {
        ...BaseTableUtils.genBoolSorterColumn('默认值', 'isDefault', 100, sorter),
        render: (_, r) => <DictDataIsDefaultSwitch item={r} onChange={fetchPageList} />,
        align: 'center',
      },
      {
        ...BaseTableUtils.genBoolSorterColumn('生效', 'valid', 100, sorter),
        render: (_, r) => <DictDataValidSwitch item={r} onChange={fetchPageList} />,
        align: 'center',
      },
      BaseTableUtils.genSimpleSorterColumn('描述', 'description', undefined, sorter),
      BaseTableUtils.genSimpleSorterColumn('排序', 'sortId', 100, sorter),
      ...BaseTableUtils.genCtrColumns(sorter),
      ...BaseTableUtils.genUpdateColumns(sorter),
      {
        title: '操作',
        dataIndex: 'menu',
        render: (_, r) => (
          <Space>
            <DictDataModal dictId={r.dictId} type='list' editBtn title={`编辑${serviceName}信息`} record={r} fetchFinish={fetchPageList} />
            <AuthDelBtn handleDelete={() => handleDelete(r.id)} />
          </Space>
        ),
        width: 120,
        fixed: 'right',
        tcRequired: true,
        tcType: 'menu',
      },
    ] as FaberTable.ColumnsProp<Admin.DictData>[];
  }

  return (
    <div className="fa-full fa-flex-column fa-islands-content">
      <header className="fa-islands-toolbar">
        <div className="fa-islands-heading">
          <span className="fa-islands-heading-icon">
            <BookOutlined />
          </span>
          <div className="fa-islands-heading-text">
            <div className="fa-h3">{serviceName}</div>
            <Typography.Text type="secondary">管理字典键值、默认项及生效状态</Typography.Text>
          </div>
        </div>
        <Form form={form} layout="inline" onFinish={setFormValues} className="fa-islands-query fa-flex-row-center">
          <Form.Item name="_search" className="fa-islands-query-name">
            <Input prefix={<SearchOutlined />} placeholder="搜索字典内容" aria-label="搜索字典内容" allowClear />
          </Form.Item>

          <Space wrap>
            <Button type="primary" htmlType="submit" loading={loading} icon={<SearchOutlined />}>查询</Button>
            <Button icon={<ReloadOutlined />} onClick={() => clearForm(form)}>重置</Button>
          </Space>
          <Space wrap style={{ marginInlineStart: 'auto' }}>
            <Button loading={exporting} icon={<DownloadOutlined />} onClick={fetchExportExcel}>导出</Button>
            <CommonExcelUploadModal fetchFinish={fetchPageList} apiDownloadTplExcel={api.exportTplExcel} apiImportExcel={api.importExcel} type={biz}>
              <Button icon={<UploadOutlined />}>上传</Button>
            </CommonExcelUploadModal>
          </Space>
        </Form>
      </header>

      <section className="fa-islands-table" aria-label="字典值列表">
        <BaseBizTable
          rowKey="id"
          biz={biz}
          columns={genColumns()}
          pagination={paginationProps}
          loading={loading}
          dataSource={list}
          onChange={handleTableChange}
          refreshList={() => fetchPageList()}
          batchDelete={(ids) => api.removeBatchByIds(ids)}
          onSceneChange={(v) => setSceneId(v)}
          onConditionChange={(cL) => setConditionList(cL)}
          showDeleteByQuery
          onDeleteByQuery={deleteByQuery}
        />
      </section>
    </div>
  );
}
