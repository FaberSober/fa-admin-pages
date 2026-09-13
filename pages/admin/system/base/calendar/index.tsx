import { CalendarOutlined, CheckCircleOutlined, CloudSyncOutlined, CloudUploadOutlined, EditOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { calendarApi, calendarDayApi } from '@features/fa-admin-pages/services';
import {
  Alert,
  Button,
  Card,
  Col,
  DatePicker,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  message,
  Row,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
} from 'antd';
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

const OA_DAY_TYPES: Admin.CalendarDayType[] = ['HOLIDAY', 'MAKEUP_WORKDAY'];
const TRADING_DAY_TYPES: Admin.CalendarDayType[] = ['EXCHANGE_CLOSED', 'SPECIAL_TRADING_DAY'];

const CALENDAR_TYPE_OPTIONS = [
  { value: 'OA', label: '工作日历' },
  { value: 'TRADING', label: '业务日历' },
];

const IMPORT_EXAMPLE = JSON.stringify(
  [
    { calendarDate: '2026-10-01', dayType: 'HOLIDAY', isOpen: false, holidayName: '国庆节', remark: '' },
    { calendarDate: '2026-10-10', dayType: 'MAKEUP_WORKDAY', isOpen: true, holidayName: '国庆节调休', remark: '' },
  ],
  null,
  2,
);

const TRADING_IMPORT_EXAMPLE = JSON.stringify(
  [
    { calendarDate: '2026-10-01', dayType: 'EXCHANGE_CLOSED', isOpen: false, holidayName: '国庆节', remark: '' },
    { calendarDate: '2026-10-10', dayType: 'SPECIAL_TRADING_DAY', isOpen: true, holidayName: '周末开市', remark: '' },
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

function getDayTypeOptions(calendar?: Admin.BaseCalendar, currentValue?: Admin.CalendarDayType) {
  const allowedTypes =
    calendar?.calendarType === 'OA' ? OA_DAY_TYPES : calendar?.calendarType === 'TRADING' ? TRADING_DAY_TYPES : DAY_TYPE_OPTIONS.map((option) => option.value);
  const options = DAY_TYPE_OPTIONS.filter((option) => allowedTypes.includes(option.value));
  if (currentValue && !options.some((option) => option.value === currentValue)) {
    const currentOption = DAY_TYPE_OPTIONS.find((option) => option.value === currentValue);
    if (currentOption) options.push({ ...currentOption, label: `${currentOption.label}（已有记录）` });
  }
  return options;
}

function formatDateTime(value?: string | null) {
  return value ? dayjs(value).format('YYYY-MM-DD HH:mm:ss') : '—';
}

function isDateText(value: string) {
  const parsed = dayjs(value);
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && parsed.isValid() && parsed.format('YYYY-MM-DD') === value;
}

function getImportRequest(values: ImportFormValues, calendarCode: string, allowedOptions = DAY_TYPE_OPTIONS): Admin.CalendarDayImportRequest {
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
    if (!allowedOptions.some((option) => option.value === meta.value)) throw new Error(`第 ${index + 1} 行日期类型不适用于当前日历`);
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
  const [externalPreviewModalOpen, setExternalPreviewModalOpen] = useState(false);
  const [externalPreview, setExternalPreview] = useState<Admin.CalendarExternalImportPreview>();
  const [externalPreviewLoading, setExternalPreviewLoading] = useState(false);
  const [externalPublishLoading, setExternalPublishLoading] = useState(false);

  const selectedCalendar = useMemo(() => calendars.find((item) => item.calendarCode === selectedCode), [calendars, selectedCode]);
  const dayTypeOptions = useMemo(() => getDayTypeOptions(selectedCalendar, editingDay?.dayType), [selectedCalendar, editingDay?.dayType]);

  function loadCalendars() {
    setCalendarLoading(true);
    calendarApi
      .page({ current: 1, pageSize: 100, sorter: 'id ASC' })
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
    const dayType = record?.dayType ?? (selectedCalendar?.calendarType === 'TRADING' ? 'EXCHANGE_CLOSED' : 'HOLIDAY');
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
    importForm.setFieldsValue({
      source: 'MANUAL',
      sourceVersion: '',
      json: selectedCalendar?.calendarType === 'TRADING' ? TRADING_IMPORT_EXAMPLE : IMPORT_EXAMPLE,
    });
    setImportModalOpen(true);
  }

  async function previewImport() {
    if (!selectedCode) return;
    const values = await importForm.validateFields();
    let request: Admin.CalendarDayImportRequest;
    try {
      request = getImportRequest(values, selectedCode, getDayTypeOptions(selectedCalendar));
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
        message.success('日期事实已发布；如影响关联业务数据，请按需重建对应日期');
        setPreviewModalOpen(false);
        setImportModalOpen(false);
        loadDays();
      })
      .catch(() => message.error('发布日历失败'))
      .finally(() => setPublishLoading(false));
  }

  function previewExternalImport() {
    setExternalPreviewLoading(true);
    calendarDayApi
      .previewExternal(year)
      .then((response) => {
        if (!response.data) return;
        setExternalPreview(response.data);
        setExternalPreviewModalOpen(true);
      })
      .catch(() => message.error('获取外部年度日历失败，请检查外部数据源配置'))
      .finally(() => setExternalPreviewLoading(false));
  }

  function publishExternalImport() {
    if (!externalPreview) return;
    setExternalPublishLoading(true);
    calendarDayApi
      .publishExternal({ year: externalPreview.year, imports: externalPreview.imports })
      .then((response) => {
        if (!response.data) return;
        message.success('年度日历已发布；如影响关联业务数据，请按需重建');
        setExternalPreviewModalOpen(false);
        setYear(externalPreview.year);
        loadDays(selectedCode, externalPreview.year);
      })
      .catch(() => message.error('发布外部年度日历失败'))
      .finally(() => setExternalPublishLoading(false));
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

  const externalPreviewColumns: ColumnsType<Admin.CalendarExternalImportCalendarPreview> = [
    { title: '日历', dataIndex: 'calendarCode', width: 120, render: (value: string) => <Typography.Text code>{value}</Typography.Text> },
    { title: '来源', dataIndex: 'source', width: 150, ellipsis: true },
    { title: '版本', dataIndex: 'sourceVersion', width: 90 },
    { title: '总记录', width: 80, render: (_, record) => record.preview.total },
    { title: '新增', width: 70, render: (_, record) => record.preview.added },
    { title: '修改', width: 70, render: (_, record) => record.preview.changed },
    { title: '未变化', width: 80, render: (_, record) => record.preview.unchanged },
  ];

  return (
    <div className="calendarMaintenancePage">
      <section className="calendarMaintenanceHero">
        <div>
          <Typography.Title level={2}>统一日历</Typography.Title>
          <Typography.Paragraph>
            维护各业务使用的日历定义和日期例外事实。日历编码彼此独立，未录入日期按默认规则处理；发布后可供业务模块和外部端共享。
          </Typography.Paragraph>
        </div>
        <Space wrap>
          <Button type="primary" icon={<CloudSyncOutlined />} loading={externalPreviewLoading} onClick={previewExternalImport}>
            同步今年日历
          </Button>
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
        description="日历只维护覆盖默认规则的例外日期；未录入日期由日历类型按工作日/周末规则推导。日期事实不支持删除，需要撤销时请修正为关闭日期；修改历史日期不会自动覆盖已生成的业务数据，请按需重建。"
      />

      <Modal
        title={`同步 ${externalPreview?.year ?? year} 年外部日历`}
        open={externalPreviewModalOpen}
        width={820}
        confirmLoading={externalPublishLoading}
        okText="确认发布"
        onOk={publishExternalImport}
        onCancel={() => setExternalPreviewModalOpen(false)}
        destroyOnClose
      >
        <Alert
          type="warning"
          showIcon
          message="请确认数据来源后发布"
          description="系统将按配置的数据源生成年度日历例外日期；确认后将一次性幂等更新本次数据。"
        />
        <Table
          style={{ marginTop: 16 }}
          size="small"
          rowKey="calendarCode"
          columns={externalPreviewColumns}
          dataSource={externalPreview?.calendars ?? []}
          pagination={false}
          scroll={{ x: 680 }}
        />
        <Typography.Paragraph type="secondary" style={{ marginTop: 12, marginBottom: 0 }}>
          发布不会删除已有日期事实；若来源修正了已生成业务数据使用的日期，请按需重建对应日期。
        </Typography.Paragraph>
      </Modal>

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
                    <span>已维护例外：{days.length} 条</span>
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
                  locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={`暂无 ${year} 年例外日期，未录入日期按默认规则处理`} /> }}
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
            <Input disabled={Boolean(editingCalendar)} placeholder="例如 COMPANY_WORKDAY" />
          </Form.Item>
          <Form.Item name="name" label="名称" rules={[{ required: true, whitespace: true, max: 64 }]}>
            <Input placeholder="例如公司工作日历" />
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
          <Alert type="info" showIcon message="当前日历只维护例外日期" description="请根据需要选择日期类型；普通日期无需录入。" style={{ marginBottom: 16 }} />
          <Form.Item name="calendarDate" label="日期" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
          </Form.Item>
          <Form.Item name="dayType" label="日期类型" rules={[{ required: true }]}>
            <Select
              options={dayTypeOptions.map(({ value, label }) => ({ value, label }))}
              onChange={(value: Admin.CalendarDayType) => dayForm.setFieldValue('isOpen', getDayTypeMeta(value).open)}
            />
          </Form.Item>
          <Form.Item name="isOpen" label="日历开放" valuePropName="checked">
            <Switch checkedChildren="开放" unCheckedChildren="关闭" disabled />
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
          message="只导入例外日期数组 JSON"
          description="请按当前日历配置选择对应的例外类型；普通日期无需导入，预览确认后才会发布。"
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
            <Typography.Paragraph type="secondary">发布后会以日历日期为业务主键幂等更新；如影响已有业务数据，请按需重建。</Typography.Paragraph>
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
