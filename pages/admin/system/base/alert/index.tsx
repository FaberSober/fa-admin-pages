import React, { useState, useEffect, useCallback } from 'react';
import { DownloadOutlined, SearchOutlined, CheckCircleOutlined, ClockCircleOutlined, ExclamationCircleOutlined, PercentageOutlined } from '@ant-design/icons';
import { Button, Form, Input, Space, Row, Col, Card, Statistic, Typography, Select } from 'antd';
import { AuthDelBtn, BaseBizTable, BaseTableUtils, clearForm, type FaberTable, useDelete, useExport, useTableQueryParams, BaseBoolRadio } from '@fa/ui';
import { alertApi as api } from '@features/fa-admin-pages/services';
import { dictApi } from '@features/fa-admin-pages/services';
import type { Admin } from '@/types';
import AlertModal from './modal/AlertModal';

const { Text } = Typography;
const { Option } = Select;

const serviceName = '';
const biz = 'base_alert';

export default function AlertList() {
  const [form] = Form.useForm();
  const [alertTypeOptions, setAlertTypeOptions] = useState<{ label: string; value: string }[]>([]);

  const defaultQueryParams = {
    deleted: false
  };

  const { queryParams, setFormValues, handleTableChange, setSceneId, setConditionList, fetchPageList, loading, list, paginationProps } =
    useTableQueryParams<Admin.Alert>(api.page, defaultQueryParams, serviceName);

  const [handleDelete] = useDelete<number>(api.remove, fetchPageList, serviceName);
  const [exporting, fetchExportExcel] = useExport(api.exportExcel, queryParams);

  const [statistic, setStatistic] = useState({
    total: 0,
    processed: 0,
    unprocessed: 0,
    processingRate: 0
  });
  const [statisticLoading, setStatisticLoading] = useState(false);

  /** 获取并筛选告警类型（修复数据解析逻辑） */
  const fetchAlertTypeDict = useCallback(async () => {
    try {
      const response = await dictApi.getByCode('alert.type');
      // 关键修复：从 response.data.options 中获取选项数组
      const allOptions = response?.data?.options || [];

      // 筛选未删除的选项
      const validOptions = allOptions.filter((item: any) => {
        return item.deleted === false || item.deleted === 'false';
      });

      // 转换为Select需要的格式
      setAlertTypeOptions(
        validOptions.map((item: any) => ({
          label: item.label || item.value,
          value: item.value
        }))
      );
    } catch (error) {
      console.error('获取告警类型字典失败:', error);
      setAlertTypeOptions([]);
    }
  }, []);

  /** 统计数据计算 */
  const fetchStatistics = useCallback(async () => {
    setStatisticLoading(true);
    try {
      const total = list.length;
      const processed = list.filter(item => item.deal).length;
      const unprocessed = total - processed;
      const processingRate = total > 0 ? Number((processed / total * 100).toFixed(2)) : 0;
      setStatistic({ total, processed, unprocessed, processingRate });
    } catch (error) {
      console.error('获取告警统计数据失败:', error);
    } finally {
      setStatisticLoading(false);
    }
  }, [list]);

  useEffect(() => {
    fetchAlertTypeDict();
    fetchStatistics();
  }, [fetchAlertTypeDict, fetchStatistics]);

  useEffect(() => {
    if (!loading) {
      fetchStatistics();
    }
  }, [loading, fetchStatistics]);

  /** 生成表格列 */
  function genColumns() {
    const { sorter } = queryParams;
    return [
      BaseTableUtils.genIdColumn('ID', 'id', 70, sorter),
      BaseTableUtils.genSimpleSorterColumn('告警内容', 'content', undefined, sorter),
      BaseTableUtils.genSimpleSorterColumn('告警类型', 'type', 150, sorter),
      BaseTableUtils.genBoolSorterColumn('是否处理', 'deal', 100, sorter),
      BaseTableUtils.genSimpleSorterColumn('负责人', 'dutyStaff', 100, sorter),
      BaseTableUtils.genSimpleSorterColumn('处理人', 'dealStaff', 100, sorter),
      BaseTableUtils.genSimpleSorterColumn('处理时间', 'dealTime', 100, sorter),
      BaseTableUtils.genSimpleSorterColumn('处理描述', 'dealDesc', 100, sorter),
      ...BaseTableUtils.genCtrColumns(sorter),
      ...BaseTableUtils.genUpdateColumns(sorter),
      {
        title: '操作',
        dataIndex: 'menu',
        render: (_, r) => (
          <Space>
            <AlertModal editBtn title={`编辑${serviceName}信息`} record={r} fetchFinish={fetchPageList} />
            <AuthDelBtn handleDelete={() => handleDelete(r.id)} />
          </Space>
        ),
        width: 120,
        fixed: 'right',
        tcRequired: true,
        tcType: 'menu',
      },
    ] as FaberTable.ColumnsProp<Admin.Alert>[];
  }

  const statisticCards = [
    {
      title: '总预警数',
      value: statistic.total,
      icon: <ExclamationCircleOutlined />,
      theme: { main: '#1890ff', bg: '#e6f7ff', text: '#0050b3' }
    },
    {
      title: '已处理数',
      value: statistic.processed,
      icon: <CheckCircleOutlined />,
      theme: { main: '#52c41a', bg: '#f6ffed', text: '#238636' }
    },
    {
      title: '未处理数',
      value: statistic.unprocessed,
      icon: <ClockCircleOutlined />,
      theme: { main: '#faad14', bg: '#fffbe6', text: '#d48806' }
    },
    {
      title: '处置率',
      value: statistic.processingRate,
      formatter: (v: number) => `${v}%`,
      icon: <PercentageOutlined />,
      theme: { main: '#722ed1', bg: '#f9f0ff', text: '#531dab' }
    }
  ];

  return (
    <div className="fa-full-content fa-flex-column fa-bg-white">
      {/* 统计卡片区域 */}
      <div style={{
        padding: '24px 16px',
        background: '#fafafa',
        borderBottom: '1px solid #f0f0f0'
      }}>
        <Row gutter={[24, 0]} justify="center">
          {statisticCards.map((item, index) => (
            <Col xs={24} sm={12} md={6} key={index} style={{ padding: '0 12px' }}>
              <Card
                bordered={false}
                style={{
                  backgroundColor: '#fff',
                  borderRadius: '10px',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                  transition: 'all 0.3s ease',
                  height: '100%'
                }}
                hoverable
              >
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '20px 16px'
                }}>
                  <div style={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    backgroundColor: item.theme.bg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '16px',
                    color: item.theme.main,
                    fontSize: '24px'
                  }}>
                    {item.icon}
                  </div>
                  <Statistic
                    value={item.value}
                    valueStyle={{
                      fontSize: '28px',
                      fontWeight: 600,
                      color: item.theme.text,
                      marginBottom: '8px'
                    }}
                    loading={statisticLoading}
                    formatter={item.formatter}
                  />
                  <Text style={{
                    fontSize: '14px',
                    color: '#666',
                    fontWeight: 500
                  }}>
                    {item.title}
                  </Text>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      {/* 查询表单区域 */}
      <div style={{
        padding: '16px',
        borderBottom: '1px solid #f0f0f0',
        background: '#fff'
      }}>
        <div className="fa-h3" style={{ marginBottom: '12px' }}>
          {serviceName || '告警信息'}
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          marginRight: '5%'
        }}>
          <Form
            form={form}
            layout="inline"
            onFinish={setFormValues}
            style={{ display: 'flex', alignItems: 'center' }}
          >
            <Form.Item
              name="content"
              label="告警内容："
              labelCol={{ span: 7 }}
              wrapperCol={{ span: 20 }}
              style={{ marginRight: '14px' }}
            >
              <Input placeholder="请输入告警内容" allowClear style={{ width: 180 }} />
            </Form.Item>

            <Form.Item
              name="type"
              label="告警类型："
              labelCol={{ span: 7 }}
              wrapperCol={{ span: 20 }}
              style={{ marginRight: '14px' }}
            >
              <Select
                placeholder="请选择告警类型"
                allowClear
                style={{ width: 160 }}
                showSearch
                optionFilterProp="children"
              >
                {alertTypeOptions.map((item) => (
                  <Option key={item.value} value={item.value}>
                    {item.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="deal"
              label="是否处理："
              labelCol={{ span: 7 }}
              wrapperCol={{ span: 18 }}
              style={{ marginRight: '12px' }}
            >
              <Select
                placeholder="请选择处理状态"
                allowClear
                style={{ width: 160 }}
              >
                <Option value={true}>是</Option>
                <Option value={false}>否</Option>
              </Select>
            </Form.Item>

            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                icon={<SearchOutlined />}
              >
                查询
              </Button>
              <Button onClick={() => clearForm(form)}>重置</Button>
              <AlertModal addBtn title={`新增${serviceName || '告警'}信息`} fetchFinish={fetchPageList} />
              <Button
                type="primary"
                loading={exporting}
                icon={<DownloadOutlined />}
                onClick={fetchExportExcel}
              >
                导出
              </Button>
            </Space>
          </Form>
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
        refreshList={() => {
          fetchPageList();
          fetchStatistics();
        }}
        batchDelete={(ids) => api.removeBatchByIds(ids)}
        onSceneChange={(v) => setSceneId(v)}
        onConditionChange={(cL) => setConditionList(cL)}
        style={{ flex: 1, margin: 0 }}
      />
    </div>
  );
}
