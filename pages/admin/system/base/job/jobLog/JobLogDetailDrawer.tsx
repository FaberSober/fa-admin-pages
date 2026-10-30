import { DownloadOutlined, FileTextOutlined, ReloadOutlined } from '@ant-design/icons';
import { BaseDrawer, FaEnums, useApiLoading } from '@fa/ui';
import { jobLogApi } from '@features/fa-admin-pages/services';
import type { Admin } from '@features/fa-admin-pages/types';
import { Alert, Button, Space, Spin, Tag, theme, Tooltip, Typography } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { appendVisibleLog, isLogReadComplete, startJobLogPolling } from './jobLogPolling';

export default function JobLogDetailDrawer({ record }: { record: Admin.JobLog }) {
  const [open, setOpen] = useState(false);
  const { pathname, search } = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [pathname, search]);

  return (
    <>
      <Tooltip title={!record.logPath ? '本次执行未记录详细日志' : undefined}>
        <span><Button type="link" size="small" disabled={!record.logPath} icon={<FileTextOutlined />} onClick={() => setOpen(true)}>查看日志</Button></span>
      </Tooltip>
      <BaseDrawer title={`执行日志 #${record.id}`} size={1000} open={open} onClose={() => setOpen(false)}>
        <JobLogContent key={record.id} record={record} />
      </BaseDrawer>
    </>
  );
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
        <Tag color={status === FaEnums.JobLogStatusEnum.DOING ? 'processing' : status === FaEnums.JobLogStatusEnum.DONE ? 'success' : 'error'}>
          {FaEnums.JOB_LOG_STATUS_MAP[status]}
        </Tag>
        <Typography.Text type="secondary">{polling ? '自动刷新中' : '自动刷新已停止'}</Typography.Text>
        <Button size="small" onClick={() => setFollowing((value) => !value)}>{following ? '暂停跟随' : '继续跟随'}</Button>
        <Button size="small" icon={<ReloadOutlined />} onClick={() => setReloadKey((value) => value + 1)}>重新加载</Button>
        <Button size="small" icon={<DownloadOutlined />} disabled={!available} loading={downloading}
          onClick={() => void jobLogApi.downloadLog(record.id).catch(() => undefined)}>下载日志</Button>
      </Space>
      {notice && <Alert type="info" showIcon title={notice} />}
      {error && <Alert type="error" showIcon title={error} />}
      {trimmed && <Alert type="warning" showIcon title="当前仅展示最近约 200 万字符，请下载日志查看完整内容。" />}
      {!loaded && <Spin aria-label="正在读取日志" />}
      <textarea ref={scrollRef} readOnly spellCheck={false} aria-label="本次执行日志" style={{
        flex: 1, minHeight: 0, overflow: 'auto', margin: 0, padding: 12,
        color: token.colorText, background: token.colorFillAlter, borderRadius: token.borderRadius,
        border: `1px solid ${token.colorBorder}`, resize: 'none',
        fontFamily: token.fontFamilyCode, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere',
      }} value={content || (loaded && available && !error ? '暂无日志输出' : '')} />
    </div>
  );
}
