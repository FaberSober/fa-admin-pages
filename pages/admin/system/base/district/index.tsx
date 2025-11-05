import React, { useState, useEffect } from 'react';
import { DownOutlined, DownloadOutlined, EyeOutlined, SearchOutlined, UpOutlined, UploadOutlined } from '@ant-design/icons';
import { Button, Col, Form, Input, Row, Select, Space, Tag } from 'antd';
import { AuthDelBtn, BaseBizTable, BaseDrawer, BaseTableUtils, clearForm, FaberTable, FaHref, useDelete, useDeleteByQuery, useExport, useTableQueryParams, useViewItem } from '@fa/ui';
import { CommonExcelUploadModal } from '@/components';
import { districtApi as api } from '@/services';
import { userApi } from '@features/fa-admin-pages/services';
import { Htm, Admin } from '@/types';
import DistrictModal from './modal/DistrictModal';
import DistrictView from './cube/DistrictView';

const serviceName = '辖区管理';
const biz = 'htm_base_district';

/** 状态枚举 */
const STATUS_OPTIONS = [
  { label: '禁用', value: 0 },
  { label: '启用', value: 1 },
];

/** 状态枚举 Map */
const STATUS_MAP: Record<number, { text: string; color: string }> = {
  0: { text: '禁用', color: '#ff4d4f' },
  1: { text: '启用', color: '#52c41a' },
};

/**
 * 辖区管理信息检索
 */
export default function DistrictList() {
  const [form] = Form.useForm();
  const [expand, setExpand] = useState(false);
  const [userMap, setUserMap] = useState<Record<string, string>>({}); // 用户ID到姓名的映射

  // 加载用户列表
  useEffect(() => {
    loadUserList();
  }, []);

  async function loadUserList() {
    try {
      const res = await userApi.list({});
      if (res && res.data) {
        const map: Record<string, string> = {};
        res.data.forEach((user: Admin.User) => {
          map[user.id] = user.name;
        });
        setUserMap(map);
      }
    } catch (error) {
      console.error('加载用户列表失败:', error);
    }
  }

  const { queryParams, setFormValues, handleTableChange, setSceneId, setConditionList, fetchPageList, loading, list, paginationProps } =
    useTableQueryParams<Htm.District>(api.page, {}, serviceName);

  const [handleDelete] = useDelete<string>(api.remove, fetchPageList, serviceName);
  const [exporting, fetchExportExcel] = useExport(api.exportExcel, queryParams);
  const [_, deleteByQuery] = useDeleteByQuery(api.removeByQuery, queryParams, fetchPageList);
  const { show, hide, open, item } = useViewItem<Htm.District>(); // 查看详情

  /** 生成表格字段List */
  function genColumns() {
    const { sorter } = queryParams;
    return [
      BaseTableUtils.genSimpleSorterColumn('辖区编码', 'code', 140, sorter),
      BaseTableUtils.genSimpleSorterColumn('辖区名称', 'name', 150, sorter),
      {
        ...BaseTableUtils.genSimpleSorterColumn('负责人', 'responsiblePerson', 120, sorter),
        render: (val) => val ? (userMap[val] || '-') : '-',
      },
      BaseTableUtils.genSimpleSorterColumn('负责人电话', 'responsibleTel', 120, sorter),
      {
        ...BaseTableUtils.genSimpleSorterColumn('状态', 'status', 100, sorter),
        render: (val) => {
          const status = STATUS_MAP[val];
          return status ? <Tag color={status.color}>{status.text}</Tag> : '-';
        },
      },
      BaseTableUtils.genSimpleSorterColumn('备注', 'remark', 200, sorter),
      ...BaseTableUtils.genCtrColumns(sorter),
      ...BaseTableUtils.genUpdateColumns(sorter),
      {
        title: '操作',
        dataIndex: 'opr',
        render: (_, r) => (
          <Space>
            <FaHref icon={<EyeOutlined />} text="查看" onClick={() => show(r)} />
            <DistrictModal editBtn title={`编辑${serviceName}信息`} record={r} fetchFinish={fetchPageList} />
            <AuthDelBtn handleDelete={() => handleDelete(r.id)} />
          </Space>
        ),
        width: 160,
        fixed: 'right',
        tcRequired: true,
        tcType: 'menu',
      },
    ] as FaberTable.ColumnsProp<Htm.District>[];
  }

  /** 表单查询 */
  function handleSearch(values: any) {
    setFormValues(values);
  }

  return (
    <div className="fa-full-content fa-flex-column fa-bg-white">
      {/* 标题和搜索表单区域 */}
      <div className="fa-p8 fa-border-b">
        <div className="fa-h3 mb-4">{serviceName}</div>

        {/* 搜索表单 */}
        <Form form={form} onFinish={handleSearch}>
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item name="code" label="辖区编码">
                <Input placeholder="请输入辖区编码" allowClear />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="name" label="辖区名称">
                <Input placeholder="请输入辖区名称" allowClear />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="responsiblePerson" label="负责人">
                <Select 
                  placeholder="请选择负责人" 
                  allowClear 
                  showSearch 
                  filterOption={(input, option) => {
                    const label = option?.label;
                    if (typeof label === 'string') {
                      return label.toLowerCase().includes(input.toLowerCase());
                    }
                    return false;
                  }}
                >
                  {Object.entries(userMap).map(([id, name]) => (
                    <Select.Option key={id} value={id} label={name}>{name}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="status" label="状态">
                <Select placeholder="请选择状态" allowClear options={STATUS_OPTIONS} />
              </Form.Item>
            </Col>
          </Row>

          {expand && (
            <>
              <Row gutter={16}>
                <Col span={6}>
                  <Form.Item name="responsibleTel" label="负责人电话">
                    <Input placeholder="请输入负责人电话" allowClear />
                  </Form.Item>
                </Col>
              </Row>
            </>
          )}

          <Row>
            <Col span={24} style={{ textAlign: 'right' }}>
              <Space>
                <Button type="primary" htmlType="submit" loading={loading} icon={<SearchOutlined />}>
                  查询
                </Button>
                <Button onClick={() => clearForm(form)}>重置</Button>
                <Button type="link" onClick={() => setExpand(!expand)}>
                  {expand ? (
                    <>
                      收起 <UpOutlined />
                    </>
                  ) : (
                    <>
                      展开 <DownOutlined />
                    </>
                  )}
                </Button>
              </Space>
            </Col>
          </Row>
        </Form>

        {/* 操作按钮区 */}
        <div className="mt-4">
          <Space>
            <DistrictModal addBtn title={`新增${serviceName}信息`} fetchFinish={fetchPageList} />
            <Button loading={exporting} icon={<DownloadOutlined />} onClick={fetchExportExcel}>
              导出
            </Button>
            <CommonExcelUploadModal fetchFinish={fetchPageList} apiDownloadTplExcel={api.exportTplExcel} apiImportExcel={api.importExcel} type={biz}>
              <Button icon={<UploadOutlined />}>上传</Button>
            </CommonExcelUploadModal>
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
        showDeleteByQuery
        onDeleteByQuery={deleteByQuery}
      />

      {/* 详情抽屉 */}
      <BaseDrawer title={`${serviceName}详情`} open={open} onClose={hide} width={900}>
        {item && <DistrictView record={item} />}
      </BaseDrawer>
    </div>
  );
}

