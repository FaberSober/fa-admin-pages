import { Fa } from '@fa/ui';
import { rbacMenuApi } from '@features/fa-admin-pages/services';
import { Switch } from 'antd';
import { useEffect, useState } from 'react';
import type { Rbac } from '@/types';

interface MenuStatusSwitchProps {
  item: Rbac.RbacMenu;
  onChange: (status: boolean) => void;
}

type StatusFeedback = 'idle' | 'success' | 'error';

export default function MenuStatusSwitch({ item, onChange }: MenuStatusSwitchProps) {
  const [checked, setChecked] = useState(item.status);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<StatusFeedback>('idle');

  useEffect(() => {
    setChecked(item.status);
  }, [item.status]);

  function handleChange(status: boolean) {
    const prevStatus = checked;
    setChecked(status);
    setFeedback('idle');
    setLoading(true);

    rbacMenuApi
      .update(item.id, { ...item, status })
      .then((res) => {
        if (res.status !== Fa.RES_CODE.OK) {
          setChecked(prevStatus);
          setFeedback('error');
          return;
        }

        onChange(status);
        setFeedback('success');
      })
      .catch(() => {
        setChecked(prevStatus);
        setFeedback('error');
      })
      .finally(() => {
        setLoading(false);
      });
  }

  return (
    <span className="fa-menu-status-control">
      <Switch checkedChildren="启用" unCheckedChildren="禁用" checked={checked} loading={loading} onChange={handleChange} />
      {feedback === 'success' && (
        <output className="fa-menu-status-control__feedback fa-menu-status-control__feedback--success" aria-live="polite">
          已保存
        </output>
      )}
      {feedback === 'error' && (
        <output className="fa-menu-status-control__feedback fa-menu-status-control__feedback--error" aria-live="assertive">
          保存失败，已恢复
        </output>
      )}
    </span>
  );
}
