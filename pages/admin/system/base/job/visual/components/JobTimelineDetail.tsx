import { jobLogApi } from '@features/fa-admin-pages/services';
import type { Admin } from '@features/fa-admin-pages/types';
import { useEffect, useState } from 'react';
import JobLogDetailDrawer from '../../jobLog/JobLogDetailDrawer';

export default function JobTimelineDetail({ id, cron, onClose }: { id: number; cron: string | null; onClose: () => void }) {
  const [record, setRecord] = useState<Admin.JobLog | null>(null);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    setRecord(null); setError(false);
    jobLogApi.getById(id).then((response) => {
      if (response.status !== 200 || !response.data) throw new Error('执行记录不存在');
      if (active) setRecord(response.data);
    }).catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, [id, retry]);
  return <JobLogDetailDrawer record={record} recordId={id} cron={cron} defaultOpen hideTrigger onClose={onClose} loadError={error} onRetry={() => setRetry(value => value + 1)} />;
}
