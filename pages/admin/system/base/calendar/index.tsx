import { CalendarOutlined, CheckCircleOutlined, CloudUploadOutlined, EditOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { calendarApi, calendarDayApi } from '@features/fa-admin-pages/services';
import { Button, Card, Col, DatePicker, Empty, Form, Input, InputNumber, Modal, message, Row, Select, Space, Switch, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { type Dayjs } from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import type { Admin } from '@/types';
import './calendar.css';

const DAY_TYPE_OPTIONS: { value: Admin.CalendarDayType; label: string; open: boolean }[] = [
  { value: 'WORKDAY', label: '工作日', open: true },
  { value: 'WEEKEND', label: '周末', open: false },
  { value: 'HOLIDAY', label: '法定节假日', open: false },
  { value: 'MAKEUP_WORKDAY', label: '调休工作日', open: true },
  { value: 'EXCHANGE_CLOSED', label: '交易所休市日', open: false },
  { value: 'SPECIAL_TRADING_DAY', label: '特殊交易日', open: true },
];

const CALENDAR_TYPE_OPTIONS = [
  { value: 'OA', label: 'OA 工作日历' },
  { value: 'TRADING', label: '交易日历' },
];

const IMPORT_EXAMPLE = JSON.stringify(
  [
    { calendarDate: '2026-10-01', dayType: 'HOLIDAY', isOpen: false, holidayName: '国庆节', remark: '' },
    { calendarDate: '2026-10-10', dayType: 'MAKEUP_WORKDAY', isOpen: true, holidayName: '国庆节调休', remark: '' },
  ],
  null,
  2,
);

interface CalendarFormValues {
  calendarCode: string;
  name: string;
  calendarType: Admin.CalendarType;
  market?: string;
  timezone: string;
  enabled: boolean;
}

interface DayFormValues {
  calendarDate: Dayjs;
  dayType: Admin.CalendarDayType;
  isOpen: boolean;
  holidayName?: string;
  source?: string;
  sourceVersion?: string;
  remark?: string;
}

interface ImportFormValues {
  source?: string;
  sourceVersion?: string;
  json: string;
}

function getDayTypeMeta(value: Admin.CalendarDayType) {
  return DAY_TYPE_OPTIONS.find((option) => option.value === value) ?? DAY_TYPE_OPTIONS[0];
}

function formatDateTime(value?: string | null) {
  return value ? dayjs(value).format('YYYY-MM-DD HH:mm:ss') : '—';
}

function isDateText(value: string) {
  const parsed = dayjs(value);
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && parsed.isValid() && parsed.format('YYYY-MM-DD') === value;
}

function getImportRequest(values: ImportFormValues, calendarCode: string): Admin.CalendarDayImportRequest {
  let parsed: unknown;
  try {
    parsed = JSON.parse(values.json);
  } catch {
    throw new Error('日期 JSON 格式不正确');
  }
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error('日期 JSON 必须是非空数组');
  }
  const days = parsed.map((item, index) => {
    if (!item || typeof item !== 'object') throw new Error(`第 ${index + 1} 行不是对象`);
    const row = item as Record<string, unknown>;
    const calendarDate = typeof row.calendarDate === 'string' ? row.calendarDate : '';
    const dayType = typeof row.dayType === 'string' ? row.dayType : '';
    const meta = DAY_TYPE_OPTIONS.find((option) => option.value === dayType);
    if (!isDateText(calendarDate)) throw new Error(`第 ${index + 1} 行日期无效`);
    if (!meta) throw new Error(`第 ${index + 1} 行日期类型无效`);
    if (typeof row.isOpen !== 'boolean' || row.isOpen !== meta.open) throw new Error(`第 ${index + 1} 行日期类型与 isOpen 不一致`);
    return {
      calendarDate,
      dayType: meta.value,
      isOpen: row.isOpen,
      holidayName: typeof row.holidayName === 'string' ? row.holidayName : undefined,
      remark: typeof row.remark === 'string' ? row.remark : undefined,
    };
  });
  return {
    calendarCode,
    source: values.source?.trim() || 'MANUAL',
    sourceVersion: values.sourceVersion?.trim() || undefined,
    days,
  };
}

export default function CalendarMaintenance() {
  const [calendarForm] = Form.useForm<CalendarFormValues>();
  const [dayForm] = Form.useForm<DayFormValues>();
  const [importForm] = Form.useForm<ImportFormValues>();
  const [calendars, setCalendars] = useState<Admin.BaseCalendar[]>([]);
  const [selectedCode, setSelectedCode] = useState<string>();
  const [days, setDays] = useState<Admin.BaseCalendarDay[]>([]);
  const [year, setYear] = useState(dayjs().year());
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [dayLoading, setDayLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [calendarModalOpen, setCalendarModalOpen] = useState(false);
  const [editingCalendar, setEditingCalendar] = useState<Admin.BaseCalendar>();
  const [dayModalOpen, setDayModalOpen] = useState(false);
  const [editingDay, setEditingDay] = useState<Admin.BaseCalendarDay>();
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [preview, setPreview] = useState<Admin.CalendarDayImportPreview>();
  const [previewRequest, setPreviewRequest] = useState<Admin.CalendarDayImportRequest>();
  const [previewLoading, setPreviewLoading] = useState(false);
  const [publishLoading, setPublishLoading] = useState(false);

  const selectedCalendar = useMemo(() => calendars.find((item) => item.calendarCode === selectedCode), [calendars, selectedCode]);

  function loadCalendars() {
    setCalendarLoading(true);
    calendarApi
      .page({ current: 1, pageSize: 100, sorter: { field: 'id', order: 'ascend' } as any })
      .then((response) => {
        const rows = response.data?.rows ?? [];
        setCalendars(rows);
        setSelectedCode((current) => (current && rows.some((row) => row.calendarCode === current) ? current : rows[0]?.calendarCode));
      })
      .catch(() => message.error('加载日历定义失败'))
      .finally(() => setCalendarLoading(false));
  }

  function loadDays(calendarCode = selectedCode, targetYear = year) {
    if (!calendarCode) {
      setDays([]);
      return;
    }
    setDayLoading(true);
    calendarDayApi
      .year(calendarCode, targetYear)
      .then((response) => setDays(response.data ?? []))
      .catch(() => message.error('加载年度日期事实失败'))
      .finally(() => setDayLoading(false));
  }

  useEffect(() => {
    loadCalendars();
  }, []);

  useEffect(() => {
    loadDays();
  }, [selectedCode, year]);

  function openCalendarModal(record?: Admin.BaseCalendar) {
    setEditingCalendar(record);
    calendarForm.setFieldsValue(
      record ? { ...record } : { calendarCode: '', name: '', calendarType: 'OA', market: '', timezone: 'Asia/Shanghai', enabled: true },
    );
    setCalendarModalOpen(true);
  }

  async function saveCalendar() {
    const values = await calendarForm.validateFields();
    setSaving(true);
    const request = editingCalendar ? calendarApi.update(editingCalendar.id, { ...editingCalendar, ...values }) : calendarApi.save(values);
    request
      .then((response) => {
        if (!response.data) return;
        message.success(editingCalendar ? '日历定义已更新' : '日历定义已创建');
        setCalendarModalOpen(false);
        loadCalendars();
      })
      .catch(() => message.error('保存日历定义失败'))
      .finally(() => setSaving(false));
  }

  function openDayModal(record?: Admin.BaseCalendarDay) {
    if (!selectedCode) return;
    setEditingDay(record);
    const dayType = record?.dayType ?? 'WORKDAY';
    dayForm.setFieldsValue({
      calendarDate: dayjs(record?.calendarDate ?? `${year}-01-01`),
      dayType,
      isOpen: record?.isOpen ?? getDayTypeMeta(dayType).open,
      holidayName: record?.holidayName,
      source: record?.source ?? 'MANUAL',
      sourceVersion: record?.sourceVersion,
      remark: record?.remark,
    });
    setDayModalOpen(true);
  }

  async function saveDay() {
    if (!selectedCode) return;
    const values = await dayForm.validateFields();
    setSaving(true);
    calendarDayApi
      .upsertBatch({
        calendarCode: selectedCode,
        source: values.source?.trim() || 'MANUAL',
        sourceVersion: values.sourceVersion?.trim() || undefined,
        days: [
          {
            calendarDate: values.calendarDate.format('YYYY-MM-DD'),
            dayType: values.dayType,
            isOpen: values.isOpen,
            holidayName: values.holidayName?.trim() || undefined,
            remark: values.remark?.trim() || undefined,
          },
        ],
      })
      .then((response) => {
        if (!response.data) return;
        message.success(editingDay ? '日期事实已修正' : '日期事实已保存');
        setDayModalOpen(false);
        loadDays();
      })
      .catch(() => message.error('保存日期事实失败'))
      .finally(() => setSaving(false));
  }

  function openImportModal() {
    if (!selectedCode) return;
    importForm.setFieldsValue({ source: 'MANUAL', sourceVersion: '', json: IMPORT_EXAMPLE });
    setImportModalOpen(true);
  }

  async function previewImport() {
    if (!selectedCode) return;
    const values = await importForm.validateFields();
    let request: Admin.CalendarDayImportRequest;
    try {
      request = getImportRequest(values, selectedCode);
    } catch (error) {
      message.error(error instanceof Error ? error.message : '导入内容无效');
      return;
    }
    setPreviewLoading(true);
    calendarDayApi
      .preview(request)
      .then((response) => {
        if (!response.data) return;
        setPreviewRequest(request);
        setPreview(response.data);
        setPreviewModalOpen(true);
      })
      .catch(() => message.error('生成导入预览失败'))
      .finally(() => setPreviewLoading(false));
  }

  function publishImport() {
    if (!previewRequest) return;
    setPublishLoading(true);
    calendarDayApi
      .publish(previewRequest)
      .then((response) => {
        if (!response.data) return;
        message.success('日历日期已发布；如影响已生成的每日概览，请手动重建对应日期');
        setPreviewModalOpen(false);
        setImportModalOpen(false);
        loadDays();
      })
      .catch(() => message.error('发布日历失败'))
      .finally(() => setPublishLoading(false));
  }

  const calendarColumns: ColumnsType<Admin.BaseCalendar> = [
    {
      title: '编码',
      dataIndex: 'calendarCode',
      width: 120,
      render: (value: string) => <Typography.Text code>{value}</Typography.Text>,
    },
    { title: '名称', dataIndex: 'name', ellipsis: true },
    {
      title: '状态',
      dataIndex: 'enabled',
      width: 78,
      render: (value: boolean) => <Tag color={value ? 'success' : 'default'}>{value ? '启用' : '停用'}</Tag>,
    },
    {
      title: '操作',
      width: 80,
      render: (_, record) => (
        <Button
          type="link"
          size="small"
          icon={<EditOutlined />}
          onClick={(event) => {
            event.stopPropagation();
            openCalendarModal(record);
          }}
        >
          编辑
        </Button>
      ),
    },
  ];

  const dayColumns: ColumnsType<Admin.BaseCalendarDay> = [
    { title: '日期', dataIndex: 'calendarDate', width: 120 },
    {
      title: '类型',
      dataIndex: 'dayType',
      width: 130,
      render: (value: Admin.CalendarDayType) => <Tag color={getDayTypeMeta(value).open ? 'success' : 'default'}>{getDayTypeMeta(value).label}</Tag>,
    },
    { title: '开放', dataIndex: 'isOpen', width: 70, render: (value: boolean) => (value ? <CheckCircleOutlined style={{ color: '#52c41a' }} /> : '否') },
    { title: '节日/说明', dataIndex: 'holidayName', ellipsis: true, render: (value?: string) => value || '—' },
    { title: '来源', dataIndex: 'source', width: 100, ellipsis: true, render: (value?: string) => value || '—' },
    { title: '版本', dataIndex: 'sourceVersion', width: 100, ellipsis: true, render: (value?: string) => value || '—' },
    { title: '最后更新', dataIndex: 'updTime', width: 160, render: (value?: string) => formatDateTime(value) },
    {
      title: '操作',
      width: 70,
      render: (_, record) => (
        <Button type="link" size="small" onClick={() => openDayModal(record)}>
          修正
        </Button>
      ),
    },
  ];

  const previewColumns: ColumnsType<Admin.BaseCalendarDay & { changeType: string }> = [
    { title: '日期', dataIndex: 'calendarDate', width: 120 },
    { title: '类型', dataIndex: 'dayType', width: 130, render: (value: Admin.CalendarDayType) => getDayTypeMeta(value).label },
    { title: '开放', dataIndex: 'isOpen', width: 70, render: (value: boolean) => (value ? '是' : '否') },
    { title: '节日/说明', dataIndex: 'holidayName', ellipsis: true, render: (value?: string) => value || '—' },
    { title: '变化', dataIndex: 'changeType', width: 70, render: (value: string) => <Tag color={value === '新增' ? 'green' : 'orange'}>{value}</Tag> },
  ];

  const previewRows = [
    ...(preview?.addedDays ?? []).map((item) => ({ ...item, changeType: '新增' })),
    ...(preview?.changedDays ?? []).map((item) => ({ ...item, changeType: '修改' })),
  ];

  return (
    <div className="calendarMaintenancePage">
      <section className="calendarMaintenanceHero">
        <div>
          <Typography.Title level={2}>统一日历</Typography.Title>
          <Typography.Paragraph>
            维护 OA 工作日与交易所开闭市事实。日历编码彼此独立，调休不会把 A 股误判为交易日；发布后可供 OA、量化和外部端共享。
          </Typography.Paragraph>
        </div>
        <Space wrap>
          <Button icon={<ReloadOutlined />} loading={calendarLoading} onClick={loadCalendars}>
            刷新定义
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openCalendarModal()}>
            新增日历
          </Button>
        </Space>
      </section>

      <Alert
        className="calendarMaintenanceImportHint"
        type="info"
        showIcon
        message="维护提示"
        description="日历日期采用最终事实模型，不支持删除；需要撤销时请修正为关闭日期。修改历史日期不会自动覆盖每日概览 JSON，请按需手动重建。"
      />

      <Row gutter={[16, 16]} align="stretch">
        <Col xs={24} lg={9} xl={8}>
          <Card
            className="calendarMaintenanceCard"
            title={
              <Space>
                <CalendarOutlined />
                日历定义
              </Space>
            }
            loading={calendarLoading}
          >
            {calendars.length === 0 ? (
              <Empty description="暂无启用或已维护的日历" />
            ) : (
              <Table
                className="calendarMaintenanceCalendarTable"
                size="small"
                rowKey="id"
                columns={calendarColumns}
                dataSource={calendars}
                pagination={false}
                rowClassName={(record) => (record.calendarCode === selectedCode ? 'calendarMaintenanceSelectedRow' : '')}
                onRow={(record) => ({ onClick: () => setSelectedCode(record.calendarCode) })}
              />
            )}
          </Card>
        </Col>
        <Col xs={24} lg={15} xl={16}>
          <Card
            className="calendarMaintenanceCard"
            title={
              <Space wrap>
                <span>日期事实</span>
                {selectedCalendar && <Tag color={selectedCalendar.calendarType === 'TRADING' ? 'blue' : 'gold'}>{selectedCalendar.name}</Tag>}
              </Space>
            }
            extra={
              <Space wrap>
                <InputNumber min={1970} max={2200} value={year} onChange={(value) => value && setYear(value)} addonBefore="年份" />
                <Button icon={<ReloadOutlined />} loading={dayLoading} disabled={!selectedCode} onClick={() => loadDays()}>
                  刷新
                </Button>
                <Button icon={<CloudUploadOutlined />} disabled={!selectedCode} onClick={openImportModal}>
                  年度导入
                </Button>
                <Button type="primary" icon={<PlusOutlined />} disabled={!selectedCode} onClick={() => openDayModal()}>
                  新增日期
                </Button>
              </Space>
            }
          >
            {!selectedCode ? (
              <Empty description="请先选择一个日历" />
            ) : (
              <>
                {selectedCalendar && (
                  <div className="calendarMaintenanceMeta">
                    <span>编码：{selectedCalendar.calendarCode}</span>
                    <span>时区：{selectedCalendar.timezone}</span>
                    <span>市场：{selectedCalendar.market || '—'}</span>
                    <span>年度事实：{days.length} 条</span>
                  </div>
                )}
                <Table
                  className="calendarMaintenanceDayTable"
                  style={{ marginTop: 12 }}
                  size="small"
                  rowKey={(record) => record.id || `${record.calendarCode}-${record.calendarDate}`}
                  columns={dayColumns}
                  dataSource={days}
                  loading={dayLoading}
                  pagination={{ pageSize: 15, showSizeChanger: true }}
                  locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={`暂无 ${year} 年显式日期事实，未命中日期按周一至周五兜底`} /> }}
                  scroll={{ x: 850 }}
                />
              </>
            )}
          </Card>
        </Col>
      </Row>

      <Modal
        title={editingCalendar ? '编辑日历定义' : '新增日历定义'}
        open={calendarModalOpen}
        confirmLoading={saving}
        onOk={() => void saveCalendar()}
        onCancel={() => setCalendarModalOpen(false)}
        destroyOnClose
      >
        <Form form={calendarForm} layout="vertical">
          <Form.Item name="calendarCode" label="日历编码" rules={[{ required: true, whitespace: true, max: 32 }]}>
            <Input disabled={Boolean(editingCalendar)} placeholder="例如 CN_OA" />
          </Form.Item>
          <Form.Item name="name" label="名称" rules={[{ required: true, whitespace: true, max: 64 }]}>
            <Input placeholder="例如 中国 OA 工作日历" />
          </Form.Item>
          <Space style={{ display: 'flex' }} align="start">
            <Form.Item name="calendarType" label="类型" rules={[{ required: true }]} style={{ flex: 1 }}>
              <Select options={CALENDAR_TYPE_OPTIONS} />
            </Form.Item>
            <Form.Item name="market" label="市场" style={{ flex: 1 }}>
              <Input placeholder="A_SHARE / HK" />
            </Form.Item>
          </Space>
          <Form.Item name="timezone" label="时区" rules={[{ required: true, whitespace: true, max: 64 }]}>
            <Input placeholder="Asia/Shanghai" />
          </Form.Item>
          <Form.Item name="enabled" label="启用" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={editingDay ? '修正日期事实' : '新增日期事实'}
        open={dayModalOpen}
        confirmLoading={saving}
        onOk={() => void saveDay()}
        onCancel={() => setDayModalOpen(false)}
        destroyOnClose
      >
        <Form form={dayForm} layout="vertical">
          <Form.Item name="calendarDate" label="日期" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
          </Form.Item>
          <Form.Item name="dayType" label="日期类型" rules={[{ required: true }]}>
            <Select
              options={DAY_TYPE_OPTIONS.map(({ value, label }) => ({ value, label }))}
              onChange={(value: Admin.CalendarDayType) => dayForm.setFieldValue('isOpen', getDayTypeMeta(value).open)}
            />
          </Form.Item>
          <Form.Item name="isOpen" label="日历开放" valuePropName="checked">
            <Switch checkedChildren="开放" unCheckedChildren="关闭" />
          </Form.Item>
          <Form.Item name="holidayName" label="节日/说明">
            <Input placeholder="例如 春节、国庆节调休" />
          </Form.Item>
          <Space style={{ display: 'flex' }} align="start">
            <Form.Item name="source" label="来源" style={{ flex: 1 }}>
              <Input placeholder="MANUAL / OFFICIAL" />
            </Form.Item>
            <Form.Item name="sourceVersion" label="来源版本" style={{ flex: 1 }}>
              <Input placeholder="例如 2026" />
            </Form.Item>
          </Space>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={3} placeholder="补充说明" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`导入 ${selectedCode ?? ''} 年度日历`}
        open={importModalOpen}
        width={760}
        onOk={() => void previewImport()}
        confirmLoading={previewLoading}
        okText="预览差异"
        onCancel={() => setImportModalOpen(false)}
        destroyOnClose
      >
        <Alert
          type="info"
          showIcon
          message="输入日期数组 JSON"
          description="每项必须包含 calendarDate、dayType、isOpen；日期类型与开放状态需一致。预览确认后才会发布。"
        />
        <Form form={importForm} layout="vertical" style={{ marginTop: 16 }}>
          <Space style={{ display: 'flex' }} align="start">
            <Form.Item name="source" label="来源" style={{ flex: 1 }}>
              <Input placeholder="OFFICIAL" />
            </Form.Item>
            <Form.Item name="sourceVersion" label="来源版本" style={{ flex: 1 }}>
              <Input placeholder="例如 2026-v1" />
            </Form.Item>
          </Space>
          <Form.Item name="json" label="日期 JSON" rules={[{ required: true }]}>
            <Input.TextArea rows={14} spellCheck={false} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`发布 ${preview?.calendarCode ?? ''} 日历差异`}
        open={previewModalOpen}
        width={820}
        confirmLoading={publishLoading}
        okText="确认发布"
        onOk={publishImport}
        onCancel={() => setPreviewModalOpen(false)}
      >
        {preview && (
          <>
            <div className="calendarMaintenancePreviewSummary">
              {[
                ['总记录', preview.total],
                ['新增', preview.added],
                ['修改', preview.changed],
                ['未变化', preview.unchanged],
              ].map(([label, value]) => (
                <div className="calendarMaintenancePreviewMetric" key={label as string}>
                  <Typography.Text type="secondary">{label}</Typography.Text>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
            <Typography.Paragraph type="secondary">发布后会以日历日期为业务主键幂等更新；如影响已有每日概览，请在量化页面显式重建。</Typography.Paragraph>
            <Table
              size="small"
              rowKey={(record) => `${record.calendarDate}-${record.changeType}`}
              columns={previewColumns}
              dataSource={previewRows}
              pagination={{ pageSize: 8 }}
              scroll={{ x: 620 }}
            />
          </>
        )}
      </Modal>
    </div>
  );
}
