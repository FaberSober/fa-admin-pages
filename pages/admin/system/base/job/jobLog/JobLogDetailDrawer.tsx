import { DownloadOutlined, FileTextOutlined, ReloadOutlined } from '@ant-design/icons';
import { BaseDrawer, useApiLoading } from '@fa/ui';
import { jobLogApi } from '@features/fa-admin-pages/services';
import type { Admin } from '@features/fa-admin-pages/types';
import { Alert, Button, Space, Spin, theme, Tooltip, Typography } from 'antd';
import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { appendVisibleLog, isLogReadComplete, startJobLogPolling } from './jobLogPolling';
import JobExecutionStatus from '../JobExecutionStatus';

const JobFlowRunPanel = lazy(() => import('../flow/JobFlowRunPanel'));

export default function JobLogDetailDrawer({ record, defaultOpen = false, iconOnly = false, buttonText = '查看日志', onLocateFlow }: { record: Admin.JobLog; defaultOpen?: boolean; iconOnly?: boolean; buttonText?: string; onLocateFlow?: (origin: Admin.JobFlowLogOrigin) => void }) {
  const [open, setOpen] = useState(defaultOpen);
  const [flow, setFlow] = useState<Admin.JobFlowLogOrigin>();
  const { pathname, search } = useLocation();
  useEffect(() => { setFlow(undefined); }, [record.id]);
  const previousLocation = useRef(`${pathname}${search}`);

  useEffect(() => {
    const next = `${pathname}${search}`;
    if (previousLocation.current !== next) { setOpen(false); setFlow(undefined); }
    previousLocation.current = next;
  }, [pathname, search]);

  return (
    <>
      <Tooltip title={!record.logPath && record.triggerSource !== 3 ? '本次执行未记录详细日志' : undefined}>
        <span>
          <Button type={iconOnly ? "text" : "link"} aria-label={`查看执行日志 #${record.id}`} title={iconOnly ? `查看执行日志 #${record.id}` : undefined} size="small" disabled={!record.logPath && record.triggerSource !== 3} icon={<FileTextOutlined />} onClick={() => setOpen(true)}>
            {iconOnly ? null : buttonText}
          </Button>
        </span>
      </Tooltip>
      <BaseDrawer title={`执行日志 #${record.id}`} size={1000} open={open} onClose={() => setOpen(false)}>
        {open && <div className="fa-flex-column" style={{ height: '100%', minHeight: 0, gap: 12 }}>
          <JobLogFlowOrigin key={record.id} id={record.id} onLocate={origin => {
            if (onLocateFlow) { setOpen(false); onLocateFlow(origin); }
            else setFlow(origin);
          }} />
          <div style={{ flex: 1, minHeight: 0 }}><JobLogContent key={record.id} record={record} /></div>
        </div>}
      </BaseDrawer>
      <BaseDrawer title="所属流程运行" size={1100} open={!!flow} onClose={() => setFlow(undefined)}>
        {flow && <div style={{ position: 'relative', height: '100%', minHeight: 500 }}>
          <Suspense fallback={<Spin />}><JobFlowRunPanel key={`${flow.jobId}-${flow.flowLogId}-${flow.nodeId}`} jobId={flow.jobId} initialLogId={flow.flowLogId} initialNodeId={flow.nodeId} onClose={() => setFlow(undefined)} /></Suspense>
        </div>}
      </BaseDrawer>
    </>
  );
}

function JobLogFlowOrigin({ id, onLocate }: { id: number; onLocate: (origin: Admin.JobFlowLogOrigin) => void }) {
  const [origin, setOrigin] = useState<Admin.JobFlowLogOrigin | null>();
  const [failed, setFailed] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const loading = useApiLoading([jobLogApi.getUrl(`flowOrigin/${id}`)]);
  useEffect(() => {
    const controller = new AbortController();
    setOrigin(undefined); setFailed(false);
    jobLogApi.flowOrigin(id, controller.signal).then(response => {
      if (!controller.signal.aborted) setOrigin(response.data);
    }).catch(() => { if (!controller.signal.aborted) setFailed(true); });
    return () => controller.abort();
  }, [id, refresh]);
  if (failed) return <Space><Typography.Text type="secondary">所属流程暂不可用</Typography.Text><Button size="small" type="link" onClick={() => setRefresh(value => value + 1)}>重试</Button></Space>;
  if (!origin) return loading ? <Typography.Text type="secondary">正在读取所属流程…</Typography.Text> : null;
  return <Space wrap size={8}>
    <Typography.Text type="secondary">所属流程</Typography.Text>
    <Typography.Text strong>{origin.flowName || '流程任务'}</Typography.Text>
    <Typography.Text type="secondary">#{origin.flowLogId} · {origin.nodeName || origin.nodeId}</Typography.Text>
    <Button type="link" size="small" onClick={() => onLocate(origin)}>查看流程</Button>
  </Space>;
}

function JobLogContent({ record }: { record: Admin.JobLog }) {
  const { token } = theme.useToken();
  const [preview, setPreview] = useState({ content: '', trimmed: false });
  const { content, trimmed } = preview;
  const [status, setStatus] = useState(record.status);
  const [following, setFollowing] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [available, setAvailable] = useState(false);
  const [polling, setPolling] = useState(true);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const scrollRef = useRef<HTMLTextAreaElement>(null);
  const downloading = useApiLoading([jobLogApi.getUrl(`download/${record.id}`)]);

  useEffect(() => {
    setPreview({ content: '', trimmed: false });
    setLoaded(false);
    setError('');
    setNotice('');
    setPolling(true);
    return startJobLogPolling({
      read: (offset, signal) => jobLogApi.readLog(record.id, offset, signal).then((response) => response.data),
      onChunk: (chunk) => {
        setLoaded(true);
        setAvailable(chunk.available);
        setStatus(chunk.status);
        setNotice(chunk.message || '');
        setPolling(!isLogReadComplete(chunk));
        setPreview((previous) => {
          const next = appendVisibleLog(previous.content, chunk.content);
          return { content: next.content, trimmed: previous.trimmed || next.trimmed };
        });
      },
      onError: () => {
        setLoaded(true);
        setPolling(false);
        setError('读取失败，自动刷新已暂停，请重新加载。');
      },
    });
  }, [record.id, reloadKey]);

  useEffect(() => {
    if (following && scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [content, following]);

  return (
    <div className="fa-flex-column" style={{ height: '100%', gap: 12 }}>
      <Space wrap>
        <JobExecutionStatus status={status} trackingVersion={record.trackingVersion} legacyDuration={record.duration} />
        <Typography.Text type="secondary">{polling ? '自动刷新中' : '自动刷新已停止'}</Typography.Text>
        <Button size="small" onClick={() => setFollowing((value) => !value)}>
          {following ? '暂停跟随' : '继续跟随'}
        </Button>
        <Button size="small" icon={<ReloadOutlined />} onClick={() => setReloadKey((value) => value + 1)}>
          重新加载
        </Button>
        <Button
          size="small"
          icon={<DownloadOutlined />}
          disabled={!available}
          loading={downloading}
          onClick={() => void jobLogApi.downloadLog(record.id).catch(() => undefined)}
        >
          下载日志
        </Button>
      </Space>
      {notice && <Alert type="info" showIcon title={notice} />}
      {error && <Alert type="error" showIcon title={error} />}
      {trimmed && <Alert type="warning" showIcon title="当前仅展示最近约 200 万字符，请下载日志查看完整内容。" />}
      {!loaded && <Spin aria-label="正在读取日志" />}
      <textarea
        ref={scrollRef}
        readOnly
        spellCheck={false}
        aria-label="本次执行日志"
        style={{
          flex: 1,
          minHeight: 0,
          overflow: 'auto',
          margin: 0,
          padding: 12,
          color: token.colorText,
          background: token.colorFillAlter,
          borderRadius: token.borderRadius,
          border: `1px solid ${token.colorBorder}`,
          resize: 'none',
          fontFamily: token.fontFamilyCode,
          whiteSpace: 'pre-wrap',
          overflowWrap: 'anywhere',
        }}
        value={content || (loaded && available && !error ? '暂无日志输出' : '')}
      />
    </div>
  );
}
