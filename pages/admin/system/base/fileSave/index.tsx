import React from 'react';
import { DownloadOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Form, Input, Space } from 'antd';
import { AuthDelBtn, BaseBizTable, BaseTableUtils, clearForm, FaberTable, FaUtils, useDelete, useExport, useTableQueryParams } from '@fa/ui';
import { fileSaveApi as api } from '@/services';
import { Admin } from '@/types';
import FileSaveModal from './modal/FileSaveModal';

const serviceName = '附件管理';
const biz = 'base_file_save';

/**
 * BASE-用户文件表表格查询
 */
export default function FileSaveList() {
  const [form] = Form.useForm();

  const { queryParams, setFormValues, handleTableChange, setSceneId, setConditionList, fetchPageList, loading, list, paginationProps } =
    useTableQueryParams<Admin.FileSave>(api.page, {sorter: {field: 'crtTime', order: "descend"}}, serviceName)

  const [handleDelete] = useDelete<string>(api.remove, fetchPageList, serviceName)
  const [exporting, fetchExportExcel] = useExport(api.exportExcel, queryParams)

  /** 生成表格字段List */
  function genColumns() {
    const { sorter } = queryParams;
    return [
      BaseTableUtils.genIdColumn('ID', 'id', 280, sorter, false),
      {
        ...BaseTableUtils.genSimpleSorterColumn('原始文件名', 'originalFilename', undefined, sorter),
        render: (v, r) => <a href={api.genLocalGetFile(r.id)} target="_blank">{v}</a>
      },
      BaseTableUtils.genSimpleSorterColumn('文件存储地址', 'url', undefined, sorter),
      {
        ...BaseTableUtils.genSimpleSorterColumn('文件大小', 'size', 100, sorter),
        render: v => FaUtils.sizeToHuman(v),
      },
      BaseTableUtils.genSimpleSorterColumn('文件名', 'filename', 100, sorter, false),
      BaseTableUtils.genSimpleSorterColumn('基础存储路径', 'basePath', 100, sorter, false),
      BaseTableUtils.genSimpleSorterColumn('存储路径', 'path', 100, sorter, false),
      BaseTableUtils.genSimpleSorterColumn('扩展名', 'ext', 100, sorter),
      BaseTableUtils.genSimpleSorterColumn('MIME类型', 'contentType', 100, sorter, false),
      BaseTableUtils.genSimpleSorterColumn('存储平台', 'platform', 100, sorter),
      BaseTableUtils.genSimpleSorterColumn('缩略图访问路径', 'thUrl', 100, sorter, false),
      BaseTableUtils.genSimpleSorterColumn('缩略图名称', 'thFilename', 100, sorter, false),
      BaseTableUtils.genSimpleSorterColumn('缩略图大小，单位字节', 'thSize', 100, sorter, false),
      BaseTableUtils.genSimpleSorterColumn('缩略图MIME类型', 'thContentType', 100, sorter, false),
      BaseTableUtils.genSimpleSorterColumn('文件所属对象id', 'objectId', 100, sorter, false),
      BaseTableUtils.genSimpleSorterColumn('文件所属对象类型，例如用户头像，评价图片', 'objectType', 100, sorter, false),
      BaseTableUtils.genSimpleSorterColumn('附加属性', 'attr', 100, sorter, false),
      BaseTableUtils.genSimpleSorterColumn('文件MD5', 'md5', 100, sorter, false),
      ...BaseTableUtils.genCtrColumns(sorter),
      ...BaseTableUtils.genUpdateColumns(sorter),
      {
        title: '操作',
        dataIndex: 'menu',
        render: (_, r) => (
          <Space>
            <FileSaveModal editBtn title={`编辑${serviceName}信息`} record={r} fetchFinish={fetchPageList} />
            <AuthDelBtn handleDelete={() => handleDelete(r.id)} />
          </Space>
        ),
        width: 120,
        fixed: 'right',
        tcRequired: true,
        tcType: 'menu',
      },
    ] as FaberTable.ColumnsProp<Admin.FileSave>[];
  }

  return (
    <div className="fa-full-content fa-flex-column fa-bg-white">
      <div style={{ display: 'flex', alignItems: 'center', position: 'relative', padding: 8 }}>
        <strong style={{ fontSize: '18px' }}>{serviceName}</strong>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
          <Form form={form} layout="inline" onFinish={setFormValues}>
            <Form.Item name="search" label="搜索">
              <Input placeholder="请输入搜索内容" />
            </Form.Item>
          </Form>

          <Space>
            <Button onClick={() => form.submit()} loading={loading} icon={<SearchOutlined />}>查询</Button>
            <Button onClick={() => clearForm(form)} loading={loading}>重置</Button>
            <FileSaveModal addBtn title={`新增${serviceName}信息`} fetchFinish={fetchPageList} />
            <Button loading={exporting} icon={<DownloadOutlined />} onClick={fetchExportExcel}>导出</Button>
          </Space>
        </div>
      </div>

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
      />
    </div>
  );
}
